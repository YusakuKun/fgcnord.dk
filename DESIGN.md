# FGCNORD Design Philosophy — "Poster Brutalism"

Version 1.0 · applies to fgcnord.dk, Discord embeds, and stream graphics.

## One-liner

A Nordic fighting-game poster wall: bold type, hard shadows, ink borders —
with a *restrained* layer of Persona 4/5 graphic energy on top. The site
should feel like a tournament flyer stapled to a telephone pole, not a
corporate SaaS page and not a Persona fan site.

## Prime directive

**Readability is the floor. Flavour is the ceiling. Build to both.**

- Never compromise legibility for style: body text stays Inter on calm
  surfaces, contrast stays WCAG AA, line length stays sane, and no rotated
  or slanted element ever carries paragraph text.
- But *given* full readability, push flavour as hard as functionality allows:
  if a headline, badge, section edge or hover state can carry more attitude
  at zero readability cost, it should.
- Flavour lives in the *frame* (headlines, badges, edges, shadows, stickers),
  never in the *content* (body copy, forms, tables, brackets).

## What we keep (the Nordic base)

The existing identity stays untouched. It is already 70% of the look:

- **Coal** `#0A1E3C` — page background, the Nordic night
- **Ink** `#0B1526` — borders, text on light surfaces
- **Cream** `#F4F8FB` — paper surfaces, text on dark
- **Brick** `#00AEEF` — the signature Nordic signal blue
- Hard offset shadows (`shadow-poster`), 3px ink borders, halftone dots,
  Archivo Black display type, Bricolage Grotesque headings, Inter body

## What we add (the Persona layer — sparingly)

Two new accent colors, each with a *job*, never decorative noise:

| Color | Hex | Job |
|---|---|---|
| **Signal red** (P5) | `#E60012` | Live/urgent only: live indicators, "NYT" badges, breaking announcements, the primary CTA on a page |
| **Amber gold** (P4) | `#FFB300` | Achievement only: rank badges, winner states, top-8 highlights |

Rules that keep it tasteful:

1. **Red means "act or watch now".** If everything is red, nothing is. Max one
   red element per viewport.
2. **Gold means "someone won this".** Ranks, champions, records. Never buttons.
3. **Diagonal cuts live at section boundaries only** — a slanted edge where a
   dark section meets a light one (clip-path, ~2–3° slope). Never inside cards.
4. **Rotation budget:** resting elements rotate at most 1.5°. Badges and
   stickers may go to −6°. If a page looks like it slid off a table, we
   overdid it.
5. **Starburst/sticker badges** ("NYT!", "LIVE", "TOP 8") are the only elements
   allowed to break grid alignment — they overlap card corners like a sticker
   on a flyer.
6. **Halftone dots on dark sections only**, as today.

## Motifs cheat-sheet

- `card-poster` — bordered card + hard shadow (existing, unchanged)
- Section slash — `clip-path: polygon(...)` slanted section edges (new utility)
- Sticker badge — rotated pill with poster shadow, overlapping a corner (new)
- Marquee ticker — exists; reserve for announcements/live strips
- Hover behavior — cards lift (`-translate-y-1`), may add ≤1° tilt (new, subtle)

## Accessibility & motion (non-negotiable)

- Contrast ratios stay WCAG AA — accents sit on ink or cream, never on each other.
- `prefers-reduced-motion` kills all rotation/tilt/marquee (already global).
- Focus rings stay brick-blue and visible everywhere.

## Discord, same language

- Embed accent colors reuse the palette: brick for general, red for live/urgent,
  gold for results, per-category colors for docs announcements (as built).
- Role colors map to palette: admins brick, gold for reigning top-8 rank roles.
- Channel/category names may use the sticker energy in *text only*
  (caps, dividers) — no emoji walls.

## The test

Before shipping any new visual element, ask: *"Would this look right stapled
to a telephone pole outside the venue?"* If yes, ship it. If it looks like a
Persona HUD screenshot, dial it back.

## Posters & print graphics

This language is *approved and preferred* for poster designs — event posters,
top-8 graphics, social announcements. `design/preview-v2.png` is the
reference comp and `design/make_preview.py` is the starting point for
generating print/social assets (swap in Pillow drawing for the real thing,
keep: stacked hard-shadow headlines, starburst stickers, slash edges,
halftone on dark, rationed red/gold). When in doubt for a poster, push
flavour harder than the website does — a poster has one job and no body copy.

## Persona 5 — the actual rules (from Atlus' official P5 style guide)

Source: Atlus' internal P5 style guide (publicly mirrored at
segaretro.org/images/d/d0/Persona5_StyleGuide.pdf; local copy at
`design/p5-styleguide.pdf`, gitignored — not ours to redistribute).
These are their rules, translated to our palette:

**Typography — "ransom note" (their #1 technique):**
- Set headlines as if letters were cut & pasted from a newspaper
- Mix serif + sans-serif fonts *within the same word*
- Add an angle to each letter individually (±3–8°)
- Box each letter individually; invert one or two letters per word
  (dark box/light letter on light box/dark letter)
- One letter per word may take the accent color (red)
- Outline the whole word if it needs separation from the background
- Skew whole words / add perspective sometimes
- Sans-serif stays for larger bodies of text — the ransom note is for
  headlines and short callouts only

**Art & shapes:**
- Zigzags or rips at edges — zigzags preferred over straight cuts
- Splatters and 4-point stars "as necessary" (i.e. sparingly, with intent)
- Big flat color fields are allowed — a whole red panel is on-brand
- Elements overlap and break each other's frames; nothing floats politely

**Translation to FGCNORD:** our coal/cream/brick base stays, but posters may
use full red fields and ransom-note headlines — the website keeps the
restrained version above.
