"""Render design-direction mockup v2 for FGCNORD 'Poster Brutalism'.

Not production art — a vibe check for the design philosophy in DESIGN.md.
Run with the fgcnord-docs venv python (has Pillow).
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

W, H = 1440, 2100
FONT = "design/ArchivoBlack.ttf"


def font(size):
    return ImageFont.truetype(FONT, size)


def text_w(f, s):
    return f.getlength(s)


def halftone(draw, box, color, step=26, r=2):
    x0, y0, x1, y1 = box
    for y in range(y0, y1, step):
        for x in range(x0 + (step // 2 if (y // step) % 2 else 0), x1, step):
            draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def sparkle(draw, cx, cy, size, color):
    """4-point Persona-ish star."""
    pts = []
    for i in range(8):
        ang = math.pi / 4 * i - math.pi / 2
        r = size if i % 2 == 0 else size * 0.28
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    draw.polygon(pts, fill=color)


def starburst(base, center, text, bg, fg, size=36, rot=-6, spikes=14,
              r_out=None, r_in=None):
    """Spiky P5-style burst badge with centered text, rotated as one layer."""
    f = font(size)
    tw, th = text_w(f, text), size
    if r_out is None:
        r_out = int(max(tw, th) * 0.78) + 22
    if r_in is None:
        r_in = int(r_out * 0.78)
    S = r_out * 2 + 30
    s = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(s)
    cx = cy = S // 2
    for dx, dy, col in ((9, 9, INK), (0, 0, bg)):  # hard shadow pass + face
        pts = []
        for i in range(spikes * 2):
            ang = math.pi / spikes * i - math.pi / 2
            r = r_out if i % 2 == 0 else r_in
            pts.append((cx + dx + r * math.cos(ang), cy + dy + r * math.sin(ang)))
        d.polygon(pts, fill=col)
    bbox = d.textbbox((0, 0), text, font=f)
    d.text((cx - (bbox[0] + bbox[2]) / 2, cy - (bbox[1] + bbox[3]) / 2),
           text, font=f, fill=fg)
    s = s.rotate(rot, expand=True, resample=Image.BICUBIC)
    base.alpha_composite(s, (int(center[0] - s.width / 2), int(center[1] - s.height / 2)))


def slash(d, x0, y0, x1, thick, color):
    """Slanted parallel-strip: drops `thick` vertically, slants down-right."""
    d.polygon([(x0, y0), (x1, y0 - 26), (x1, y0 - 26 + thick), (x0, y0 + thick)],
              fill=color)


# ================= base =================
img = Image.new("RGBA", (W, H), COAL)
d = ImageDraw.Draw(img)
halftone(d, (0, 0, W, 1000), "#12305C")
sparkle(d, 1330, 190, 16, BRICK)
sparkle(d, 120, 700, 12, BRICK)
sparkle(d, 980, 130, 10, GOLD)

# --- navbar ---
d.rectangle([0, 0, W, 84], fill=INK)
d.rectangle([0, 84, W, 90], fill=BRICK)
f_logo = font(40)
d.text((53, 25), "FGCNORD", font=f_logo, fill=BRICK)   # echo pass
d.text((48, 20), "FGCNORD", font=f_logo, fill=CREAM)
f_nav = font(22)
nav = ["TURNERINGER", "RANGELISTE", "DOCS", "OM OS"]
total = sum(text_w(f_nav, i) for i in nav) + 44 * (len(nav) - 1)
x = W - 230 - total
for item in nav:
    d.text((x, 31), item, font=f_nav, fill=CREAM)
    x += text_w(f_nav, item) + 44
bx = W - 196
d.rectangle([bx + 6, 24 + 6, bx + 148 + 6, 24 + 42 + 6], fill=CREAM)
d.rectangle([bx, 24, bx + 148, 24 + 42], fill=RED, outline=INK, width=3)
f_btn = font(20)
d.text((bx + (148 - text_w(f_btn, "MELD DIG")) / 2, 32), "MELD DIG",
       font=f_btn, fill=CREAM)

# --- hero headline: hard stacked shadows ---
f_h = font(118)
for dx, dy, col in ((16, 16, INK), (8, 8, BRICK)):
    d.text((90 + dx, 218 + dy), "DANMARKS", font=f_h, fill=col)
    d.text((90 + dx, 348 + dy), "FGC-HUB", font=f_h, fill=col)
d.text((90, 218), "DANMARKS", font=f_h, fill=CREAM)
d.text((90, 348), "FGC-HUB", font=f_h, fill=CREAM)
slash(d, 94, 540, 660, 22, BRICK)
d.text((94, 612), "Turneringer. Ranglister. Fællesskab. Siden 2019.",
       font=font(30), fill="#9FC3E8")

# --- hero right: event poster card (cream on dark, cream shadow) ---
cw, ch = 400, 460
card = Image.new("RGBA", (cw + 60, ch + 60), (0, 0, 0, 0))
cd = ImageDraw.Draw(card)
cd.rectangle([12, 12, 12 + cw, 12 + ch], fill=CREAM)  # cream hard shadow
cd.rectangle([0, 0, cw, ch], fill=CREAM, outline=INK, width=4)
cd.rectangle([0, 0, cw, 74], fill=INK)  # header band
cd.text((26, 20), "NÆSTE EVENT", font=font(26), fill=BRICK)
cd.text((26, 104), "FGCNORD", font=font(46), fill=INK)
cd.text((26, 158), "CLASH #12", font=font(46), fill=INK)
slash(cd, 26, 236, 300, 14, RED)
cd.text((26, 280), "14.–16. november", font=font(28), fill=INK)
cd.text((26, 330), "3 dage Rivals of Aether 2", font=font(22), fill=MUTED)
cd.text((26, 366), "Gratis entré · København", font=font(22), fill=MUTED)
cd.rectangle([32, 424, 32 + 180, 424 + 48], fill=BRICK)  # brick offset shadow
cd.rectangle([26, 418, 26 + 180, 418 + 48], fill=INK)
f_btn2 = font(20)
cd.text((26 + (180 - text_w(f_btn2, "TILMELD")) / 2, 430), "TILMELD",
        font=f_btn2, fill=CREAM)
card = card.rotate(-2, expand=True, resample=Image.BICUBIC)
img.alpha_composite(card, (940, 220))
starburst(img, (1350, 235), "LIVE", RED, CREAM, size=34, rot=-8)

# --- diagonal transition: brick slash + cream slope ---
SLOPE = 96  # vertical drop across full width (≈3.8°)
TOP = 1020
d.polygon([(0, TOP - SLOPE - 26), (W, TOP - 26), (W, TOP - 14),
           (0, TOP - SLOPE - 14)], fill=BRICK)
d.polygon([(0, TOP - SLOPE), (W, TOP), (W, H), (0, H)], fill=CREAM)

# marquee tape riding the slope
angle = math.degrees(math.atan2(SLOPE, W))
tape_txt = "  ///  NÆSTE EVENT: FGCNORD CLASH #12  ///  3 DAGE RIVALS 2  ///  GRATIS ENTRÉ"
tape = Image.new("RGBA", (W + 160, 62), INK)
dt = ImageDraw.Draw(tape)
f_t = font(26)
x = -10
while x < W + 160:
    dt.text((x, 14), tape_txt, font=f_t, fill=BRICK)
    x += int(text_w(f_t, tape_txt)) + 8
tape = tape.rotate(-angle, expand=True, resample=Image.BICUBIC)
img.alpha_composite(tape, (-80, TOP - SLOPE - 4))

# --- cards row: fully-rendered tilted layers ---
def icon_trophy(cd, cx, cy, col=INK, acc=GOLD):
    cd.polygon([(cx - 44, cy - 34), (cx + 44, cy - 34), (cx + 30, cy + 14),
                (cx - 30, cy + 14)], fill=col)
    cd.arc([cx - 70, cy - 40, cx - 30, cy + 6], 90, 300, fill=col, width=8)
    cd.arc([cx + 30, cy - 40, cx + 70, cy + 6], 230, 90, fill=col, width=8)
    cd.rectangle([cx - 8, cy + 14, cx + 8, cy + 34], fill=col)
    cd.rectangle([cx - 34, cy + 34, cx + 34, cy + 48], fill=col)
    sparkle(cd, cx + 58, cy - 46, 12, acc)


def icon_podium(cd, cx, cy, col=INK, acc=GOLD):
    cd.rectangle([cx - 66, cy - 6, cx - 26, cy + 48], fill=col)
    cd.rectangle([cx - 16, cy - 40, cx + 24, cy + 48], fill=col)
    cd.rectangle([cx + 34, cy + 10, cx + 74, cy + 48], fill=col)
    sparkle(cd, cx + 4, cy - 60, 13, acc)


def icon_book(cd, cx, cy, col=INK, acc=BRICK):
    cd.polygon([(cx - 64, cy - 30), (cx, cy - 14), (cx, cy + 40),
                (cx - 64, cy + 24)], fill=col)
    cd.polygon([(cx + 64, cy - 30), (cx, cy - 14), (cx, cy + 40),
                (cx + 64, cy + 24)], fill=col)
    cd.rectangle([cx - 3, cy - 14, cx + 3, cy + 40], fill=acc)


cards = [
    ("TURNERINGER", "Kommende events og", "tilmelding via start.gg.", icon_trophy, -1.2, None),
    ("RANGELISTE", "Danmarks power rankings,", "opdateret hvert kvartal.", icon_podium, 0.8, "#1"),
    ("DOCS", "Guides til admins, TOs", "og stream-crew.", icon_book, -0.7, None),
]
CW2, CH2 = 340, 420
for i, (title, l1, l2, icon, tilt, badge) in enumerate(cards):
    cx0 = 150 + i * 390
    cy0 = 1180
    layer = Image.new("RGBA", (CW2 + 60, CH2 + 60), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rectangle([12, 12, 12 + CW2, 12 + CH2], fill=INK)
    ld.rectangle([0, 0, CW2, CH2], fill=CREAM, outline=INK, width=4)
    ld.text((28, 26), title, font=font(32), fill=INK)
    ld.rectangle([30, 76, 150, 84], fill=BRICK)
    icon(ld, CW2 // 2, 170)
    ld.text((28, 268), l1, font=font(19), fill=MUTED)
    ld.text((28, 298), l2, font=font(19), fill=MUTED)
    ld.rectangle([34, 356, 34 + 170, 356 + 48], fill=BRICK)
    ld.rectangle([28, 350, 28 + 170, 350 + 48], fill=INK)
    ld.text((28 + (170 - text_w(f_btn2, "SE MERE")) / 2, 362), "SE MERE",
            font=f_btn2, fill=CREAM)
    layer = layer.rotate(tilt, expand=True, resample=Image.BICUBIC)
    img.alpha_composite(layer, (cx0, cy0))
    if badge:
        starburst(img, (cx0 + CW2 + 24, cy0 + 12), badge, GOLD, INK,
                  size=42, rot=-10, spikes=12)

# --- footer: watermark + signoff ---
d = ImageDraw.Draw(img)
wm = Image.new("RGBA", (W, 280), (0, 0, 0, 0))
dw = ImageDraw.Draw(wm)
f_wm = font(180)
wx = (W - text_w(f_wm, "FGCNORD")) / 2
dw.text((wx, 10), "FGCNORD", font=f_wm, fill=(11, 21, 38, 55))
img.alpha_composite(wm, (0, 1650))
d.text((96, 1915), "fgcnord.dk", font=font(56), fill=INK)
d.text((96, 1990), "Design direction v2 — Poster Brutalism",
       font=font(24), fill=MUTED)
halftone(d, (0, 2040, W, H), "#DCE5EF", step=30, r=2)

img.convert("RGB").save("design/preview-v2.png")
print("wrote design/preview-v2.png")
