import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { configPath } from "./paths.js";

/**
 * Read the (minimal) INI config. Only the keys the pipeline actually uses are
 * recognised: [output] directory and [account] cookies_file. Unknown sections
 * and keys are ignored. The output directory is created if missing.
 */
export function loadConfig() {
  const cfg = {
    outputDir: join(process.cwd(), "downloads"),
    cookiesFile: null,
  };
  try {
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, "utf-8");
      let section = null;
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#") || t.startsWith(";")) continue;
        if (t.startsWith("[") && t.endsWith("]")) {
          section = t.slice(1, -1).toLowerCase();
          continue;
        }
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim().toLowerCase();
        const v = t.slice(eq + 1).trim();
        if (section === "output" && k === "directory") cfg.outputDir = v;
        if (section === "account" && k === "cookies_file") cfg.cookiesFile = v;
      }
    }
  } catch {}
  if (!existsSync(cfg.outputDir)) mkdirSync(cfg.outputDir, { recursive: true });
  return cfg;
}
