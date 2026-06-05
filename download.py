#!/usr/bin/env python3
"""Thin CLI entry point for the Scribd downloader.

All logic lives in the `scribd_dl` package; this file just parses argv and
prints the final result as JSON. See scribd_dl/__init__.py for the pipeline.

Usage: download.py <url> [output_dir] [cookies_file]
"""

import json
import sys

from scribd_dl import download

if __name__ == "__main__":
    if len(sys.argv) < 2:
        msg = "Usage: download.py <url> [output_dir] [cookies_file]"
        print(json.dumps({"type": "error", "message": msg}))
        print(json.dumps({"error": msg}))
        sys.exit(1)

    url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    cookies_file = sys.argv[3] if len(sys.argv) > 3 else None

    result = download(url, output_dir, cookies_file)
    print(json.dumps(result))
    sys.exit(0 if result.get("success") else 1)
