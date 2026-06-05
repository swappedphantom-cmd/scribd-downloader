import React from "react";
import { Box, Text } from "ink";
import { STATUS_COLORS, STATUS_LABELS } from "../status.js";

const { createElement: h } = React;

/** Live progress view: status line + optional page progress bar. */
export function Progress({ progress }) {
  const barWidth = 30;

  let bar = "";
  let pct = 0;
  if (progress.total > 0 && progress.current != null) {
    pct = Math.min(progress.current / progress.total, 1);
    const filled = Math.round(pct * barWidth);
    bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
  }

  const color = STATUS_COLORS[progress.status] || "white";

  return h(Box, { flexDirection: "column", paddingX: 2, paddingY: 1 },
    h(Text, { bold: true, color: "cyan" }, " Scribd Downloader "),
    h(Box, { marginTop: 1 },
      h(Text, { color }, "●"),
      h(Text, { color }, STATUS_LABELS[progress.status] || ""),
      h(Text, ` ${progress.message}`),
    ),
    progress.total > 0 && progress.current != null
      ? h(Box, { marginTop: 1 },
          h(Text, { color: "green" }, ` ${bar}`),
          h(Text, { color: "white" }, ` ${Math.round(pct * 100)}%`),
          h(Text, { dimColor: true }, ` (${progress.current}/${progress.total})`),
        )
      : null,
  );
}
