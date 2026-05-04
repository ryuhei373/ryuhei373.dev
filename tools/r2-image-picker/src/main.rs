mod app;
mod r2;
mod ui;

use std::io::{self, Stdout};

use color_eyre::eyre::Result;
use crossterm::execute;
use crossterm::terminal::{
    EnterAlternateScreen, LeaveAlternateScreen, disable_raw_mode, enable_raw_mode,
};
use ratatui::Terminal;
use ratatui::backend::CrosstermBackend;

/// RAII guard that restores the terminal on drop.
///
/// Covers the normal-return path and unwinding panics. The panic hook below covers
/// `panic = "abort"` builds and any unexpected non-unwinding exits.
struct TerminalGuard;

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        let _ = disable_raw_mode();
        let _ = execute!(io::stdout(), LeaveAlternateScreen);
    }
}

fn install_panic_hook() {
    let prev = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let _ = disable_raw_mode();
        let _ = execute!(io::stdout(), LeaveAlternateScreen);
        prev(info);
    }));
}

fn init_terminal() -> Result<(Terminal<CrosstermBackend<Stdout>>, TerminalGuard)> {
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let terminal = Terminal::new(CrosstermBackend::new(stdout))?;
    Ok((terminal, TerminalGuard))
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<()> {
    color_eyre::install()?;
    install_panic_hook();

    let (mut terminal, _guard) = init_terminal()?;
    let mut app = app::App::new().await?;
    app.run(&mut terminal).await
}
