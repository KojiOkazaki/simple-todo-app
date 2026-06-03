#!/usr/bin/env bash
# Generate the ESP-IDF firmware logo header (logo_img.h) from a PNG.
# Composites over black (device screen is black) and emits logo_w/logo_h/logo_data
# matching main.cpp. Installs Pillow if needed.
#
# Usage:
#   bash make_logo.sh <input.png> [out_header] [width]
#   bash make_logo.sh ~/Desktop/soyogi_logo.png
set -euo pipefail

SRC="${1:?usage: make_logo.sh <input.png> [out_header] [width]}"
OUT="${2:-$HOME/M5StopWatch-UserDemo/main/logo_img.h}"
W="${3:-200}"

[ -f "$SRC" ] || { echo "Not found: $SRC"; exit 1; }
python3 -c "import PIL" 2>/dev/null || pip3 install pillow 2>/dev/null || pip3 install --break-system-packages pillow

python3 - "$SRC" "$OUT" "$W" <<'PY'
import sys
from PIL import Image
src, out, W = sys.argv[1], sys.argv[2], int(sys.argv[3])
img = Image.open(src).convert("RGBA")
h = round(img.height * W / img.width)
img = img.resize((W, h), Image.LANCZOS)
bg = Image.new("RGB", (W, h), (0, 0, 0))   # device screen is black
bg.paste(img, mask=img.split()[3])
px = bg.load()
def r565(r,g,b): return ((r&0xF8)<<8)|((g&0xFC)<<3)|(b>>3)
vals=[r565(*px[x,y]) for y in range(h) for x in range(W)]
with open(out,"w") as f:
    f.write(f"// Auto-generated from {src} by make_logo.sh\n#pragma once\n#include <stdint.h>\n")
    f.write(f"static const uint16_t logo_w={W};\nstatic const uint16_t logo_h={h};\n")
    f.write(f"static const uint16_t logo_data[{W*h}]={{\n")
    for i in range(0,len(vals),12):
        f.write(" "+",".join(f"0x{v:04X}" for v in vals[i:i+12])+",\n")
    f.write("};\n")
print(f"wrote {out}  ({W}x{h})")
PY
echo "Source recorded in header:"; head -1 "$OUT"
