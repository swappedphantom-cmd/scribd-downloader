import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Single source of truth for on-disk locations, derived from this file's spot
// in src/. Everything else imports these instead of recomputing "../..".
const srcDir = dirname(fileURLToPath(import.meta.url));

export const projectRoot = join(srcDir, "..");
export const configPath = join(projectRoot, "config.ini");
export const pythonScript = join(projectRoot, "download.py");
