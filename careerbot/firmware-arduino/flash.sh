#!/usr/bin/env bash
# CareerBot StopWatch — one-shot CLI build & flash (macOS).
# Installs arduino-cli + ESP32 core + libraries, compiles, and uploads.
#
# Usage:
#   bash flash.sh             # auto-detect the serial port
#   bash flash.sh /dev/cu.usbmodemXXXX
#
# Edit careerbot/config.h (Wi-Fi + SERVER_HOST) BEFORE running.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SKETCH="$HERE/careerbot"
FQBN="esp32:esp32:esp32s3:PSRAM=opi,FlashSize=16M,CDCOnBoot=cdc"

say() { printf "\n\033[1;36m[flash]\033[0m %s\n" "$*"; }

# 1) arduino-cli
if ! command -v arduino-cli >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    say "installing arduino-cli via brew"; brew install arduino-cli
  else
    say "installing arduino-cli to ./bin"
    mkdir -p "$HERE/bin"
    curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR="$HERE/bin" sh
    export PATH="$HERE/bin:$PATH"
  fi
fi
say "arduino-cli: $(arduino-cli version)"

# 2) ESP32 core
say "installing ESP32 board package (first time is slow)"
arduino-cli config init --overwrite >/dev/null 2>&1 || true
arduino-cli config add board_manager.additional_urls \
  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json >/dev/null 2>&1 || true
arduino-cli core update-index
arduino-cli core install esp32:esp32

# 3) libraries
say "installing libraries (M5Unified, ArduinoJson, WebSockets)"
arduino-cli lib install "M5Unified" "ArduinoJson" "WebSockets"

# 4) config check
if grep -q "your-wifi-ssid" "$SKETCH/config.h"; then
  say "⚠️  config.h はまだ初期値です。Wi-Fi と SERVER_HOST を編集してください:"
  echo "      $SKETCH/config.h"
  echo "    Mac の LAN IP: $(ipconfig getifaddr en0 2>/dev/null || echo '不明 (ipconfig getifaddr en0)')"
  read -r -p "    このまま続けますか? [y/N] " a; [ "$a" = "y" ] || exit 1
fi

# 4.5) embed logo (PNG -> RGB565 header) if Pillow is available
LOGO_PNG="$SKETCH/data/careerbot.png"
if [ -f "$LOGO_PNG" ]; then
  if python3 -c "import PIL" >/dev/null 2>&1; then
    say "embedding logo ($LOGO_PNG -> logo_img.h)"
    python3 - "$LOGO_PNG" "$SKETCH/logo_img.h" <<'PY'
import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
W = 150
img = Image.open(src).convert("RGBA")
h = round(img.height * W / img.width)
img = img.resize((W, h), Image.LANCZOS)
bg = Image.new("RGB", (W, h), (0, 0, 0))  # screen is black
bg.paste(img, mask=img.split()[3])
px = bg.load()
def r565(r,g,b): return ((r&0xF8)<<8)|((g&0xFC)<<3)|(b>>3)
vals=[r565(*px[x,y]) for y in range(h) for x in range(W)]
with open(out,"w") as f:
    f.write("#pragma once\n#include <stdint.h>\n")
    f.write(f"static const uint16_t logo_w={W};\nstatic const uint16_t logo_h={h};\n")
    f.write(f"static const uint16_t logo_data[{W*h}]={{\n")
    for i in range(0,len(vals),12):
        f.write(" "+",".join(f"0x{v:04X}" for v in vals[i:i+12])+",\n")
    f.write("};\n")
print("ok")
PY
  else
    say "Pillow 未導入のためロゴ埋め込みをスキップ（簡易表示にフォールバック）。"
    echo "    入れる場合: pip3 install pillow  して再実行"
  fi
fi

# 5) port
PORT="${1:-}"
if [ -z "$PORT" ]; then
  PORT="$(arduino-cli board list | awk '/usbmodem|usbserial|cu\./{print $1; exit}')"
fi
[ -n "$PORT" ] || { say "シリアルポートが見つかりません。引数で指定: bash flash.sh /dev/cu.xxxx"; arduino-cli board list; exit 1; }
say "port: $PORT"

# 6) compile + upload
say "compiling"
arduino-cli compile --fqbn "$FQBN" "$SKETCH"
say "uploading"
arduino-cli upload -p "$PORT" --fqbn "$FQBN" "$SKETCH"

say "✅ 完了。シリアルモニタ: arduino-cli monitor -p $PORT -c baudrate=115200"
