"""Poster: BJERGTOP 3 — v3, full Persona 5 flavor per Atlus' style guide.

Rules applied from design/p5-styleguide.pdf:
- ransom-note headline: boxed letters, mixed fonts, per-letter angles,
  mixed case, 1-2 inverted letters, one red letter
- zigzags preferred over straight cuts; splatters and stars with intent
- big flat red field is on-brand
- body info stays clean sans (readability is the floor)

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
ARCHIVO = "design/ArchivoBlack.ttf"
GEORGIA = "C:/Windows/Fonts/georgiab.ttf"
IMPACT = "C:/Windows/Fonts/impact.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def halftone(draw, box, color, step=24, r=2):
    x0, y0, x1, y1 = box
    for y in range(y0, y1, step):
        for x in range(x0 + (step // 2 if (y // step) % 2 else 0), x1, step):
            draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def sparkle(draw, cx, cy, size, color):
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
    f = font(ARCHIVO, size)
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


def ransom(base, cx, cy, text):
    """Ransom-note headline: boxed letters, mixed fonts, angles, inversions.

    Per the Atlus style guide: mix serif+sans, angle each letter, box each
    letter, invert one or two, one accent letter, mix case.
    """
    fonts = [ARCHIVO, GEORGIA, IMPACT]
    sizes = [118, 112, 128]  # Impact runs condensed, bump it
    rotations = [-7, 5, -4, 8, -6, 4, -8, 6]
    jitters = [0, -16, 10, -8, 14, -12, 8, -2]
    invert = {2}        # ink box / cream letter
    accent = {5}        # red box / cream letter
    lower = {6}         # mixed case

    layers = []
    total_w = 0
    for i, ch in enumerate(text):
        ch = ch.lower() if i in lower else ch
        f = font(fonts[i % 3], sizes[i % 3])
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
        layers.append((layer, jitters[i % len(jitters)]))
        total_w += bw - 6  # slight overlap = collaged
    x = cx - total_w / 2
    for layer, jy in layers:
        base.alpha_composite(layer, (int(x), int(cy + jy - layer.height / 2)))
        x += layer.width - 26  # overlap including rotation growth


# ================= base =================
img = Image.new("RGBA", (W, H), COAL)
d = ImageDraw.Draw(img)
halftone(d, (0, 0, W, 760), "#12305C")

# --- wordmark top-left ---
f_wm = font(ARCHIVO, 34)
d.text((63, 43), "FGCNORD", font=f_wm, fill=BRICK)
d.text((58, 38), "FGCNORD", font=f_wm, fill=CREAM)

# --- big flat RED slab with zigzag bottom edge (ink drop behind) ---
slab_top_l, slab_top_r = 130, 40
slab_bot_l, slab_bot_r = 590, 500
for ox, oy, col in ((14, 14, INK), (0, 0, RED)):
    pts = [(-80 + ox, slab_top_l + oy), (W + 80 + ox, slab_top_r + oy)]
    pts += zigzag_points(W + 80 + ox, slab_bot_r + oy, -80 + ox, slab_bot_l + oy,
                         teeth=14, amp=20)
    d.polygon(pts, fill=col)

# eyebrow on the slab
f_eb = font(ARCHIVO, 24)
eb = "FGCNORD PRÆSENTERER ET TOPPMØDE"
eb_w = tracked_width(eb, f_eb, 8)
tracked(d, ((W - eb_w) / 2 - 40, 150), eb, f_eb, CREAM, tracking=8)

# --- ransom-note headline ---
ransom(img, W / 2 - 45, 370, "BJERGTOP")

# splatters flanking the headline
d = ImageDraw.Draw(img)
splatter(d, 92, 300, 16, CREAM)
splatter(d, 990, 470, 13, INK)
sparkle(d, 130, 520, 14, CREAM)
sparkle(d, 950, 250, 12, GOLD)

# --- starburst: cream face + red text (red-on-red is banned by the guide) ---
starburst(img, (990, 82), "SNART", CREAM, RED, size=26, rot=9)

# --- speed lines behind the giant 3 ---
d = ImageDraw.Draw(img)
cx3, cy3 = W / 2 - 20, 700
for i in range(28):
    ang = 2 * math.pi * i / 28
    r0, r1 = 150, 300 + (i % 3) * 40
    col = BRICK if i % 2 else CREAM
    d.line([(cx3 + r0 * math.cos(ang), cy3 + r0 * math.sin(ang)),
            (cx3 + r1 * math.cos(ang), cy3 + r1 * math.sin(ang))],
           fill=col, width=4)

# --- giant gold edition numeral ---
f_n = font(ARCHIVO, 300)
num = Image.new("RGBA", (400, 420), (0, 0, 0, 0))
dn = ImageDraw.Draw(num)
for dx, dy, col in ((18, 18, INK), (9, 9, BRICK)):
    dn.text((40 + dx, 20 + dy), "3", font=f_n, fill=col)
dn.text((40, 20), "3", font=f_n, fill=GOLD)
num = num.rotate(-5, expand=True, resample=Image.BICUBIC)
img.alpha_composite(num, (int(cx3 - num.width / 2), 560))

# --- mountain ranges ---
d = ImageDraw.Draw(img)
back_peaks = [(0, 1010), (140, 830), (290, 980), (430, 800), (600, 960),
              (760, 810), (920, 975), (1080, 850), (1080, 1200), (0, 1200)]
d.polygon(back_peaks, fill="#0E2A52")
front_peaks = [(0, 1120), (180, 920), (330, 1060), (510, 880), (700, 1050),
               (880, 910), (1080, 1040), (1080, 1220), (0, 1220)]
d.polygon(front_peaks, fill=INK)
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
f_t = font(ARCHIVO, 24)
ticker = " 16 SPILLERE /// INVITATIONAL /// 4 PLADSER PÅ FOLKEAFSTEMNING /// MELEE /// ULTIMATE /// ROA2 /// MK WII ///"
x = 0
while x < W + 120:
    dt.text((x, 19), ticker, font=f_t, fill=CREAM)
    x += int(f_t.getlength(ticker)) + 4
tape = tape.rotate(-3, expand=True, resample=Image.BICUBIC)
img.alpha_composite(tape, (-60, 940))

# --- cream bottom band with ZIGZAG edge (guide: zigzags preferred) ---
d = ImageDraw.Draw(img)
zz = zigzag_points(0, 1112, W, 1058, teeth=12, amp=13)
d.polygon(zz + [(W, H), (0, H)], fill=CREAM)
zz2 = zigzag_points(0, 1090, W, 1036, teeth=12, amp=13)
d.line(zz2, fill=BRICK, width=7, joint="curve")

d.text((70, 1180), "DATO: TBA", font=font(ARCHIVO, 52), fill=INK)
d.text((70, 1258), "INVITATIONAL · AALBORG · LOKALE ANNONCERES",
       font=font(ARCHIVO, 24), fill=MUTED)
f_url = font(ARCHIVO, 28)
u = "FGCNORD.DK"
d.text((W - 70 - f_url.getlength(u), 1288), u, font=f_url, fill=BRICK)
halftone(d, (0, 1300, W, H), "#DCE5EF", step=28, r=2)

img.convert("RGB").save("design/poster-bjergtop-3-v3.png")
print("wrote design/poster-bjergtop-3-v3.png")
