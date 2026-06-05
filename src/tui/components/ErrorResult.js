import React from "react";
import { Box, Text, useApp, useInput } from "ink";

const { createElement: h } = React;

/** Failure screen showing the error message. */
export function ErrorResult({ error }) {
  const { exit } = useApp();

  useInput((_input, key) => {
    if (key.escape || (key.ctrl && _input === "c") || key.return) {
      exit();
    }
  });

  return h(Box, { flexDirection: "column", paddingX: 2, paddingY: 1 },
    h(Text, { bold: true, color: "red" }, " ✗ Download Failed "),
    h(Box, { marginTop: 1, paddingX: 1 },
      h(Text, { color: "red" }, error),
    ),
    h(Box, { marginTop: 1 },
      h(Text, { dimColor: true }, " Press ⏎ or Esc to exit"),
    ),
  );
}
