#!/usr/bin/env python3
"""Convert the CareerBot logo PNG into a C array for firmware display.

Outputs RGB565 (default) suitable for direct framebuffer/LVGL blitting.

Usage:
    python3 scripts/png_to_c.py assets/logo/careerbot.png \
        firmware/components/display/logo_img.c --width 180

Requires Pillow:  pip install pillow
"""
import argparse
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: pip install pillow")


def rgb565(r, g, b):
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("png")
    ap.add_argument("out_c")
    ap.add_argument("--width", type=int, default=180, help="resize width (keeps aspect)")
    ap.add_argument("--name", default="careerbot_logo")
    args = ap.parse_args()

    img = Image.open(args.png).convert("RGBA")
    if args.width:
        h = round(img.height * args.width / img.width)
        img = img.resize((args.width, h), Image.LANCZOS)
    w, h = img.size

    # Composite over white so transparent areas match the splash background.
    bg = Image.new("RGB", (w, h), (255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    px = bg.load()

    words = [rgb565(*px[x, y]) for y in range(h) for x in range(w)]
    with open(args.out_c, "w") as f:
        f.write(f"// Auto-generated from {args.png} by scripts/png_to_c.py\n")
        f.write("#include <stdint.h>\n\n")
        f.write(f"const uint16_t {args.name}_w = {w};\n")
        f.write(f"const uint16_t {args.name}_h = {h};\n")
        f.write(f"const uint16_t {args.name}_data[{w*h}] = {{\n")
        for i in range(0, len(words), 12):
            f.write("  " + ",".join(f"0x{v:04X}" for v in words[i:i+12]) + ",\n")
        f.write("};\n")
    print(f"wrote {args.out_c} ({w}x{h}, {w*h} px, RGB565)")


if __name__ == "__main__":
    main()
