// Post-build: stamp dist/sw.js with a unique build ID so every deploy is
// seen as a new service worker by browsers. Without this, the SW VERSION
// stays constant across deploys and users (especially PWA-installed) keep
// running the old bundle until they manually clear cache.
//
// The browser checks for SW updates by byte-comparing the served sw.js to
// the installed one — changing the literal VERSION string is enough to
// trigger the update + skipWaiting + clients.claim + controllerchange
// auto-reload chain wired up in main.jsx.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
const swPath = join(distDir, "sw.js");

if (!existsSync(swPath)) {
  console.error(`[stamp-sw] ${swPath} not found — did vite build succeed?`);
  process.exit(1);
}

const buildId = new Date().toISOString().replace(/[:.]/g, "-");
const src = readFileSync(swPath, "utf8");
const out = src.replace("__BUILD_ID__", buildId);

if (out === src) {
  console.warn("[stamp-sw] No __BUILD_ID__ placeholder found — SW won't bump between deploys.");
} else {
  writeFileSync(swPath, out);
  console.log(`[stamp-sw] Stamped sw.js with VERSION=${buildId}`);
}
