import React from "react";
import { Box, Text, useInput } from "ink";
import { parseScribdUrl } from "../../downloader/utils.js";

const { createElement: h } = React;

/** Prompt that captures a Scribd URL and submits it when valid. */
export function UrlInput({ onUrlSubmit, url, setUrl, error }) {
  useInput((input, key) => {
    if (key.return && url.trim()) {
      const id = parseScribdUrl(url.trim());
      if (id) {
        onUrlSubmit(url.trim());
      }
    }
    if (key.backspace || key.delete) {
      setUrl((prev) => prev.slice(0, -1));
      return;
    }
    if (!key.ctrl && !key.meta && !key.escape && input.length === 1) {
      setUrl((prev) => prev + input);
    }
  });

  return h(Box, { flexDirection: "column", paddingX: 2, paddingY: 1 },
    h(Text, { bold: true, color: "cyan" }, " Scribd Downloader "),
    h(Box, { marginTop: 1 },
      h(Text, { color: "yellow" }, "?"),
      h(Text, " Paste Scribd URL: "),
      h(Text, { backgroundColor: "gray", color: "white" }, ` ${url || "_".repeat(30)} `),
    ),
    error ? h(Box, { marginTop: 1 },
      h(Text, { color: "red" }, "✗ ", error),
    ) : null,
    h(Box, { marginTop: 1 },
      h(Text, { dimColor: true }, " Enter URL and press ⏎  •  "),
      h(Text, { dimColor: true }, "Esc to quit"),
    ),
  );
}
