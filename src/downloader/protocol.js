/**
 * Pure translation of download.py's stdout protocol (one JSON object per line)
 * into the events the UI layers consume. No I/O here, so it's trivially testable.
 */

/** Map a free-text progress message to a UI status + structured fields. */
function toProgress(message) {
  const m = message.match(/Page (\d+)\/(\d+)/);
  if (m) {
    return {
      status: "scroll",
      message,
      current: parseInt(m[1]),
      total: parseInt(m[2]),
    };
  }
  const status =
    message.includes("PDF") || message.includes("Assembling") ? "pdf" :
    message.includes("Loading") || message.includes("metadata") ? "load" :
    message.includes("overlays") ? "clean" : "scroll";
  return { status, message };
}

/**
 * Parse one stdout line into an event:
 *   { kind: "result",   result }   final success payload
 *   { kind: "error",    message }  fatal error reported by Python
 *   { kind: "progress", progress } intermediate progress update
 * Returns null for non-JSON or unrecognised lines.
 */
export function parseMessage(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return null;
  }
  if (msg.success) return { kind: "result", result: msg };
  if (msg.error && !msg.type) return { kind: "error", message: msg.error };
  if (msg.type === "progress" && typeof msg.message === "string") {
    return { kind: "progress", progress: toProgress(msg.message) };
  }
  return null;
}
