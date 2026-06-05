#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./tui/app.js";
import { runCli } from "./cli.js";

const { createElement: h } = React;

const HELP = `
  scribd-tui - Scribd Document Downloader

  Usage:
    scribd-tui                    Interactive TUI mode
    scribd-tui <url>              Download document directly
    scribd-tui --help             Show this help

  Examples:
    scribd-tui https://www.scribd.com/document/123456789/title
`;

const args = process.argv.slice(2);
const urlArg = args.find((a) => !a.startsWith("-") && a.includes("scribd")) || null;
const helpArg = args.includes("--help") || args.includes("-h");

if (helpArg) {
  console.log(HELP);
  process.exit(0);
}

if (urlArg) {
  await runCli(urlArg);
} else {
  const { waitUntilExit } = render(h(App, {}));
  await waitUntilExit();
}
