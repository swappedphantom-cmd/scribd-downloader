"""Progress reporting: one JSON object per line on stdout."""

import json


def log(msg, type="progress"):
    """Emit a progress/status line the Node front-end can parse."""
    print(json.dumps({"type": type, "message": str(msg)}), flush=True)
