"""One-pager: KLUNS CREWS — BOOTCAMP 8 edition.

Tema lånt med kærlighed fra Bootcamp 8 (Kibæk/Herning): træningslejr-
parodien. Uniformsreglement, drill-tone, oliven-slab, sergent-chevrons.
Skjorten ER din uniform.

A4-ish portrait (1240x1754 @150dpi). Exports PNG + 1-page PDF.
Run from repo root with fgcnord-docs venv python.
"""

import sys

sys.path.insert(0, "design")

from PIL import Image, ImageDraw

from poster_lib import (
    BRICK, BRICK_SOFT, COAL, CREAM, GEORGIA, GOLD, INK, MUTED, RED,
    font, halftone, ransom, sparkle, splatter, starburst, tape_strip, tracked,
    tracked_width, zigzag_points,
)

W, H = 1240, 1754
OLIVE = "#51512A"  # bootcamp/camo-nod (matcher site-tokenet)


def tee(draw, cx, cy, s, fill, pattern=BRICK):
    """Ugly t-shirt silhouette with a zigzag chest pattern."""
    pts = [(-0.28, -0.45), (0.28, -0.45), (0.55, -0.25), (0.85, 0.05),
           (0.6, 0.3), (0.42, 0.18), (0.42, 0.7), (-0.42, 0.7),
           (-0.42, 0.18), (-0.6, 0.3), (-0.85, 0.05), (-0.55, -0.25)]
    poly = [(cx + px * s, cy + py * s) for px, py in pts]
    draw.polygon(poly, fill=fill, outline=INK, width=3)
    zz = zigzag_points(cx - 0.42 * s, cy + 0.1 * s, cx + 0.42 * s, cy + 0.1 * s,
                       teeth=4, amp=0.07 * s)
    draw.line(zz, fill=pattern, width=max(2, int(0.05 * s)))


def chevrons(draw, cx, cy, s, color, n=3):
    """Sergent-striber: n V-chevrons under hinanden."""
    w = max(3, int(s * 0.2))
    for i in range(n):
        y = cy + i * (s * 0.55)
        draw.line([(cx - s, y), (cx, y + s * 0.55), (cx + s, y)],
                  fill=color, width=w)


def card(img, xy, w, h, fill=CREAM):
    x, y = xy
    d = ImageDraw.Draw(img)
    d.rectangle([x + 12, y + 12, x + 12 + w, y + 12 + h], fill=INK)
    d.rectangle([x, y, x + w, y + h], fill=fill, outline=INK, width=4)


img = Image.new("RGBA", (W, H), COAL)
d = ImageDraw.Draw(img)
halftone(d, (0, 0, W, 640), "#12305C")

# --- wordmark ---
f_wm = font(30)
d.text((53, 35), "FGCNORD", font=f_wm, fill=BRICK)
d.text((48, 30), "FGCNORD", font=f_wm, fill=CREAM)

# --- OLIVE zigzag slab (camo/bootcamp-nod) ---
slab = [(-80, 105), (W + 80, 35)]
slab += zigzag_points(W + 80, 600, -80, 660, teeth=14, amp=18)
slab_ink = [(x + 14, y + 14) for x, y in slab]
d.polygon(slab_ink, fill=INK)
d.polygon(slab, fill=OLIVE)

f_eb = font(22)
eb = "FGCNORD PRÆSENTERER · UNIFORM PÅKRÆVET"
tracked(d, ((W - tracked_width(eb, f_eb, 7)) / 2 - 30, 125), eb, f_eb, CREAM, tracking=7)
ransom(img, W / 2, 330, "KLUNS CREWS", scale=0.85)

# stencil-strip: BOOTCAMP 8 EDITION
f_st = font(30)
st = "BOOTCAMP 8 EDITION"
st_w = tracked_width(st, f_st, 10)
bx = (W - st_w) / 2 - 40
d.rectangle([bx + 8, 505 + 8, bx + st_w + 80 + 8, 505 + 56 + 8], fill=INK)
d.rectangle([bx, 505, bx + st_w + 80, 505 + 56], fill=INK, outline=GOLD, width=3)
tracked(d, (bx + 40, 517), st, f_st, GOLD, tracking=10)

starburst(img, (1155, 62), "REKRUT!", CREAM, RED, size=22, rot=9)

# --- tape ---
d = ImageDraw.Draw(img)
tape_strip(img, 660, ["UNIFORM PÅKRÆVET", "CREW BATTLE", "3 STOCKS",
                      "LIVE UNIFORMSDRAFT", "KIBÆK-STEMNING"],
           bg=GOLD, fg=INK, border=INK, rot=-1.6, width=W)

# --- pitch + chevrons ---
d = ImageDraw.Draw(img)
f_pitch = font(28, GEORGIA)
pitch = "Alle har en skjorte, man helst ikke vil ses død i. Her ER den din uniform."
pw = f_pitch.getlength(pitch)
d.text(((W - pw) / 2 + 3, 768 + 3), pitch, font=f_pitch, fill=INK)
d.text(((W - pw) / 2, 768), pitch, font=f_pitch, fill=CREAM)
chevrons(d, 90, 800, 26, GOLD)
chevrons(d, W - 90, 800, 26, GOLD)

# --- two cards: ØVELSEN + ÆRE & SKAM ---
card(img, (60, 870), 540, 290)
card(img, (640, 870), 540, 290)
f_ct = font(32)
f_cb = font(21)
d.text((90, 892), "ØVELSEN", font=f_ct, fill=INK)
d.rectangle([92, 938, 212, 946], fill=BRICK)
format_lines = [
    "Crew battle: 2 crews à 5 spillere",
    "3 stocks pr. spiller · 8 minutter",
    "Vinderen bliver stående med sine",
    "resterende stocks — næste op",
    "Live uniformsdraft inden kampstart",
    "Standard RoA2-ruleset + DSR",
]
for i, line in enumerate(format_lines):
    d.text((90, 965 + i * 32), line, font=f_cb, fill=MUTED)

d.text((670, 892), "ÆRE & SKAM", font=f_ct, fill=INK)
d.rectangle([672, 938, 800, 946], fill=GOLD)
prize_lines = [
    "Vindercrew: æresmærket + første-",
    "valg i næste uniformsdraft",
    "»Årets Kluns« — værste uniform,",
    "publikumsafstemning på Discord",
    "Tabercrew: foto på Skamvæggen,",
    "i uniformen. For evigt.",
]
for i, line in enumerate(prize_lines):
    d.text((670, 965 + i * 32), line, font=f_cb, fill=MUTED)

tee(d, 615, 1170, 68, GOLD)
tee(d, 1160, 1170, 68, BRICK_SOFT)

# --- UNIFORMSREGLEMENTET (full-width ink panel) ---
panel_y = 1250
zz_top = zigzag_points(0, panel_y, W, panel_y - 26, teeth=12, amp=11)
d.polygon(zz_top + [(W, H), (0, H)], fill=INK)
f_lt = font(36)
d.text((90, panel_y + 42), "UNIFORMSREGLEMENTET", font=f_lt, fill=CREAM)
d.rectangle([92, panel_y + 98, 350, panel_y + 106], fill=RED)
f_lb = font(23)
rules = [
    ("1.", "Meld én kluns til tjeneste — din værste skjorte ryger i bunken."),
    ("2.", "Har du ikke bragt en, vidste du det ikke, eller har du ikke lyst?"),
    ("",   "Rekrutten får en tilfældig kluns udstedt fra bunken."),
    ("3.", "Uniformen bæres synligt under ALLE kampe. Ingen trøje over."),
    ("4.", "Kaptajnerne drafter uniformer live — ikke spillere."),
    ("5.", "Byttehandel er desertion. Du og uniformen. Sammen. Til ende."),
]
ry = panel_y + 135
for num, rule in rules:
    d.text((90, ry), num, font=f_lb, fill=GOLD)
    d.text((150, ry), rule, font=f_lb, fill=CREAM)
    ry += 46

# --- bottom band ---
band_y = 1680
d = ImageDraw.Draw(img)
d.polygon([(0, band_y), (W, band_y - 24), (W, H), (0, H)], fill=CREAM)
d.line(zigzag_points(0, band_y - 14, W, band_y - 38, teeth=12, amp=8),
       fill=BRICK, width=6)
f_p = font(24)
d.text((60, band_y + 14), "DATO: TBA · AALBORG · GRATIS ENTRÉ", font=f_p, fill=INK)
f_u = font(24)
u = "FGCNORD.DK"
d.text((W - 60 - f_u.getlength(u), band_y + 14), u, font=f_u, fill=BRICK)
f_s = font(15)
credit = "Tema lånt med kærlighed fra Bootcamp 8 · Kibæk/Herning"
d.text((60, band_y + 46), credit, font=f_s, fill=MUTED)

sparkle(d, 60, 730, 12, GOLD)

img_rgb = img.convert("RGB")
img_rgb.save("design/kluns-crews-bootcamp8.png")
img_rgb.save("design/kluns-crews-bootcamp8.pdf", "PDF", resolution=150.0)
print("wrote design/kluns-crews-bootcamp8.png + .pdf")
