import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseScribdUrl,
  formatSize,
  formatTime,
} from "../src/downloader/utils.js";

test("parseScribdUrl extracts the document id from supported URL shapes", () => {
  assert.equal(
    parseScribdUrl("https://www.scribd.com/document/317428820/title"),
    "317428820"
  );
  assert.equal(parseScribdUrl("https://scribd.com/doc/12345"), "12345");
  assert.equal(parseScribdUrl("https://www.scribd.com/embeds/999/content"), "999");
  assert.equal(parseScribdUrl("https://www.scribd.com/read/555/some-book"), "555");
  assert.equal(
    parseScribdUrl("https://www.scribd.com/presentation/42/deck"),
    "42"
  );
});

test("parseScribdUrl returns null for non-document URLs", () => {
  assert.equal(parseScribdUrl("https://www.scribd.com/search?q=foo"), null);
  assert.equal(parseScribdUrl("not a url"), null);
  assert.equal(parseScribdUrl("https://example.com/document/123"), "123");
});

test("formatSize renders human-readable byte counts", () => {
  assert.equal(formatSize(512), "512 B");
  assert.equal(formatSize(1536), "1.5 KB");
  assert.equal(formatSize(5 * 1024 * 1024), "5.00 MB");
});

test("formatTime renders seconds and minutes", () => {
  assert.equal(formatTime(5000), "5s");
  assert.equal(formatTime(65000), "1m 5s");
  assert.equal(formatTime(0), "0s");
});
