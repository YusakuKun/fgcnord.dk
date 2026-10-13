"""Poster: BJERGTOP 3 — placeholder event, Poster Brutalism language (DESIGN.md).

1080x1350 (4:5 social). Placeholder date/venue. Run with fgcnord-docs venv python.
"""

import math

from PIL import Image, ImageDraw, ImageFont

COAL = "#0A1E3C"
INK = "#0B1526"
CREAM = "#F4F8FB"
BRICK = "#00AEEF"
BRICK_SOFT = "#4FC3F7"
RED = "#E60012"
GOLD = "#FFB300"
MUTED = "#44506A"

W, H = 1080, 1350
FONT = "design/ArchivoBlack.ttf"


def font(size):
    return ImageFont.truetype(FONT, size)


def halftone(draw, box, color, step=24, r=2):
    x0, y0, x1, y1 = box
    for y in range(y0, y1, step):
        for x in range(x0 + (step // 2 if (y // step) % 2 else 0), x1, step):
            draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def tracked(draw, xy, text, f, fill, tracking=6):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch) + tracking
    return x


def tracked_width(text, f, tracking=6):
    return sum(f.getlength(ch) + tracking for ch in text) - tracking


def starburst(base, center, text, bg, fg, size=30, rot=-8, spikes=14):
    f = font(size)
    r_out = int(max(f.getlength(text), size) * 0.82) + 26
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
    bbox = d.textbbox((0, 0), text, font=f)
    d.text((cx - (bbox[0] + bbox[2]) / 2, cy - (bbox[1] + bbox[3]) / 2),
           text, font=f, fill=fg)
    s = s.rotate(rot, expand=True, resample=Image.BICUBIC)
    base.alpha_composite(s, (int(center[0] - s.width / 2), int(center[1] - s.height / 2)))


img = Image.new("RGBA", (W, H), COAL)
d = ImageDraw.Draw(img)
halftone(d, (0, 0, W, 700), "#12305C")

# --- wordmark top-left ---
f_wm = font(34)
d.text((63, 43), "FGCNORD", font=f_wm, fill=BRICK)
d.text((58, 38), "FGCNORD", font=f_wm, fill=CREAM)

# --- starburst top-right (the one red element) ---
starburst(img, (990, 82), "SNART", RED, CREAM, size=26, rot=9)

# --- eyebrow ---
f_eb = font(26)
eb = "FGCNORD PRÆSENTERER ET TOPPMØDE"
tracked(d, ((W - tracked_width(eb, f_eb, 8)) / 2, 210), eb, f_eb, BRICK_SOFT, tracking=8)

# --- headline: BJERGTOP, stacked shadows, centered ---
f_h = font(148)
hw = f_h.getlength("BJERGTOP")
hx = (W - hw) / 2
for dx, dy, col in ((14, 14, INK), (7, 7, BRICK)):
    d.text((hx + dx, 262 + dy), "BJERGTOP", font=f_h, fill=col)
d.text((hx, 262), "BJERGTOP", font=f_h, fill=CREAM)

# --- giant gold edition numeral, rotated as its own layer ---
f_n = font(300)
num = Image.new("RGBA", (400, 420), (0, 0, 0, 0))
dn = ImageDraw.Draw(num)
for dx, dy, col in ((18, 18, INK), (9, 9, BRICK)):
    dn.text((40 + dx, 20 + dy), "3", font=f_n, fill=col)
dn.text((40, 20), "3", font=f_n, fill=GOLD)
num = num.rotate(-5, expand=True, resample=Image.BICUBIC)
img.alpha_composite(num, (int((W - num.width) / 2), 440))

# --- mountain ranges (overlapping the numeral's base) ---
d = ImageDraw.Draw(img)
back_peaks = [(0, 1010), (140, 830), (290, 980), (430, 800), (600, 960),
              (760, 810), (920, 975), (1080, 850), (1080, 1200), (0, 1200)]
d.polygon(back_peaks, fill="#0E2A52")
front_peaks = [(0, 1120), (180, 920), (330, 1060), (510, 880), (700, 1050),
               (880, 910), (1080, 1040), (1080, 1220), (0, 1220)]
d.polygon(front_peaks, fill=INK)
# snow caps on the front range
for px, py in [(180, 920), (510, 880), (880, 910)]:
    d.polygon([(px - 34, py + 52), (px, py), (px + 34, py + 52),
               (px + 14, py + 44), (px, py + 56), (px - 14, py + 44)],
              fill=CREAM)

# --- tape strip across the mountains ---
tape = Image.new("RGBA", (W + 120, 66), (0, 0, 0, 0))
dt = ImageDraw.Draw(tape)
dt.rectangle([0, 0, W + 119, 65], fill=INK)
dt.rectangle([0, 0, W + 119, 5], fill=CREAM)
dt.rectangle([0, 60, W + 119, 65], fill=CREAM)
f_t = font(24)
ticker = " 16 SPILLERE /// INVITATIONAL /// 4 PLADSER PÅ FOLKEAFSTEMNING /// MELEE /// ULTIMATE /// ROA2 /// MK WII ///"
x = 0
while x < W + 120:
    dt.text((x, 19), ticker, font=f_t, fill=CREAM)
    x += int(f_t.getlength(ticker)) + 4
tape = tape.rotate(-3, expand=True, resample=Image.BICUBIC)
img.alpha_composite(tape, (-60, 940))

# --- cream bottom band, slash edge ---
d = ImageDraw.Draw(img)
d.polygon([(0, 1112), (W, 1058), (W, H), (0, H)], fill=CREAM)
d.polygon([(0, 1100), (W, 1046), (W, 1058), (0, 1112)], fill=BRICK)

d.text((70, 1180), "DATO: TBA", font=font(52), fill=INK)
d.text((70, 1258), "INVITATIONAL · AALBORG · LOKALE ANNONCERES", font=font(24), fill=MUTED)
f_url = font(28)
u = "FGCNORD.DK"
d.text((W - 70 - f_url.getlength(u), 1288), u, font=f_url, fill=BRICK)
halftone(d, (0, 1300, W, H), "#DCE5EF", step=28, r=2)

img.convert("RGB").save("design/poster-bjergtop-3-v2.png")
print("wrote design/poster-bjergtop-3-v2.png")
