import React from "react";
import { Box, Text, useApp, useInput } from "ink";
import { statSync } from "fs";
import { formatSize, formatTime } from "../../downloader/utils.js";

const { createElement: h } = React;

/** Success screen showing file path, size and elapsed time. */
export function Result({ result }) {
  const { exit } = useApp();

  useInput((_input, key) => {
    if (key.escape || (key.ctrl && _input === "c") || key.return) {
      exit();
    }
  });

  let fileSize = "";
  if (result.filePath) {
    try {
      fileSize = formatSize(statSync(result.filePath).size);
    } catch {}
  }

  return h(Box, { flexDirection: "column", paddingX: 2, paddingY: 1 },
    h(Text, { bold: true, color: "green" }, " ✓ Download Complete! "),
    h(Box, { marginTop: 1, flexDirection: "column", borderStyle: "round", paddingX: 1, paddingY: 1 },
      result.filePath ? h(Box, {},
        h(Text, { bold: true }, " File:  "),
        h(Text, { color: "cyan" }, result.filePath),
      ) : null,
      fileSize ? h(Box, {},
        h(Text, { bold: true }, " Size:  "),
        h(Text, {}, fileSize),
      ) : null,
      result.elapsed ? h(Box, {},
        h(Text, { bold: true }, " Time:  "),
        h(Text, {}, formatTime(result.elapsed)),
      ) : null,
    ),
    h(Box, { marginTop: 1 },
      h(Text, { dimColor: true }, " Press ⏎ or Esc to exit"),
    ),
  );
}
