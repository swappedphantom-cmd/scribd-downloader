import { statSync } from "fs";
import { downloadScribd } from "./downloader/scribd.js";
import { formatTime, formatSize } from "./downloader/utils.js";

const C = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

/** Headless (non-TUI) download that prints progress to stdout. */
export async function runCli(url) {
  console.log("");
  console.log("  " + C.cyan("Scribd Downloader"));
  console.log("");

  try {
    await downloadScribd(url, (p) => {
      const dots = ["", ".", "..", "..."][Math.floor(Date.now() / 500) % 4];
      if (p.status === "scroll") {
        const pct = p.total > 0 ? Math.round((p.current / p.total) * 100) : "?";
        process.stdout.write(`\r  ${C.yellow("●")} ${p.message} ${pct}%`);
      } else if (p.status === "done") {
        let size = "";
        try { size = formatSize(statSync(p.filePath).size); } catch {}
        console.log(`\r  ${C.green("✓")} ${p.message}`);
        console.log(`  ${C.cyan("File:")} ${p.filePath}`);
        if (size) console.log(`  ${C.cyan("Size:")} ${size}`);
        console.log(`  ${C.cyan("Time:")} ${formatTime(p.elapsed)}`);
        console.log("");
      } else if (p.status === "error") {
        console.log(`\r  ${C.red("✗")} ${p.message}`);
      } else {
        process.stdout.write(`\r  ${C.cyan("●")} ${p.message}${dots}`);
      }
    });
  } catch (err) {
    console.log(`\r  ${C.red("✗")} ${err.message}`);
    process.exit(1);
  }
}
