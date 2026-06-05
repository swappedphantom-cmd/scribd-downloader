const DOC_RE = /\/(?:doc|document|presentation|embeds|read)\/(\d+)(?:\/|$)/i;

export function parseScribdUrl(url) {
  const m = url.match(DOC_RE);
  if (!m) return null;
  return m[1];
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
