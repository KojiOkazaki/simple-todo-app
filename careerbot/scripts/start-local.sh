#!/usr/bin/env bash
# Bring up the full local CareerBot stack on macOS (after a reboot).
#   VOICEVOX (TTS) + Whisper (STT, optional) via Docker, Ollama (LLM),
#   and the relay server on :8090. Then prints health + the Mac LAN IP.
#
# Usage:  bash careerbot/scripts/start-local.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "[1/4] Docker containers (VOICEVOX / Whisper)..."
open -a Docker 2>/dev/null || true
for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
docker start voicevox 2>/dev/null && echo "  voicevox started" || echo "  ! voicevox container missing (create once: docker run -d --name voicevox -p 50021:50021 voicevox/voicevox_engine:cpu-latest)"
docker start whisper  2>/dev/null && echo "  whisper started"  || echo "  (whisper optional; needed only for voice input)"

echo "[2/4] Ollama (LLM)..."
pgrep -x ollama >/dev/null 2>&1 || { (ollama serve >/tmp/ollama.log 2>&1 &); sleep 2; }
ollama list >/dev/null 2>&1 && echo "  ollama OK" || echo "  ! ollama not responding"

echo "[3/4] Relay server :8090..."
cd "$HERE/../backend"
lsof -ti:8090 | xargs kill -9 2>/dev/null || true
nohup env VOICE_PROVIDER="${VOICE_PROVIDER:-local}" \
  LLM_MODEL="${LLM_MODEL:-gemma3:4b}" \
  STT_MODEL="${STT_MODEL:-Systran/faster-whisper-small}" \
  VOICEVOX_SPEAKER="${VOICEVOX_SPEAKER:-3}" \
  VOICE_OUTPUT="${VOICE_OUTPUT:-voicevox}" \
  SOUNDBOARD_DIR="${SOUNDBOARD_DIR:-$HERE/../clips}" \
  PORT=8090 node src/index.js > /tmp/careerbot.log 2>&1 &
sleep 2

echo "[4/4] Health:"
curl -s localhost:50021/version >/dev/null 2>&1 && echo "  VOICEVOX  OK" || echo "  VOICEVOX  DOWN"
curl -s localhost:8000/health   >/dev/null 2>&1 && echo "  Whisper   OK" || echo "  Whisper   DOWN (optional)"
printf "  Relay     "; curl -s localhost:8090/healthz || echo "DOWN"; echo
echo
echo "  Mac LAN IP : $(ipconfig getifaddr en0 2>/dev/null || echo '?')"
echo "  -> The device's SERVER_URI (config.h) must use this IP."
echo "     If it changed, update config.h and re-flash, or set the router to"
echo "     reserve a fixed IP for this Mac."
echo
echo "  Voice (VOICEVOX speaker): ${VOICEVOX_SPEAKER:-3}  (override: VOICEVOX_SPEAKER=8 bash $(basename "$0"))"
echo
echo "Done. Power on the StopWatch; it auto-connects. Logs: tail -f /tmp/careerbot.log"
echo "List voices: curl -s localhost:50021/speakers | python3 -c \"import sys,json;[print(st['id'],s['name'],st['name']) for s in json.load(sys.stdin) for st in s['styles']]\""
