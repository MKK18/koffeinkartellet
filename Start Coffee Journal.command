#!/bin/bash
# Double-click this file to launch Koffeinkartellet locally.
# It starts BOTH the database (PocketBase) and the app (Vite), then opens your browser.
# First run installs dependencies + downloads PocketBase (~1 min). Later runs are quick.

cd "$(dirname "$0")"

# Make sure Homebrew's bin is on PATH (where node/npm live).
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

pause_exit() { echo ""; read -n 1 -s -r -p "Press any key to close..."; exit 1; }

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js isn't installed."
  echo "  Install it from https://nodejs.org (the LTS download), then double-click this file again."
  pause_exit
fi

# 1. Install JS dependencies if missing
if [ ! -d node_modules ]; then
  echo "First-time setup — installing dependencies (~30 seconds)..."
  npm install --silent || { echo "npm install failed."; pause_exit; }
fi

# 2. Download the PocketBase binary if it isn't here (it's intentionally not in git)
if [ ! -f pocketbase/pocketbase ]; then
  echo "Downloading the database engine (PocketBase)..."
  mkdir -p pocketbase
  ARCH=$(uname -m); [ "$ARCH" = "arm64" ] && PBARCH="arm64" || PBARCH="amd64"
  TAG=$(curl -s https://api.github.com/repos/pocketbase/pocketbase/releases/latest | grep -o '"tag_name": "[^"]*' | head -1 | cut -d'"' -f4)
  VER=${TAG#v}
  curl -sL -o pocketbase/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/${TAG}/pocketbase_${VER}_darwin_${PBARCH}.zip" \
    && (cd pocketbase && unzip -oq pb.zip && rm pb.zip) \
    || { echo "PocketBase download failed."; pause_exit; }
fi

# 3. Start PocketBase in the background; stop it automatically when this window closes
echo ""
echo "  ☕ Starting Koffeinkartellet (database + app)..."
( cd pocketbase && ./pocketbase serve --http=127.0.0.1:8090 >/tmp/koffein-pb.log 2>&1 ) &
PB_PID=$!
cleanup() { echo ""; echo "Stopping database..."; kill "$PB_PID" 2>/dev/null; }
trap cleanup EXIT INT TERM

echo "  Database: http://127.0.0.1:8090/_/   (admin dashboard)"
echo "  App will open in your browser shortly."
echo "  To stop everything, close this Terminal window."
echo ""

# 4. Start the app (foreground). When you close this, the trap stops PocketBase too.
npm run dev
