"""Phase 2: print the captured HTML to a vector PDF with Chromium.

Headless Chromium (Playwright) prints the self-contained HTML with `page.pdf()`,
producing a *vector* PDF whose text stays selectable/searchable -- not a stack
of screenshots.
"""

from __future__ import annotations

import os


def render_pdf(html_path: str, pdf_path: str) -> int:
    """Render the HTML at `html_path` into `pdf_path`; return the byte size."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        raise RuntimeError(
            "Missing dependency 'playwright'. Install it with: pip install -r requirements.txt "
            "then: playwright install chromium"
        ) from e

    # Neutralise the reader's absolute scroll container so every page flows into
    # its own printed sheet, and strip blur/shadows.
    print_css = """
      html, body { margin:0!important; padding:0!important; background:#fff!important;
        height:auto!important; min-height:0!important; overflow:visible!important; }
      .document_scroller, .document_container, .outer_page_container,
      [class*="embeds"], [class*="view_mode"] {
        position:static!important; height:auto!important; max-height:none!important;
        min-height:0!important; overflow:visible!important; width:auto!important;
        top:auto!important; left:auto!important; transform:none!important;
        contain:none!important; }
      .not_visible { display:block!important; visibility:visible!important; }
      [id^="outer_page_"] { position:relative!important; display:block!important;
        visibility:visible!important; margin:0 auto!important; box-shadow:none!important;
        border:0!important; overflow:hidden!important;
        break-after:page!important; page-break-after:always!important; }
      [id^="outer_page_"]:last-child { break-after:auto!important; page-break-after:auto!important; }
      .blurred_page { filter:none!important; }
      .blurred_page .text_layer, .blurred_page .text_layer [style] {
        color:#000!important; text-shadow:none!important; }

      /* Reveal Scribd's real text layer so it becomes selectable PDF text.
         Scribd renders many pages as an image and hides the glyph wrappers
         (.ffN) with display:none. Un-hide them; on image pages keep the text
         fully transparent so it sits invisibly over the picture (searchable,
         not doubled). Text-only pages keep their original colored text. */
      .text_layer, .text_layer * { visibility:visible!important; }
      .text_layer div[class^="ff"] { display:block!important; }
      .has_page_image .text_layer, .has_page_image .text_layer * {
        color:transparent!important; text-shadow:none!important; }
    """

    # Tag pages rendered as an image so the CSS above can keep their text layer
    # invisible-but-selectable rather than painted on top of the picture.
    mark_image_pages = """() => {
      document.querySelectorAll('.image_layer').forEach((il) => {
        if (il.querySelector('img')) {
          const pg = il.closest('.newpage') || il.parentElement;
          if (pg) pg.classList.add('has_page_image');
        }
      });
    }"""

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        try:
            page = browser.new_page()
            page.goto("file://" + html_path, wait_until="networkidle", timeout=120000)
            page.evaluate(mark_image_pages)
            page.add_style_tag(content=print_css)
            page.wait_for_timeout(800)

            dims = page.evaluate("""() => {
                const el = document.querySelector('[id^="outer_page_"]');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return { w: Math.round(r.width), h: Math.round(r.height) };
            }""")
            if not dims or dims["w"] < 10 or dims["h"] < 10:
                dims = {"w": 1000, "h": 1415}

            page.emulate_media(media="print")
            page.pdf(
                path=pdf_path,
                width=f"{dims['w']}px",
                height=f"{dims['h']}px",
                print_background=True,
                margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
            )
        finally:
            browser.close()

    return os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
