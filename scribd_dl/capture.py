"""Phase 1: open the Scribd embed reader and dump self-contained HTML.

Camoufox (via scrapling's StealthyFetcher) bypasses Scribd's Fastly/Cloudflare
bot challenge, scrolls to force every page to render, then serialises the
rendered pages into a single self-contained HTML document (CSS + fonts + images
inlined / absolutised) so phase 2 can print it offline.
"""

from __future__ import annotations

from .progress import log
from .urls import extract_doc_id

# JS evaluated inside the embed page (same origin -> can read its own CSS).
# Returns {html, title, pages}. It inlines same-origin CSS, rewrites every
# url(...) and <img> reference to an absolute URL (and to a data: URI when the
# asset is CORS-readable) and keeps only the page container so toolbars / cookie
# banners never reach the PDF.
_SERIALISE_JS = r"""
async () => {
  const absolutise = (u, base) => { try { return new URL(u, base).href; } catch { return u; } };
  const toDataURL = async (url) => {
    try {
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) return null;
      const b = await r.blob();
      if (b.size > 6_000_000) return null;           // skip oversize assets
      return await new Promise((res) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = () => res(null);
        fr.readAsDataURL(b);
      });
    } catch { return null; }
  };

  const inlineCss = async (cssText, baseHref) => {
    const refs = [...cssText.matchAll(/url\(([^)]+)\)/g)];
    for (const m of refs) {
      const raw = m[1].trim().replace(/^['"]|['"]$/g, '');
      if (raw.startsWith('data:')) continue;
      const abs = absolutise(raw, baseHref);
      const data = await toDataURL(abs);
      cssText = cssText.split(m[1]).join(data ? `"${data}"` : `"${abs}"`);
    }
    return cssText;
  };

  // 0. Strip consent dialogs, toolbars, ads, iframes and any leftover fixed
  //    overlays -- Chromium repeats position:fixed elements on every printed page.
  const JUNK = ['sp_message', 'message_container', 'consent', 'privacy', 'cookie',
    'gdpr', 'truste', 'qc-cmp', 'toolbar', 'banner', 'modal', 'overlay', 'popup',
    'spinner', 'between_page', 'promo', 'paywall', 'signup'];
  document.querySelectorAll('iframe, script, noscript').forEach((e) => e.remove());
  JUNK.forEach((c) => document.querySelectorAll(`[class*="${c}"],[id*="${c}"]`)
    .forEach((e) => e.remove()));
  document.querySelectorAll('body *').forEach((e) => {
    const pos = getComputedStyle(e).position;
    if ((pos === 'fixed' || pos === 'sticky') && !e.closest('.outer_page_container')) {
      e.remove();
    }
  });

  // 1. Pull every <link rel=stylesheet> into an inline <style> (same origin).
  for (const link of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
    try {
      const css = await (await fetch(link.href, { credentials: 'include' })).text();
      const style = document.createElement('style');
      style.textContent = await inlineCss(css, link.href);
      link.replaceWith(style);
    } catch { link.remove(); }
  }
  // 2. Fix url(...) inside existing inline <style> blocks (fonts live here).
  for (const style of [...document.querySelectorAll('style')]) {
    if (style.textContent.includes('url(')) {
      style.textContent = await inlineCss(style.textContent, location.href);
    }
  }

  const container = document.querySelector('.outer_page_container')
                 || document.querySelector('.document_container');
  if (!container) {
    return { html: null, title: document.title || '', pages: 0 };
  }

  // 3. Absolutise / inline every image inside the pages.
  for (const img of [...container.querySelectorAll('img')]) {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      const abs = absolutise(src, location.href);
      const data = await toDataURL(abs);
      img.setAttribute('src', data || abs);
    }
    img.removeAttribute('loading');
  }

  // 4. Title: prefer og:title, then <title>, cleaned of the Scribd suffix.
  const og = document.querySelector('meta[property="og:title"]');
  let title = (og && og.content) || document.title || '';
  title = title.replace(/\s*[|–-]\s*Scribd.*$/i, '').trim();
  if (/^scribd(\.com)?$/i.test(title)) title = '';     // generic embed title

  const pages = container.querySelectorAll('[id^="outer_page_"]').length;
  const head = document.head ? document.head.innerHTML : '';
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' + head +
    '</head><body>' + container.outerHTML + '</body></html>';
  return { html, title, pages };
};
"""

# Scroll the reader so Scribd lazy-renders every page, then serialise.
_SCROLL_JS = r"""
async () => {
  await new Promise((resolve) => {
    let last = -1, stable = 0;
    const tick = () => {
      const h = document.body.scrollHeight;
      window.scrollBy(0, Math.round(window.innerHeight * 0.9));
      if (window.scrollY <= last) {
        if (++stable >= 3) return resolve();
      } else { stable = 0; last = window.scrollY; }
      if (window.scrollY + window.innerHeight >= h && ++stable >= 3) return resolve();
      setTimeout(tick, 130);
    };
    tick();
  });
};
"""


def capture_html(url: str, cookies) -> dict:
    """Open the embed with Camoufox and return {html, title, pages, error}."""
    try:
        from scrapling.fetchers import StealthyFetcher
    except ImportError as e:
        raise RuntimeError(
            "Missing dependency 'scrapling'. Install it with: pip install -r requirements.txt"
        ) from e

    doc_id = extract_doc_id(url)
    embed_url = (f"https://www.scribd.com/embeds/{doc_id}/content"
                 f"?start_page=1&view_mode=scroll&access_key=key-1")

    captured = {"html": None, "title": "", "pages": 0, "error": None}

    def page_action(page):
        page.wait_for_timeout(3500)
        log("Loading document pages...")
        try:
            page.evaluate(_SCROLL_JS)
        except Exception:
            pass
        page.wait_for_timeout(1500)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(800)

        page_count = page.evaluate(
            "document.querySelectorAll('[id^=\"outer_page_\"]').length"
        )
        if not page_count:
            body_text = (page.evaluate(
                "document.body && document.body.innerText "
                "? document.body.innerText.slice(0, 400) : ''") or "").lower()
            if "deletion" in body_text or "not found" in body_text or "410" in body_text:
                captured["error"] = "Document has been deleted or is unavailable."
            else:
                captured["error"] = ("No pages found - the document may require a "
                                     "premium account. Set cookies_file in config.ini.")
            return

        log(f"Found {page_count} pages, serialising...")
        result = page.evaluate(_SERIALISE_JS)
        captured.update({k: result.get(k, captured[k]) for k in ("html", "title", "pages")})

    kwargs = dict(
        headless=True, solve_cloudflare=True, network_idle=False,
        page_action=page_action, timeout=300000, wait=2,
    )
    if cookies:
        kwargs["cookies"] = cookies

    StealthyFetcher().fetch(embed_url, **kwargs)
    return captured
