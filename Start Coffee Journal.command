#!/bin/bash
# Double-click this file to launch the Coffee Journal in your browser.
# First run installs dependencies (~30 seconds). Later runs are instant.

cd "$(dirname "$0")"

# Make sure Node is on PATH (Homebrew default location for Apple Silicon Macs)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js isn't installed."
  echo "  Install it from https://nodejs.org (the LTS download), then double-click this file again."
  echo ""
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First-time setup — installing dependencies (this takes ~30 seconds)..."
  npm install --silent || { echo "Install failed."; read -n 1 -s -r -p "Press any key to close..."; exit 1; }
fi

echo ""
echo "  ☕ Starting Coffee Journal..."
echo "  Your browser will open automatically."
echo "  To stop the app, close this Terminal window."
echo ""

npm run dev
