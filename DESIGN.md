# Koffeinkartellet — Design system: Contraband Ledger

> Documented from the built world (impeccable new-work §7), seed `e6a196ca`. The
> app is a private coffee tasting journal drawn as a **bonded-warehouse customs
> manifest**: warm ink-black paper, aged manila, one customs-stamp ink, and
> letterpress ledger structure. State is shown by *mark type*, not by color.
> Reference build: `design/frontpage-contraband.html`.

## Palette (roles, not decoration)
Color commits at page scale — fields own whole regions; the stamp ink is the only accent.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#100d0a` | Warm ink-black — the ground of every surface |
| `--ink-2` | `#181310` | Raised panel / hover row |
| `--ink-line` | `#2b241d` | Letterpress rule, borders, dividers |
| `--manila` | `#d8c7a4` | Aged manifest paper (entry cards, stamped panels) |
| `--manila-2` | `#c8b58e` | Manila shade / gradient foot |
| `--bone` | `#efe7d6` | Primary text + display on ink |
| `--stamp` | `#e2431d` | Customs-stamp ink — THE accent (CTAs, verdict, marks) |
| `--stamp-deep` | `#b8330f` | Pressed-stamp outline (multiply blend) |
| `--amber` | `#e8a13a` | Secondary lamp (metadata highlight only) |
| `--dim` | `#8a7c67` | Mono legends / labels |
| `--dim-2` | `#6a5e4d` | Faint mono / footnotes |
| `--ok` | `#7fae6a` | BUY verdict (a state, drawn as a stamp not a fill) |

Dark-first by use scene: used on a phone in a dim kitchen after brewing and in a café; the ink ground reads in both and carries the noir. Manila is a *material panel*, never the page ground (that would be the cream default this world refuses).

## Type
Three faces, each a job. All non-default (Fraunces/DM/Space/Inter-display etc. are deliberately avoided).

- **Display — `Anton`** (condensed, monumental): headlines, scores, the split-flap. `text-transform:uppercase`, line-height .86–.92, tracking ~-0.01em. Outline variant = `-webkit-text-stroke` in manila, transparent fill.
- **Mono — `Martian Mono`** (grotesque mono): legends, manifest data, tallies, labels, CTAs. Tracking .12–.28em, uppercase. Earned here — it is measurement/data, not costume.
- **Body — `Archivo`** (mechanical grotesque): prose, entry names (800), quotes (italic 500). Measure 42–65ch.

Numerals are `font-variant-numeric: tabular-nums` everywhere they tally.

## Materials & structure
- **Ledger paper (entry card):** manila gradient + `repeating-linear-gradient` ruled lines every 33–34px, 1px inset ink border, deep neutral drop shadow, slight rotation (~.5deg).
- **Letterpress rules:** 1px `--ink-line` horizontal rules divide every section and manifest row.
- **Rubber stamp:** rotated (-9deg) outlined box, `--stamp-deep`, `mix-blend-mode:multiply`, ~.86 opacity. An immaculate branded mark system, never decoration.
- **Manifest row:** ruled grid `idx | title+desc | mono in/out | drawn mark`, hover raises to `--ink-2`.
- **Split-flap:** black board, center seam, `rotateX` flap keyframe; the verdict word carries the state color; the ONE authored motion of the page.

## Components
- **Stamp button (primary):** `--stamp` fill, white Martian Mono caps, straight clip, neutral ink elevation shadow (NO colored glow), lifts + tilts -.4deg on hover, presses on active.
- **Ghost button:** ink-line border, manila text, borders to bone on hover.
- **Tag / chip:** Martian Mono micro-caps, 1px border, no fill.
- **Score:** Anton, huge, with a small mono superscript decimal; stamp-ink for headline scores.
- **Section legend:** a ledger anchor `A/B/C/D · LABEL · count` on a hairline rule — manifest wayfinding (carries the section letter + a real count), which is why it is the world's grammar and not a banned decorative eyebrow.
- **Rater dot:** the household's per-member color as an 11px disc in the palate ledger (the one place member colors live).

## Motion
One orchestrated grammar, not scattered hovers:
- `stamp-in` — hero elements press in once on load (scale 1.14→1, slight rotate), reduced-motion disables.
- `flap` — split-flap verdict strike; pauses when off-screen; reduced-motion disables.
- Buttons: transform-only micro-interactions.

## Browser surfaces (themed, not default)
`::selection` = stamp on white; custom scrollbar in ink/ink-line; `:focus-visible` = 2px stamp outline offset 3px; tabular numerals on all data.

## Accessibility floor
Bone/manila on ink clear 4.5:1; mono legends are large + tracked (labels, not body). Verdict never relies on color alone — the *word* (BUY/MAYBE/SKIP) and the stamp mark carry it. Entrance motion gated by `prefers-reduced-motion`.

## What this world refuses
The specialty-coffee default every site (and the old page) shipped: warm cream ground, coffee-ring stains, editorial serif display, terracotta accent. Cream appears only as manila *panels*; the ground is ink.
