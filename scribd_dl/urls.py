"""URL parsing and filename helpers (no I/O, easy to unit-test)."""

from __future__ import annotations

import re


def extract_doc_id(url: str) -> str | None:
    """Pull the numeric document id out of any supported Scribd URL shape."""
    m = re.search(r'/(?:doc|document|presentation|embeds|read)/(\d+)', url, re.I)
    return m.group(1) if m else None


def title_from_slug(url: str) -> str | None:
    """Derive a human title from the URL slug (…/document/123/My-Document-Title)."""
    m = re.search(r'/(?:doc|document|presentation)/\d+/([^/?#]+)', url, re.I)
    if not m:
        return None
    slug = m.group(1)
    if slug.lower() in ("", "test"):
        return None
    slug = re.sub(r'\.\w{2,4}$', '', slug)            # drop trailing extension
    slug = re.sub(r'[-_]+', ' ', slug).strip()
    return slug or None


def safe_filename(title: str) -> str:
    """Turn a title into a filesystem-safe filename (no extension)."""
    safe = re.sub(r'[\\/:*?"<>|]', '_', title)
    safe = re.sub(r'\s+', ' ', safe).strip()
    return (safe[:200] or "Scribd_Document")
