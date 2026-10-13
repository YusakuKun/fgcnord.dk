"""One-pager: KLUNS CREWS — Rivals of Aether 2 shirt-crew event.

A4-ish portrait (1240x1754 @150dpi). Exports PNG + 1-page PDF.
Run from repo root with fgcnord-docs venv python.
"""

import sys

sys.path.insert(0, "design")

from PIL import Image, ImageDraw

from poster_lib import (
    ARCHIVO, BRICK, BRICK_SOFT, COAL, CREAM, GEORGIA, GOLD, INK, MUTED, RED,
    font, halftone, ransom, sparkle, splatter, starburst, tape_strip, tracked,
    tracked_width, zigzag_points,
)

W, H = 1240, 1754


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


def card(img, xy, w, h, fill=CREAM):
    x, y = xy
    d = ImageDraw.Draw(img)
    d.rectangle([x + 12, y + 12, x + 12 + w, y + 12 + h], fill=INK)
    d.rectangle([x, y, x + w, y + h], fill=fill, outline=INK, width=4)


img = Image.new("RGBA", (W, H), COAL)
d = ImageDraw.Draw(img)
halftone(d, (0, 0, W, 620), "#12305C")

# --- wordmark ---
f_wm = font(30)
d.text((53, 35), "FGCNORD", font=f_wm, fill=BRICK)
d.text((48, 30), "FGCNORD", font=f_wm, fill=CREAM)

# --- red zigzag slab ---
slab = [(-80, 110), (W + 80, 40)]
slab += zigzag_points(W + 80, 545, -80, 615, teeth=14, amp=18)
slab_ink = [(x + 14, y + 14) for x, y in slab]
d.polygon(slab_ink, fill=INK)
d.polygon(slab, fill=RED)

f_eb = font(24)
eb = "FGCNORD × RIVALS OF AETHER 2 PRÆSENTERER"
tracked(d, ((W - tracked_width(eb, f_eb, 7)) / 2 - 30, 135), eb, f_eb, CREAM, tracking=7)
ransom(img, W / 2, 350, "KLUNS CREWS", scale=0.85)
starburst(img, (1155, 62), "SNART", CREAM, RED, size=24, rot=9)

# --- tape ---
d = ImageDraw.Draw(img)
tape_strip(img, 620, ["TAG EN KLUNS PÅ", "DIN SKJORTE ER DIT CREW",
                      "3 STOCKS", "CREW BATTLE"], bg=GOLD, fg=INK,
           border=INK, rot=-1.6, width=W)

# --- pitch ---
d = ImageDraw.Draw(img)
f_pitch = font(30, GEORGIA)
pitch = "Alle har en skjorte, man helst ikke vil ses død i. Nu ER den dit crew."
pw = f_pitch.getlength(pitch)
d.text(((W - pw) / 2 + 4, 738 + 4), pitch, font=f_pitch, fill=INK)
d.text(((W - pw) / 2, 738), pitch, font=f_pitch, fill=CREAM)

# --- two cards: FORMAT + PRÆMIER & SKAM ---
card(img, (60, 830), 540, 330)
card(img, (640, 830), 540, 330)
f_ct = font(34)
f_cb = font(23)
d.text((90, 855), "FORMAT", font=f_ct, fill=INK)
d.rectangle([92, 905, 220, 913], fill=BRICK)
format_lines = [
    "Crew battle: 2 crews à 5 spillere",
    "3 stocks pr. spiller · 8 minutter",
    "Vinderen bliver stående med sine",
    "resterende stocks — næste spiller op",
    "Standard RoA2-ruleset + DSR",
    "Crews draftes UD FRA SKJORTEN",
]
for i, line in enumerate(format_lines):
    d.text((90, 935 + i * 36), line, font=f_cb, fill=MUTED)

d.text((670, 855), "PRÆMIER & SKAM", font=f_ct, fill=INK)
d.rectangle([672, 905, 800, 913], fill=GOLD)
prize_lines = [
    "Vindercrew: æren + førstevalg i",
    "næste skjorte-draft",
    "»Årets Kluns« — værste skjorte,",
    "publikumsafstemning på Discord",
    "Tabercrew: foto på Skamvæggen,",
    "i skjortene. For evigt.",
]
for i, line in enumerate(prize_lines):
    d.text((670, 935 + i * 36), line, font=f_cb, fill=MUTED)

tee(d, 615, 1145, 72, GOLD)
tee(d, 1160, 1145, 72, BRICK_SOFT)

# --- SKJORTELOVEN (full-width ink panel) ---
panel_y = 1200
zz_top = zigzag_points(0, panel_y, W, panel_y - 30, teeth=12, amp=12)
d.polygon(zz_top + [(W, H), (0, H)], fill=INK)
f_lt = font(40)
d.text((90, panel_y + 55), "SKJORTELOVEN", font=f_lt, fill=CREAM)
d.rectangle([92, panel_y + 115, 320, panel_y + 124], fill=RED)
f_lb = font(26)
rules = [
    "Bring én skjorte, du helst ikke vil ses i — den ryger i bunken.",
    "Ved start trækker alle en tilfældig skjorte. Bunken bestemmer.",
    "Skjorten bæres synligt under ALLE dine sets. Ingen trøje over.",
    "Dit crew afgøres af skjorten — farve, vibe eller blinde kaptajns-draft.",
    "Byttehandel er forbudt. Du og skjorten. Sammen. Til ende.",
]
for i, rule in enumerate(rules):
    d.text((90, panel_y + 160 + i * 52), f"{i + 1}.", font=f_lb, fill=GOLD)
    d.text((150, panel_y + 160 + i * 52), rule, font=f_lb, fill=CREAM)

# --- bottom band: praktisk ---
band_y = 1685
d.polygon([(0, band_y), (W, band_y - 24), (W, H), (0, H)], fill=CREAM)
d.line(zigzag_points(0, band_y - 14, W, band_y - 38, teeth=12, amp=8),
       fill=BRICK, width=6)
f_p = font(24)
d.text((60, band_y + 18), "DATO: TBA · AALBORG · GRATIS ENTRÉ", font=f_p, fill=INK)
f_u = font(24)
u = "FGCNORD.DK"
d.text((W - 60 - f_u.getlength(u), band_y + 18), u, font=f_u, fill=BRICK)

sparkle(d, 60, 700, 12, GOLD)
splatter(d, 1180, 700, 12, RED)

img_rgb = img.convert("RGB")
img_rgb.save("design/kluns-crews.png")
img_rgb.save("design/kluns-crews.pdf", "PDF", resolution=150.0)
print("wrote design/kluns-crews.png + design/kluns-crews.pdf")
