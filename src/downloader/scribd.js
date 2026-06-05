import { spawn } from "child_process";
import { existsSync } from "fs";
import { parseScribdUrl } from "./utils.js";
import { parseMessage } from "./protocol.js";
import { loadConfig } from "../config.js";
import { pythonScript } from "../paths.js";

/** Prefer the project venv interpreter if present, else the system python3. */
function resolvePython() {
  const venv = "/tmp/scribd-venv/bin/python3";
  return existsSync(venv) ? venv : "python3";
}

/**
 * Spawn the Python downloader and stream its progress.
 * @param {string} url Scribd document URL
 * @param {(p: object) => void} onProgress called with each progress/result event
 * @returns {Promise<object>} the final success payload from download.py
 */
export async function downloadScribd(url, onProgress) {
  const id = parseScribdUrl(url);
  if (!id) throw new Error("Invalid Scribd URL - could not extract document ID");

  if (!existsSync(pythonScript)) {
    throw new Error(`Python script not found: ${pythonScript}`);
  }

  const cfg = loadConfig();
  const args = [pythonScript, url, cfg.outputDir];
  if (cfg.cookiesFile) args.push(cfg.cookiesFile);

  return new Promise((resolve, reject) => {
    onProgress({ status: "launch", message: "Starting Python downloader..." });

    const proc = spawn(resolvePython(), args, {
      stdio: ["inherit", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stderr = "";
    let stdoutBuf = "";
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    const handleLine = (line) => {
      if (settled) return;
      const evt = parseMessage(line);
      if (!evt) {
        // Non-JSON line - keep it around in case it explains a later failure.
        if (line.includes("Traceback") || line.includes("Error:")) {
          stderr += line + "\n";
        }
        return;
      }
      if (evt.kind === "result") {
        onProgress({
          status: "done",
          message: "Download complete!",
          filePath: evt.result.filePath,
          elapsed: 0,
        });
        finish(resolve, evt.result);
      } else if (evt.kind === "error") {
        onProgress({ status: "error", message: evt.message });
        finish(reject, new Error(evt.message));
      } else if (evt.kind === "progress") {
        onProgress(evt.progress);
      }
    };

    proc.stdout.on("data", (data) => {
      // A chunk may end mid-line, so only dispatch complete (newline-terminated)
      // lines and keep the remainder buffered for the next chunk.
      stdoutBuf += data.toString();
      let nl;
      while ((nl = stdoutBuf.indexOf("\n")) !== -1) {
        const line = stdoutBuf.slice(0, nl).trim();
        stdoutBuf = stdoutBuf.slice(nl + 1);
        if (line) handleLine(line);
      }
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      // Flush any trailing line that arrived without a final newline.
      const rest = stdoutBuf.trim();
      if (rest) handleLine(rest);
      if (settled) return;
      const errMsg = stderr.trim().split("\n").filter(l => l && !l.includes("WARNING")).pop()
        || `Process exited with code ${code}`;
      onProgress({ status: "error", message: errMsg });
      finish(reject, new Error(errMsg));
    });

    proc.on("error", (err) => {
      const message = err.code === "ENOENT"
        ? "Python 3 is required but was not found. Install Python 3 and make sure 'python3' is on your PATH."
        : err.message;
      onProgress({ status: "error", message });
      finish(reject, new Error(message));
    });
  });
}
