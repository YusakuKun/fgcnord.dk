"""Shared Poster Brutalism helpers for FGCNORD print/social graphics.

Palette and motifs per DESIGN.md. Import from poster scripts:
    from poster_lib import *  (run from repo root, design/ on sys.path)
"""

import math

from PIL import Image, ImageDraw, ImageFont

# --- palette (DESIGN.md) ---
COAL = "#0A1E3C"
INK = "#0B1526"
CREAM = "#F4F8FB"
BRICK = "#00AEEF"
BRICK_SOFT = "#4FC3F7"
RED = "#E60012"
GOLD = "#FFB300"
MUTED = "#44506A"

ARCHIVO = "design/ArchivoBlack.ttf"
GEORGIA = "C:/Windows/Fonts/georgiab.ttf"
IMPACT = "C:/Windows/Fonts/impact.ttf"


def font(size, path=ARCHIVO):
    return ImageFont.truetype(path, size)


def halftone(draw, box, color, step=24, r=2):
    x0, y0, x1, y1 = box
    for y in range(y0, y1, step):
        for x in range(x0 + (step // 2 if (y // step) % 2 else 0), x1, step):
            draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def sparkle(draw, cx, cy, size, color):
    """4-point star."""
    pts = []
    for i in range(8):
        ang = math.pi / 4 * i - math.pi / 2
        r = size if i % 2 == 0 else size * 0.28
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    draw.polygon(pts, fill=color)


def splatter(draw, cx, cy, r, color):
    """Paint splatter: central blob + irregular satellite drops."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    drops = [(1.6, 0.3, 0.42), (-1.4, 0.9, 0.34), (0.8, -1.5, 0.38),
             (-0.9, -1.2, 0.28), (1.9, 1.4, 0.30), (-1.8, -0.5, 0.24),
             (0.2, 1.8, 0.26)]
    for dx, dy, s in drops:
        rr = r * s
        draw.ellipse([cx + dx * r - rr, cy + dy * r - rr,
                      cx + dx * r + rr, cy + dy * r + rr], fill=color)


def starburst(base, center, text, bg, fg, size=26, rot=9, spikes=14):
    """P5 starburst sticker, rotated as one layer. Text: \n for multi-line."""
    f = font(size)
    lines = text.split("\n")
    widest = max(f.getlength(ln) for ln in lines)
    r_out = int(max(widest, size) * 0.82) + 26
    line_h = int(size * 1.15)
    r_out += int((len(lines) - 1) * line_h * 0.6)  # grow for extra lines
    r_in = int(r_out * 0.76)
    S = r_out * 2 + 30
    s = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(s)
    cx = cy = S // 2
    for dx, dy, col in ((8, 8, INK), (0, 0, bg)):
        pts = []
        for i in range(spikes * 2):
            ang = math.pi / spikes * i - math.pi / 2
            r = r_out if i % 2 == 0 else r_in
            pts.append((cx + dx + r * math.cos(ang), cy + dy + r * math.sin(ang)))
        d.polygon(pts, fill=col)
    total_h = line_h * len(lines)
    for i, ln in enumerate(lines):
        bbox = d.textbbox((0, 0), ln, font=f)
        d.text((cx - (bbox[0] + bbox[2]) / 2,
                cy - total_h / 2 + i * line_h - bbox[1]),
               ln, font=f, fill=fg)
    s = s.rotate(rot, expand=True, resample=Image.BICUBIC)
    base.alpha_composite(s, (int(center[0] - s.width / 2), int(center[1] - s.height / 2)))


def tracked(draw, xy, text, f, fill, tracking=8):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch) + tracking


def tracked_width(text, f, tracking=8):
    return sum(f.getlength(ch) + tracking for ch in text) - tracking


def zigzag_points(x0, y0, x1, y1, teeth, amp):
    """Zigzag line from (x0,y0) to (x1,y1) as a point list."""
    pts = []
    n = teeth * 2
    for i in range(n + 1):
        t = i / n
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t + (amp if i % 2 else -amp)
        pts.append((x, y))
    return pts


def ransom(base, cx, cy, text, gap=44, scale=1.0):
    """Ransom-note headline per Atlus' P5 style guide (se DESIGN.md):
    boxed letters, mixed fonts, per-letter angles, inversions, mixed case.
    Spaces become gaps (no box); style indices count letters only."""
    fonts = [ARCHIVO, GEORGIA, IMPACT]
    sizes = [int(s * scale) for s in (118, 112, 128)]  # Impact runs condensed
    gap = int(gap * scale)
    rotations = [-7, 5, -4, 8, -6, 4, -8, 6]
    jitters = [0, -16, 10, -8, 14, -12, 8, -2]
    invert = {2}        # ink box / cream letter
    accent = {5}        # red box / cream letter
    lower = {6}         # mixed case

    layers = []
    total_w = 0
    li = 0  # letter-only index (spaces skipped)
    for ch in text:
        if ch == " ":
            layers.append((None, 0, gap))
            total_w += gap
            continue
        i = li
        li += 1
        ch = ch.lower() if i in lower else ch
        f = font(sizes[i % 3], fonts[i % 3])
        bbox = f.getbbox(ch)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        pad = 16
        bw, bh = tw + pad * 2, th + pad * 2
        layer = Image.new("RGBA", (bw + 24, bh + 24), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.rectangle([10, 10, 10 + bw, 10 + bh], fill=INK)  # hard shadow
        box_col = RED if i in accent else (INK if i in invert else CREAM)
        txt_col = CREAM if (i in invert or i in accent) else INK
        ld.rectangle([3, 3, 3 + bw, 3 + bh], fill=box_col, outline=INK, width=3)
        ld.text((3 + pad - bbox[0], 3 + pad - bbox[1]), ch, font=f, fill=txt_col)
        layer = layer.rotate(rotations[i % len(rotations)], expand=True,
                             resample=Image.BICUBIC)
        advance = layer.width - 26  # overlap including rotation growth
        layers.append((layer, jitters[i % len(jitters)], advance))
        total_w += advance
    x = cx - total_w / 2
    for layer, jy, advance in layers:
        if layer is None:
            x += gap
            continue
        base.alpha_composite(layer, (int(x), int(cy + jy - layer.height / 2)))
        x += advance


def tape_strip(base, y, items, bg=INK, fg=CREAM, border=CREAM, rot=-3,
               size=24, width=1440, sep=" /// "):
    """Rotated ticker tape strip. Text is shrunk to fit `width` and the
    rotated tape is centred on the canvas, so nothing clips at the edges."""
    f = font(size)
    ticker = sep.join(items)
    tw = f.getlength(ticker)
    while tw > width - 60 and size > 10:
        size -= 1
        f = font(size)
        tw = f.getlength(ticker)
    rad = math.radians(abs(rot))
    h = 66
    # extra canvas so the rotated tape still spans [0, width] edge-to-edge
    extra = int(width * (1 - math.cos(rad)) + h * math.sin(rad)) + 4
    tape_w = width + extra
    tape = Image.new("RGBA", (tape_w, h), (0, 0, 0, 0))
    dt = ImageDraw.Draw(tape)
    dt.rectangle([0, 0, tape_w - 1, h - 1], fill=bg)
    dt.rectangle([0, 0, tape_w - 1, 5], fill=border)
    dt.rectangle([0, h - 5, tape_w - 1, h - 1], fill=border)
    dt.text(((tape_w - tw) / 2, 19), ticker, font=f, fill=fg)
    tape = tape.rotate(rot, expand=True, resample=Image.BICUBIC)
    base.alpha_composite(tape, (int(-extra / 2), y))


def stacked_text(draw, xy, text, size, fg, shadow=BRICK, shadow2=INK,
                 o1=7, o2=14, path=ARCHIVO):
    """Headline with stacked hard shadows (poster signature)."""
    f = font(size, path)
    x, y = xy
    draw.text((x + o2, y + o2), text, font=f, fill=shadow2)
    draw.text((x + o1, y + o1), text, font=f, fill=shadow)
    draw.text((x, y), text, font=f, fill=fg)
    return f
