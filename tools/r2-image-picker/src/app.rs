use std::collections::{HashMap, HashSet};
use std::io::Stdout;
use std::sync::Arc;
use std::time::Duration;

use arboard::Clipboard;
use color_eyre::eyre::{Result, WrapErr};
use crossterm::event::{Event as CtEvent, EventStream, KeyCode, KeyEvent, KeyEventKind};
use image::DynamicImage;
use ratatui::Terminal;
use ratatui::backend::CrosstermBackend;
use ratatui::widgets::ListState;
use ratatui_image::picker::Picker;
use ratatui_image::protocol::StatefulProtocol;
use tokio::sync::mpsc;
use tokio_stream::StreamExt;

use crate::r2::{R2, R2Object};
use crate::ui;

pub enum Action {
    Quit,
    SelectUp,
    SelectDown,
    Reload,
    CopyToClipboard,
    ObjectsLoaded(Vec<R2Object>),
    ListFailed(String),
    PreviewLoaded {
        generation: u64,
        key: String,
        image: DynamicImage,
    },
    PreviewFailed {
        generation: u64,
        key: String,
        message: String,
    },
    DimsResolved {
        generation: u64,
        key: String,
        dims: Option<(u32, u32)>,
    },
}

pub struct App {
    r2: R2,
    pub objects: Vec<R2Object>,
    pub list_state: ListState,
    pub message: Option<Message>,
    pub objects_loading: bool,
    picker: Picker,
    pub image_protocol: Option<StatefulProtocol>,
    image_cache: HashMap<String, Arc<DynamicImage>>,
    image_dims_cache: HashMap<String, (u32, u32)>,
    pub current_key: Option<String>,
    preview_in_flight: HashSet<String>,
    dims_in_flight: HashSet<String>,
    generation: u64,
    action_tx: mpsc::UnboundedSender<Action>,
    action_rx: Option<mpsc::UnboundedReceiver<Action>>,
    clipboard: Clipboard,
    should_quit: bool,
}

pub struct Message {
    pub text: String,
    pub kind: MessageKind,
}

pub enum MessageKind {
    Info,
    Error,
}

impl App {
    pub async fn new() -> Result<Self> {
        let r2 = R2::from_env().await?;
        let picker = Picker::from_query_stdio()
            .wrap_err("querying terminal for image protocol support")?;
        let clipboard = Clipboard::new().wrap_err("initializing system clipboard")?;
        let (tx, rx) = mpsc::unbounded_channel();

        Ok(Self {
            r2,
            objects: Vec::new(),
            list_state: ListState::default(),
            message: None,
            objects_loading: false,
            picker,
            image_protocol: None,
            image_cache: HashMap::new(),
            image_dims_cache: HashMap::new(),
            current_key: None,
            preview_in_flight: HashSet::new(),
            dims_in_flight: HashSet::new(),
            generation: 0,
            action_tx: tx,
            action_rx: Some(rx),
            clipboard,
            should_quit: false,
        })
    }

    pub async fn run(
        &mut self,
        terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    ) -> Result<()> {
        // Take the receiver out of `self` so it doesn't conflict with `&mut self` calls inside select!.
        let mut action_rx = self
            .action_rx
            .take()
            .expect("action_rx already taken; run() called twice?");
        let mut event_stream = EventStream::new();
        let mut tick = tokio::time::interval(Duration::from_millis(100));

        // Kick off the first list load via the action pipeline so the UI shows "Loading…" immediately.
        self.dispatch(Action::Reload);

        loop {
            terminal.draw(|f| ui::render(f, self))?;

            tokio::select! {
                _ = tick.tick() => {}
                Some(Ok(ev)) = event_stream.next() => {
                    if let Some(action) = handle_terminal_event(ev) {
                        self.dispatch(action);
                    }
                }
                Some(action) = action_rx.recv() => {
                    self.update(action);
                    if self.should_quit { break; }
                }
            }
        }
        Ok(())
    }

    fn dispatch(&self, action: Action) {
        // Unbounded channel; only fails if the receiver is already dropped (during shutdown).
        let _ = self.action_tx.send(action);
    }

    fn update(&mut self, action: Action) {
        match action {
            Action::Quit => self.should_quit = true,
            Action::SelectUp => self.move_selection(-1),
            Action::SelectDown => self.move_selection(1),
            Action::Reload => self.start_reload(),
            Action::CopyToClipboard => self.copy_selected(),
            Action::ObjectsLoaded(objs) => self.on_objects_loaded(objs),
            Action::ListFailed(msg) => {
                self.objects_loading = false;
                self.message = Some(Message::error(format!("Reload failed: {msg}")));
            }
            Action::PreviewLoaded { generation, key, image } => {
                self.on_preview_loaded(generation, key, image);
            }
            Action::PreviewFailed { generation, key, message } => {
                self.on_preview_failed(generation, key, message);
            }
            Action::DimsResolved { generation, key, dims } => {
                self.on_dims_resolved(generation, key, dims);
            }
        }
    }

    fn start_reload(&mut self) {
        self.generation = self.generation.wrapping_add(1);
        self.image_cache.clear();
        self.image_dims_cache.clear();
        self.image_protocol = None;
        self.current_key = None;
        self.preview_in_flight.clear();
        self.dims_in_flight.clear();
        self.objects_loading = true;
        self.message = None;

        let r2 = self.r2.clone();
        let tx = self.action_tx.clone();
        tokio::spawn(async move {
            let action = match r2.list_images().await {
                Ok(objs) => Action::ObjectsLoaded(objs),
                Err(e) => Action::ListFailed(format!("{e:#}")),
            };
            let _ = tx.send(action);
        });
    }

    fn on_objects_loaded(&mut self, objects: Vec<R2Object>) {
        self.objects = objects;
        self.objects_loading = false;
        if !self.objects.is_empty() {
            self.list_state.select(Some(0));
            self.request_preview(0);
        } else {
            self.list_state.select(None);
        }
    }

    fn move_selection(&mut self, delta: i32) {
        let len = self.objects.len();
        if len == 0 {
            return;
        }
        let current = self.list_state.selected().unwrap_or(0);
        let next = (current as i32 + delta).clamp(0, len as i32 - 1) as usize;
        if next == current {
            return;
        }
        self.list_state.select(Some(next));
        self.message = None;
        self.request_preview(next);
    }

    fn request_preview(&mut self, index: usize) {
        let Some(obj) = self.objects.get(index) else {
            return;
        };
        let key = obj.key.clone();
        self.current_key = Some(key.clone());

        if let Some(img) = self.image_cache.get(&key) {
            self.image_protocol = Some(self.picker.new_resize_protocol((**img).clone()));
        } else {
            self.image_protocol = None;
            self.spawn_preview(key.clone());
        }

        // Dims fire only on the actual selection (not on prefetch), to avoid burning
        // edge-cache slots / Image Transformations on neighbours the user may never copy.
        self.spawn_dims(key);

        // Warm the preview cache for likely-next selections so j/k navigation feels instant.
        if let Some(prev) = index.checked_sub(1) {
            self.prefetch(prev);
        }
        self.prefetch(index + 1);
    }

    fn prefetch(&mut self, index: usize) {
        let Some(obj) = self.objects.get(index) else {
            return;
        };
        let key = obj.key.clone();
        if self.image_cache.contains_key(&key) || self.preview_in_flight.contains(&key) {
            return;
        }
        self.spawn_preview(key);
    }

    fn spawn_preview(&mut self, key: String) {
        if !self.preview_in_flight.insert(key.clone()) {
            return; // already in flight
        }
        let r2 = self.r2.clone();
        let tx = self.action_tx.clone();
        let generation = self.generation;
        tokio::spawn(async move {
            let action = match r2.get_preview(&key).await {
                Ok(image) => Action::PreviewLoaded { generation, key, image },
                Err(e) => Action::PreviewFailed {
                    generation,
                    key,
                    message: format!("{e:#}"),
                },
            };
            let _ = tx.send(action);
        });
    }

    fn spawn_dims(&mut self, key: String) {
        if self.image_dims_cache.contains_key(&key) || !self.dims_in_flight.insert(key.clone()) {
            return; // already cached or in flight
        }
        let r2 = self.r2.clone();
        let tx = self.action_tx.clone();
        let generation = self.generation;
        tokio::spawn(async move {
            let dims = r2.get_original_dimensions(&key).await.ok();
            let _ = tx.send(Action::DimsResolved { generation, key, dims });
        });
    }

    fn on_preview_loaded(&mut self, generation: u64, key: String, image: DynamicImage) {
        self.preview_in_flight.remove(&key);
        if generation != self.generation {
            return; // stale (a reload happened); drop silently
        }
        let arc = Arc::new(image);
        self.image_cache.insert(key.clone(), Arc::clone(&arc));
        if self.current_key.as_deref() == Some(key.as_str()) {
            self.image_protocol = Some(self.picker.new_resize_protocol((*arc).clone()));
        }
    }

    fn on_dims_resolved(&mut self, generation: u64, key: String, dims: Option<(u32, u32)>) {
        self.dims_in_flight.remove(&key);
        if generation != self.generation {
            return;
        }
        if let Some(d) = dims {
            self.image_dims_cache.insert(key, d);
        }
    }

    fn on_preview_failed(&mut self, generation: u64, key: String, message: String) {
        self.preview_in_flight.remove(&key);
        if generation != self.generation {
            return;
        }
        // Surface the failure only when the user is still looking at this key,
        // so navigation doesn't bury an active error and prefetch failures stay silent.
        if self.current_key.as_deref() == Some(key.as_str()) {
            self.message = Some(Message::error(format!("Preview failed: {message}")));
        }
    }

    fn copy_selected(&mut self) {
        let Some(mdc) = self.selected_mdc() else {
            return;
        };
        self.message = Some(match self.clipboard.set_text(&mdc) {
            Ok(()) => Message::info(format!("Copied: {mdc}")),
            Err(e) => Message::error(format!("Clipboard error: {e}")),
        });
    }

    pub fn selected_object(&self) -> Option<&R2Object> {
        self.list_state.selected().and_then(|i| self.objects.get(i))
    }

    /// MDC snippet for the current selection. Single source of truth so the
    /// Info panel preview and the clipboard copy never disagree on dims.
    pub fn selected_mdc(&self) -> Option<String> {
        let obj = self.selected_object()?;
        Some(match self.image_dims_cache.get(&obj.key) {
            Some(&(w, h)) => format!(
                ":r2-image{{object-key=\"{}\" width=\"{}\" height=\"{}\"}}",
                obj.key, w, h,
            ),
            None => format!(":r2-image{{object-key=\"{}\"}}", obj.key),
        })
    }

    pub fn is_preview_loading(&self) -> bool {
        self.current_key
            .as_ref()
            .is_some_and(|k| self.preview_in_flight.contains(k))
    }
}

impl Message {
    fn info(text: String) -> Self {
        Self { text, kind: MessageKind::Info }
    }
    fn error(text: String) -> Self {
        Self { text, kind: MessageKind::Error }
    }
}

fn handle_terminal_event(ev: CtEvent) -> Option<Action> {
    let CtEvent::Key(KeyEvent { code, kind, .. }) = ev else {
        return None;
    };
    if kind != KeyEventKind::Press {
        return None;
    }
    Some(match code {
        KeyCode::Char('q') | KeyCode::Esc => Action::Quit,
        KeyCode::Up | KeyCode::Char('k') => Action::SelectUp,
        KeyCode::Down | KeyCode::Char('j') => Action::SelectDown,
        KeyCode::Enter | KeyCode::Char('y') | KeyCode::Char('c') => Action::CopyToClipboard,
        KeyCode::Char('r') => Action::Reload,
        _ => return None,
    })
}
