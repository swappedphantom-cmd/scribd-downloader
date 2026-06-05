"""Orchestration: capture HTML (phase 1) then render the PDF (phase 2)."""

from __future__ import annotations

import json
import os
import shutil
import tempfile

from .capture import capture_html
from .progress import log
from .render import render_pdf
from .urls import extract_doc_id, safe_filename, title_from_slug


def _load_cookies(cookies_file: str | None):
    """Read cookies as a JSON value, falling back to a raw header string."""
    if not (cookies_file and os.path.exists(cookies_file)):
        return None
    try:
        with open(cookies_file, encoding="utf-8") as f:
            raw = f.read().strip()
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw
    except Exception:
        return None


def download(url: str, output_dir: str = None, cookies_file: str = None) -> dict:
    """Download a Scribd document to a vector PDF. Returns a result/err dict."""
    doc_id = extract_doc_id(url)
    if not doc_id:
        return {"error": "Could not extract a Scribd document ID from the URL"}

    output_dir = output_dir or os.path.join(os.getcwd(), "downloads")
    os.makedirs(output_dir, exist_ok=True)

    cookies = _load_cookies(cookies_file)

    temp_dir = tempfile.mkdtemp(prefix="scribd_")
    try:
        log("Opening Scribd reader...")
        cap = capture_html(url, cookies)
        if cap.get("error"):
            return {"error": cap["error"]}
        if not cap.get("html"):
            return {"error": "Could not read the document pages."}

        title = (cap.get("title") or "").strip() or title_from_slug(url) \
            or f"Scribd_{doc_id}"

        html_path = os.path.join(temp_dir, "document.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(cap["html"])

        log("Rendering PDF...")
        pdf_path = os.path.join(output_dir, f"{safe_filename(title)}.pdf")
        size = render_pdf(html_path, pdf_path)
        if not size:
            return {"error": "PDF was not generated"}

        log(f"PDF saved: {os.path.basename(pdf_path)} ({size} bytes)")
        return {
            "success": True,
            "filePath": pdf_path,
            "title": title,
            "pages": cap.get("pages", 0),
            "size": size,
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
