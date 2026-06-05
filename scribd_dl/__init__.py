"""Scribd document downloader -> real, text-selectable PDF.

Pipeline:
  1. Camoufox (via scrapling's StealthyFetcher) opens the Scribd embed reader,
     bypassing the bot challenge, scrolls to force every page to render, then
     serialises the rendered pages into a single self-contained HTML file
     (CSS + fonts + images inlined / absolutised).  -> scribd_dl.capture
  2. Headless Chromium (Playwright) prints that HTML with `page.pdf()`,
     producing a *vector* PDF whose text stays selectable.  -> scribd_dl.render

Orchestration lives in scribd_dl.core; progress is emitted as one JSON object
per line on stdout (scribd_dl.progress) so the Node front-end can parse it.
"""

from .core import download
from .progress import log

__all__ = ["download", "log"]
