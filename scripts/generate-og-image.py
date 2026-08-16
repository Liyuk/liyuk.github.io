#!/usr/bin/env python3
"""Generate the site's default social-share card (og:image), 1200×630.

Rendered as a flat, editorial card matching the site palette (cream / ink /
accent green) with the brand name and tagline. Re-run after changing branding:

    python3 scripts/generate-og-image.py

Output: public/images/og-default.png (committed; served at /images/og-default.png).
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER = (247, 244, 238)   # --paper  #f7f4ee
INK = (35, 37, 34)        # --ink    #232522
MUTED = (105, 106, 101)   # --muted  #696a65
ACCENT = (53, 104, 93)    # --accent #35685d

# CJK-capable fonts available on macOS. .ttc collections need an explicit index.
SERIF = "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc"
SANS = "/System/Library/Fonts/Hiragino Sans GB.ttc"


def load(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()


def main():
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    # Decorative accent: a thin rule + a small brand dot, echoing the favicon's
    # green-orange palette without needing to rasterize the SVG potato.
    d.rectangle([88, 96, 160, 100], fill=ACCENT)          # accent rule
    d.ellipse([96, 130, 136, 170], fill=ACCENT)           # brand dot

    eyebrow = load(SANS, 34)
    title = load(SERIF, 96)
    sub = load(SANS, 40)

    d.text((88, 210), "LIYUK", font=eyebrow, fill=ACCENT)
    d.text((84, 300), "沉默土豆的烹饪指南", font=title, fill=INK)
    d.text((90, 470), "关于技术、领导力与日常的现场笔记", font=sub, fill=MUTED)

    img.save("public/images/og-default.png", optimize=True)
    print("wrote public/images/og-default.png", img.size)


if __name__ == "__main__":
    main()
