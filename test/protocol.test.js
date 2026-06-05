import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMessage } from "../src/downloader/protocol.js";

test("parseMessage returns the final result payload", () => {
  const evt = parseMessage(JSON.stringify({ success: true, filePath: "/tmp/a.pdf" }));
  assert.equal(evt.kind, "result");
  assert.equal(evt.result.filePath, "/tmp/a.pdf");
});

test("parseMessage surfaces a fatal error", () => {
  const evt = parseMessage(JSON.stringify({ error: "boom" }));
  assert.equal(evt.kind, "error");
  assert.equal(evt.message, "boom");
});

test("parseMessage maps page progress to a scroll status with counts", () => {
  const evt = parseMessage(JSON.stringify({ type: "progress", message: "Page 3/10" }));
  assert.equal(evt.kind, "progress");
  assert.deepEqual(evt.progress, {
    status: "scroll",
    message: "Page 3/10",
    current: 3,
    total: 10,
  });
});

test("parseMessage classifies non-page progress by keyword", () => {
  assert.equal(parseMessage(JSON.stringify({ type: "progress", message: "Rendering PDF..." })).progress.status, "pdf");
  assert.equal(parseMessage(JSON.stringify({ type: "progress", message: "Loading document pages..." })).progress.status, "load");
  assert.equal(parseMessage(JSON.stringify({ type: "progress", message: "Removing overlays" })).progress.status, "clean");
  assert.equal(parseMessage(JSON.stringify({ type: "progress", message: "Something else" })).progress.status, "scroll");
});

test("parseMessage returns null for non-JSON or unknown lines", () => {
  assert.equal(parseMessage("Traceback (most recent call last):"), null);
  assert.equal(parseMessage(JSON.stringify({ type: "error", message: "x" })), null);
});
