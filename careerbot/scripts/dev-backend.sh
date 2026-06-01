#!/usr/bin/env bash
# Start the CareerBot backend for local development (mock provider, no API key).
set -euo pipefail
cd "$(dirname "$0")/../backend"

if [ ! -d node_modules ]; then
  echo "[dev] installing deps..."
  npm install
fi

export VOICE_PROVIDER="${VOICE_PROVIDER:-mock}"
export PORT="${PORT:-8080}"
export DEVICE_TOKENS="${DEVICE_TOKENS:-cb-dev-token}"

echo "[dev] starting backend on :$PORT (provider=$VOICE_PROVIDER)"
exec node --watch src/index.js
