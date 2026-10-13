"""One-pager: KLUNS CREWS — Bootcamp 8 edition, Persona 5 × RoA2 crossover.

Full P5 treatment: red zigzag slab, ransom headline, calling-card quote,
speed lines, framed RoA2 key art with TAKE YOUR SHIRT! burst.
Bootcamp 8 (Kibæk/Herning) som tema, ikke militær.

A4-ish portrait (1240x1754 @150dpi). Exports PNG + 1-page PDF.
Run from repo root with fgcnord-docs venv python.
"""

import math
import sys

sys.path.insert(0, "design")

from PIL import Image, ImageDraw

from poster_lib import (
    BRICK, BRICK_SOFT, COAL, CREAM, GEORGIA, GOLD, INK, MUTED, RED,
    font, halftone, ransom, sparkle, splatter, starburst, tape_strip, tracked,
    tracked_width, zigzag_points,
)

W, H = 1240, 1754


def card(img, xy, w, h, fill=CREAM):
    x, y = xy
    d = ImageDraw.Draw(img)
    d.rectangle([x + 10, y + 10, x + 10 + w, y + 10 + h], fill=INK)
    d.rectangle([x, y, x + w, y + h], fill=fill, outline=INK, width=4)


img = Image.new("RGBA", (W, H), COAL)
d = ImageDraw.Draw(img)
halftone(d, (0, 0, W, 720), "#12305C")

# --- wordmark + SNART burst ---
f_wm = font(30)
d.text((53, 35), "FGCNORD", font=f_wm, fill=BRICK)
d.text((48, 30), "FGCNORD", font=f_wm, fill=CREAM)
starburst(img, (1155, 58), "SNART", CREAM, RED, size=22, rot=9)

# --- red zigzag slab + ransom headline ---
slab = [(-80, 100), (W + 80, 30)]
slab += zigzag_points(W + 80, 545, -80, 605, teeth=14, amp=18)
slab_ink = [(x + 14, y + 14) for x, y in slab]
d.polygon(slab_ink, fill=INK)
d.polygon(slab, fill=RED)

f_eb = font(22)
eb = "FGCNORD × RIVALS OF AETHER 2"
tracked(d, ((W - tracked_width(eb, f_eb, 7)) / 2 - 30, 118), eb, f_eb, CREAM, tracking=7)
ransom(img, W / 2, 310, "KLUNS CREWS", scale=0.85)

# stencil strip
f_st = font(28)
st = "BOOTCAMP 8 EDITION"
st_w = tracked_width(st, f_st, 10)
bx = (W - st_w) / 2 - 40
d.rectangle([bx + 8, 488 + 8, bx + st_w + 80 + 8, 488 + 52 + 8], fill=INK)
d.rectangle([bx, 488, bx + st_w + 80, 488 + 52], fill=INK, outline=GOLD, width=3)
tracked(d, (bx + 40, 500), st, f_st, GOLD, tracking=10)

# --- calling card (P5 parody) ---
d = ImageDraw.Draw(img)
f_cc = font(27, GEORGIA)
cc = "»Tag jeres værste skjorter på. Vi kommer efter jeres stocks.« — Kluns Crews"
cc_w = f_cc.getlength(cc)
d.text(((W - cc_w) / 2 + 3, 653 + 3), cc, font=f_cc, fill=INK)
d.text(((W - cc_w) / 2, 653), cc, font=f_cc, fill=CREAM)

# --- roster tape (efter art-sektionen, så den ligger over speed lines) ---
# (flyttet længere ned)

# --- RoA2 key art i P5-fotogramme ---
art = Image.open("public/hero-illustration.png").convert("RGB")
art_w = 530
art_h = int(art.height * art_w / art.width)  # ~364
art = art.resize((art_w, art_h), Image.LANCZOS)

frame = Image.new("RGBA", (art_w + 60, art_h + 60), (0, 0, 0, 0))
df = ImageDraw.Draw(frame)
df.rectangle([22, 22, 22 + art_w + 16, 22 + art_h + 16], fill=INK)
df.rectangle([8, 8, 8 + art_w + 16, 8 + art_h + 16], fill=CREAM,
             outline=INK, width=4)
frame.paste(art, (16, 16))
frame = frame.rotate(-3, expand=True, resample=Image.BICUBIC)
art_x, art_y = 55, 810

# speed lines bag rammen
d = ImageDraw.Draw(img)
cx_a, cy_a = art_x + art_w / 2, art_y + art_h / 2
for i in range(22):
    ang = 2 * math.pi * i / 22
    r0, r1 = 230, 260 + (i % 3) * 25
    col = BRICK if i % 2 else RED
    d.line([(cx_a + r0 * math.cos(ang), cy_a + r0 * math.sin(ang)),
            (cx_a + r1 * math.cos(ang), cy_a + r1 * math.sin(ang))],
           fill=col, width=4)
img.alpha_composite(frame, (art_x, art_y))
starburst(img, (art_x + 95, art_y + 40), "TAKE YOUR SHIRT!", RED, CREAM,
          size=11, rot=-10, spikes=16)
d = ImageDraw.Draw(img)
splatter(d, art_x + art_w + 60, art_y + art_h - 20, 14, BRICK)
sparkle(d, art_x + art_w + 90, art_y - 10, 14, GOLD)

# roster-tape oven på speed lines (tapen ligger øverst i laget)
tape_strip(img, 700, ["ZETTERBURN", "ORCANE", "WRASTOR", "KRAGG", "MAYPUL",
                      "CLAIREN", "RANNO", "LOXODONT", "FLEET"],
           bg=GOLD, fg=INK, border=INK, rot=-1.4, width=W, size=22)

# --- højre kolonne: KAMPEN + SKJORTELOVEN ---
card(img, (640, 800), 545, 260)
f_ct = font(30)
f_cb = font(19)
d.text((668, 820), "KAMPEN", font=f_ct, fill=INK)
d.rectangle([670, 864, 780, 871], fill=BRICK)
format_lines = [
    "Crew battle: 2 crews à 5 spillere",
    "3 stocks pr. spiller · 8 minutter",
    "Vinderen bliver stående med sine",
    "resterende stocks — næste spiller op",
    "Live skjorte-draft inden kampstart",
    "Standard RoA2-ruleset + DSR",
]
for i, line in enumerate(format_lines):
    d.text((668, 892 + i * 28), line, font=f_cb, fill=MUTED)

card(img, (640, 1090), 545, 380)
d.text((668, 1110), "SKJORTELOVEN", font=f_ct, fill=INK)
d.rectangle([670, 1154, 830, 1161], fill=RED)
rules = [
    ("1.", "Meld én kluns til tjeneste — din"),
    ("",   "værste skjorte ryger i bunken."),
    ("2.", "Har du ikke bragt en, vidste du det"),
    ("",   "ikke, eller har du ikke lyst? En til-"),
    ("",   "fældig kluns fra bunken tildeles dig."),
    ("3.", "Skjorten bæres synligt under ALLE"),
    ("",   "dine sets. Ingen trøje over."),
    ("4.", "Kaptajnerne drafter skjorter live —"),
    ("",   "ikke spillere."),
    ("5.", "Byttehandel er forbudt. Du og"),
    ("",   "skjorten. Sammen. Til ende."),
]
ry = 1185
for num, line in rules:
    d.text((668, ry), num, font=f_cb, fill=RED)
    d.text((712, ry), line, font=f_cb, fill=MUTED)
    ry += 26

# --- venstre under billedet: ÆRE & SKAM ---
card(img, (60, 1210), 545, 260)
d.text((88, 1230), "ÆRE & SKAM", font=f_ct, fill=INK)
d.rectangle([90, 1274, 220, 1281], fill=GOLD)
prize_lines = [
    "Vindercrew: æren + førstevalg i",
    "næste skjorte-draft",
    "»Årets Kluns« — værste skjorte,",
    "publikumsafstemning på Discord",
    "Tabercrew: foto på Skamvæggen,",
    "i skjortene. For evigt.",
]
for i, line in enumerate(prize_lines):
    d.text((88, 1302 + i * 28), line, font=f_cb, fill=MUTED)

# --- bottom band ---
band_y = 1680
d = ImageDraw.Draw(img)
d.polygon([(0, band_y), (W, band_y - 24), (W, H), (0, H)], fill=CREAM)
d.line(zigzag_points(0, band_y - 14, W, band_y - 38, teeth=12, amp=8),
       fill=BRICK, width=6)
f_p = font(24)
d.text((60, band_y + 12), "DATO: TBA · AALBORG · GRATIS ENTRÉ", font=f_p, fill=INK)
f_u = font(24)
u = "FGCNORD.DK"
d.text((W - 60 - f_u.getlength(u), band_y + 12), u, font=f_u, fill=BRICK)
f_s = font(15)
credit = "Persona 5 × Rivals of Aether 2 crossover · Bootcamp 8-tema (Kibæk/Herning)"
d.text((60, band_y + 44), credit, font=f_s, fill=MUTED)

img_rgb = img.convert("RGB")
img_rgb.save("design/kluns-crews-bootcamp8.png")
img_rgb.save("design/kluns-crews-bootcamp8.pdf", "PDF", resolution=150.0)
print("wrote design/kluns-crews-bootcamp8.png + .pdf")
