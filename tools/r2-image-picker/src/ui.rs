use std::path::Path;

use ratatui::Frame;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, List, ListItem, Paragraph, Wrap};
use ratatui_image::StatefulImage;

use crate::app::{App, MessageKind};

pub fn render(frame: &mut Frame, app: &mut App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Min(10),
            Constraint::Length(2),
        ])
        .split(frame.area());

    render_header(frame, app, chunks[0]);

    let main_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
        .split(chunks[1]);

    render_object_list(frame, app, main_chunks[0]);
    render_preview_pane(frame, app, main_chunks[1]);
    render_footer(frame, app, chunks[2]);
}

fn render_header(frame: &mut Frame, app: &App, area: Rect) {
    let text = if app.objects_loading {
        "r2-image-picker — Loading objects…"
    } else {
        "r2-image-picker — Pick an image and copy MDC to clipboard"
    };
    let p = Paragraph::new(text)
        .style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD));
    frame.render_widget(p, area);
}

fn render_object_list(frame: &mut Frame, app: &mut App, area: Rect) {
    let title = format!(" Objects ({}) ", app.objects.len());
    let items: Vec<ListItem> = app
        .objects
        .iter()
        .map(|obj| {
            let filename = Path::new(&obj.key)
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or(&obj.key);
            let display: String = filename.chars().take(45).collect();
            ListItem::new(display)
        })
        .collect();
    let list = List::new(items)
        .block(Block::default().borders(Borders::ALL).title(title))
        .highlight_style(Style::default().bg(Color::Cyan).fg(Color::Black))
        .highlight_symbol("> ");
    frame.render_stateful_widget(list, area, &mut app.list_state);
}

fn render_preview_pane(frame: &mut Frame, app: &mut App, area: Rect) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Percentage(70), Constraint::Percentage(30)])
        .split(area);

    let preview_title = if app.is_preview_loading() {
        " Preview (Loading…) "
    } else {
        " Preview "
    };
    let preview_block = Block::default().borders(Borders::ALL).title(preview_title);
    let inner = preview_block.inner(chunks[0]);
    frame.render_widget(preview_block, chunks[0]);

    if let Some(protocol) = app.image_protocol.as_mut() {
        frame.render_stateful_widget(StatefulImage::new(), inner, protocol);
    }

    let info_text = match app.selected_object() {
        Some(obj) => {
            let size = format_size(obj.size);
            let mdc = app.selected_mdc().unwrap_or_default();
            format!("Key:  {}\nSize: {size}\nMDC:  {mdc}", obj.key)
        }
        None => "(no objects)".into(),
    };
    let info = Paragraph::new(info_text)
        .block(Block::default().borders(Borders::ALL).title(" Info "))
        .wrap(Wrap { trim: false });
    frame.render_widget(info, chunks[1]);
}

fn render_footer(frame: &mut Frame, app: &App, area: Rect) {
    let footer_text = "[↑↓/jk] Navigate  [Enter/y/c] Copy MDC  [r] Reload  [Esc/q] Quit";
    let mut lines = vec![Line::from(Span::styled(
        footer_text,
        Style::default().fg(Color::DarkGray),
    ))];
    if let Some(msg) = &app.message {
        let color = match msg.kind {
            MessageKind::Info => Color::Green,
            MessageKind::Error => Color::Red,
        };
        lines.push(Line::from(Span::styled(
            msg.text.clone(),
            Style::default().fg(color),
        )));
    }
    frame.render_widget(Paragraph::new(lines), area);
}

fn format_size(bytes: i64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    let b = bytes as f64;
    if bytes < 1024 {
        format!("{bytes} B")
    } else if b < MB {
        format!("{:.1} KB", b / KB)
    } else {
        format!("{:.1} MB", b / MB)
    }
}
