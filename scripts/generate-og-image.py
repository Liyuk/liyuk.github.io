#!/usr/bin/env python3
"""Generate the site's default social-share card (og:image), 1200×630.

Flat, left-aligned card in the site's light palette (tokens.css):
paper #f8f9f8, ink #1b211e, muted #5b605d, accent #0f7b5f. Sans only.
The right side carries the site motif: faint emerald threads (reading paths)
with hollow nodes (entries). Everything is drawn at 2× and downsampled so
lines and type are anti-aliased. Re-run after changing branding:

    python3 scripts/generate-og-image.py   # needs Pillow

Output: public/images/og-default.png (committed; served at /images/og-default.png).
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
S = 2  # supersampling factor
PAPER = (248, 249, 248)   # --paper  #f8f9f8
INK = (27, 33, 30)        # --ink    #1b211e
MUTED = (91, 96, 93)      # --muted  #5b605d
ACCENT = (15, 123, 95)    # --accent #0f7b5f

# CJK-capable sans fonts on macOS, in order of preference. .ttc collections
# need an explicit index (Hiragino Sans GB: 0 = W3, 2 = W6).
SANS = [
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0, 2),
    ("/System/Library/Fonts/PingFang.ttc", 0, 2),
    ("/System/Library/Fonts/STHeiti Medium.ttc", 0, 0),
]


# Latin line: Hiragino sets ’ as a full-width CJK glyph, so use a Latin sans.
LATIN = [("/System/Library/Fonts/HelveticaNeue.ttc", 0, 10)]


def font(size, bold=False, faces=SANS):
    for path, regular, heavy in faces:
        try:
            return ImageFont.truetype(path, size * S, index=heavy if bold else regular)
        except Exception:
            continue
    return ImageFont.load_default()


def mix(color, alpha):
    """Accent at `alpha` over paper, as an opaque colour (keeps the PNG flat)."""
    return tuple(round(p + (c - p) * alpha) for c, p in zip(color, PAPER))


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return tuple(u ** 3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t ** 3 * d for a, b, c, d in zip(p0, p1, p2, p3))


def threads(layer):
    """Five reading paths entering from the right edge and drifting left, each
    with a few hollow nodes; alpha falls off toward the text column."""
    d = ImageDraw.Draw(layer)
    paths = [
        ((1240, 70), (1080, 120), (930, 60), (760, 150), 4),
        ((1240, 205), (1090, 250), (960, 190), (800, 255), 5),
        ((1240, 330), (1100, 300), (990, 380), (820, 350), 3),
        ((1240, 455), (1080, 500), (950, 430), (780, 470), 6),
        ((1240, 585), (1100, 540), (970, 610), (800, 560), 4),
    ]
    for p0, p1, p2, p3, nodes in paths:
        pts = [bezier(p0, p1, p2, p3, i / 120) for i in range(121)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            a = 0.22 + 0.28 * max(0.0, min(1.0, (x0 - 760) / 380))
            d.line([(x0 * S, y0 * S), (x1 * S, y1 * S)], fill=mix(ACCENT, a), width=3)  # ≈1.25–1.5px after downsampling
        for k in range(nodes):
            x, y = bezier(p0, p1, p2, p3, 0.12 + 0.76 * (k + 0.5) / nodes)
            if x > W:
                continue
            a = 0.45 + 0.35 * max(0.0, min(1.0, (x - 760) / 380))
            r = 3.5 * S
            d.ellipse([x * S - r, y * S - r, x * S + r, y * S + r], fill=PAPER, outline=mix(ACCENT, a), width=3)


def main():
    img = Image.new("RGB", (W * S, H * S), PAPER)
    threads(img)
    d = ImageDraw.Draw(img)

    title = font(84, bold=True)
    latin = font(42, faces=LATIN + SANS)
    tagline = font(32)
    small = font(24, faces=LATIN + SANS)

    x = 88 * S
    d.text((x, 196 * S), "沉默土豆的烹饪指南", font=title, fill=INK)
    # The wordmark's node: a filled accent dot after the title.
    bbox = d.textbbox((x, 196 * S), "沉默土豆的烹饪指南", font=title)
    r = 7 * S
    cx, cy = bbox[2] + 14 * S, bbox[3] - r
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ACCENT)
    d.text((x + 2 * S, 320 * S), "Silent Potato’s Cookbook", font=latin, fill=INK)
    d.text((x + 2 * S, 384 * S), "关于技术、领导力与日常的现场笔记", font=tagline, fill=MUTED)
    d.text((x + 2 * S, 520 * S), "Liyuk  ·  liyuk.com", font=small, fill=MUTED)

    out = img.resize((W, H), Image.LANCZOS)
    # Flat art: a 256-colour palette keeps the file small; FASTOCTREE keeps the
    # few accent hues distinct instead of merging them into grey.
    out = out.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    out.save("public/images/og-default.png", optimize=True)
    print("wrote public/images/og-default.png", out.size)


if __name__ == "__main__":
    main()
