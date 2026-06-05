# scribd-downloader

Download a Scribd document as a **real, text-selectable PDF** — not a stack of
screenshots. A small Node TUI/CLI drives a Python pipeline that opens Scribd's
embed reader, serialises the rendered pages to self-contained HTML, and prints
that HTML to a vector PDF with a searchable text layer.

## How it works

```
URL ──► Node front-end ──► download.py ──► scribd_dl
                                            ├─ capture.py  (phase 1)
                                            └─ render.py   (phase 2)
```

1. **Capture** — Camoufox (via scrapling's `StealthyFetcher`) opens the Scribd
   embed reader, bypassing the Fastly/Cloudflare bot challenge, scrolls to force
   every page to render, then serialises the pages into a single self-contained
   HTML file (CSS, fonts and images inlined / absolutised).
2. **Render** — headless Chromium (Playwright) prints that HTML with
   `page.pdf()`, producing a *vector* PDF. Scribd's hidden text layer is revealed
   as transparent, selectable text laid over the page image, so the output is
   searchable rather than a flat picture.

Progress is streamed from Python to Node as one JSON object per line on stdout.

## Requirements

- **Node.js** ≥ 18
- **Python** 3.7+ (3.10+ recommended)
- Python packages from `requirements.txt` (`scrapling`, `playwright`) plus the
  Chromium browser build.

## Installation

```bash
# Node dependencies
npm install

# Python dependencies + Chromium
pip install -r requirements.txt
playwright install chromium
```

If you keep the Python environment in a virtualenv at `/tmp/scribd-venv`, the
Node side will use it automatically; otherwise it falls back to `python3` on your
PATH.

## Usage

**Interactive TUI** — paste a URL and watch progress:

```bash
npm start
# or
node src/index.js
```

**Direct download (CLI)**:

```bash
node src/index.js https://www.scribd.com/document/123456789/title
```

**Help**:

```bash
node src/index.js --help
```

Downloaded PDFs are written to `./downloads` (configurable, see below).

## Configuration

Settings live in `config.ini`:

```ini
[output]
; Directory where downloaded PDFs are saved
directory = ./downloads

[account]
; JSON cookie array, or a raw "name=value; name2=value2" header string.
; Needed for premium documents; public docs work without it.
cookies_file =
```

## Project structure

```
download.py              Thin CLI entry point -> scribd_dl.download
scribd_dl/               Python package
  __init__.py            Public API (download, log) + pipeline overview
  core.py                Orchestration: capture -> render
  capture.py             Phase 1 - Camoufox capture + page-serialising JS
  render.py              Phase 2 - Chromium HTML -> vector PDF
  urls.py                URL id / title / filename helpers (pure)
  progress.py            JSON-per-line progress protocol
src/                     Node front-end
  index.js               Entry: arg parsing -> CLI or TUI
  cli.js                 Headless (non-TUI) progress runner
  config.js              config.ini reader
  paths.js               Centralised on-disk locations
  downloader/
    scribd.js            Spawns and streams the Python subprocess
    protocol.js          Pure stdout-protocol -> UI events (tested)
    utils.js             Pure URL / formatting helpers (tested)
  tui/
    app.js               TUI state machine
    status.js            Shared status colour/label maps
    components/          UrlInput, Progress, Result, ErrorResult
test/                    Unit tests (Node + Python)
```

## Testing

```bash
# JavaScript (pure helpers + protocol parsing)
npm test

# Python (URL / filename helpers)
python3 -m unittest discover -s test
```

## Limitations

- **Premium documents** require valid cookies (`cookies_file` in `config.ini`).
- **Scanned documents** are embedded as page images; an OCR-style transparent
  text layer is added when Scribd provides one.
- A few glyphs may extract with the wrong Unicode codepoint when Scribd's subset
  fonts lack a `ToUnicode` map — most text remains selectable and searchable.
- Use this tool only for documents you are entitled to download.

## License

MIT
