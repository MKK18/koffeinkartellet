---
name: Koffeinkartellet
description: A private crew's cupping table, where coffees sit on a timeline and every score is pencilled by hand.
colors:
  table: "#1f4a63"
  table-deep: "#183c51"
  table-hi: "#2a5c79"
  on-table: "#ffffff"
  on-table-soft: "#c3d7e3"
  sheet: "#fbfbf9"
  card: "#ffffff"
  tint: "#eef4f8"
  ink: "#1d2125"
  ink-2: "#4a5259"
  ink-3: "#646c73"
  rule: "#d3dfe6"
  rule-2: "#e6eef2"
  form-blue: "#8fb3c9"
  pencil: "#383d42"
  red-pencil: "#c8372d"
  red-pencil-deep: "#a92a21"
  verdict-buy: "#23663f"
  verdict-buy-tint: "#e6f2ea"
  verdict-maybe: "#8a5a00"
  verdict-skip: "#4a5259"
  slip: "#fff3d1"
  slip-line: "#e2b54d"
  slip-ink: "#5a4300"
  selection: "#cfe2ee"
  toast-action: "#9fd0ec"
  ink-pressed: "#000000"
  crew-green: "#2e6b52"
  crew-blue: "#3f5fc4"
  crew-plum: "#8a3f80"
  crew-rust: "#a24a14"
  crew-teal: "#1f6f7a"
  crew-olive: "#6b5a12"
  bowl-default: "#7a4c28"
  bowl-default-deep: "#4a2a14"
  crema: "#efcfa2"
  crema-pale: "#f4dcb8"
  bowl-light: "#a9784a"
  bowl-light-deep: "#7d4e29"
  bowl-light-medium: "#93633a"
  bowl-light-medium-deep: "#683f20"
  bowl-medium: "#7a4c28"
  bowl-medium-deep: "#4f2d15"
  bowl-medium-dark: "#5a3519"
  bowl-medium-dark-deep: "#36200e"
  bowl-dark: "#3a2312"
  bowl-dark-deep: "#1e1209"
  bowl-unknown: "#86593a"
  bowl-unknown-deep: "#573519"
typography:
  display:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(36px, 7vw, 60px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  lede-large:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.5
  lede:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  entry-large:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  entry:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  body-small:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  small:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
  caption:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.3
  verdict:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "44px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  pencil-score:
    fontFamily: "Kalam, Segoe Print, Bradley Hand, cursive"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 0.9
  pencil-score-input:
    fontFamily: "Kalam, Segoe Print, Bradley Hand, cursive"
    fontSize: "56px"
    fontWeight: 400
    lineHeight: 0.85
  pencil-quote:
    fontFamily: "Kalam, Segoe Print, Bradley Hand, cursive"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  hairline: "2px"
  bar: "3px"
  focus: "4px"
  small: "6px"
  option: "7px"
  skeleton: "8px"
  segment: "9px"
  control: "10px"
  card: "12px"
  sheet: "14px"
  overlay: "16px"
  chip: "18px"
  icon: "20px"
  pill: "22px"
  round: "50%"
spacing:
  gutter: "16px"
  gutter-wide: "28px"
  row: "12px"
  field: "16px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.table}"
    textColor: "{colors.on-table}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "46px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.table-deep}"
  button-scan:
    backgroundColor: "{colors.red-pencil}"
    textColor: "{colors.on-table}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "46px"
  button-scan-hover:
    backgroundColor: "{colors.red-pencil-deep}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-table}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "46px"
  button-line:
    backgroundColor: "{colors.card}"
    textColor: "{colors.table}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "46px"
  button-line-on:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.table}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "40px"
  button-quiet-hover:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink}"
  tab-scan:
    backgroundColor: "{colors.red-pencil}"
    textColor: "{colors.on-table}"
    rounded: "{rounded.round}"
    size: "68px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.chip}"
    padding: "0 14px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.table}"
    textColor: "{colors.on-table}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 14px"
    height: "48px"
  score-sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  tally-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  slip:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.slip-ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  confirm-note:
    backgroundColor: "{colors.verdict-buy-tint}"
    textColor: "{colors.verdict-buy}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-table}"
    rounded: "{rounded.card}"
    padding: "12px 14px 12px 18px"
  tag:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink-2}"
    rounded: "14px"
    padding: "4px 11px"
---

# Design System: Koffeinkartellet

## Overview

**Creative North Star: "The Cupping Table"**

The crew sits at a cupping table. The shell is the table itself, a deep form blue that owns the top of every screen and the whole sign-in and landing ground. Content never sits directly on the table: it lies on white score sheets with rounded top corners, ruled in pale form blue the way a printed cupping form is. Labels are printed in one plain sans, in sentence case, with no tracked mono or uppercase captions. Scores and the short quotes beside them are written in a graphite pencil hand. That split between printed form and handwritten mark is the core of the system.

Coffees are drawn as cupping bowls seen from above, a white rim around coffee tinted by roast, or the bag photo when one exists. The home screen is a timeline of ratings rather than a list of cards: week and month headings ruled across the sheet, a centre spine for a crew of two (my lane left, theirs right, the bowl on the spine) or a left spine for one or three or more. One red pencil makes marks of attention: an open, overshooting ring around the crew's top cup, an underlined "split" where members disagree by 1.5 points or more, a ring drawn around the scan verdict, and the Scan action itself.

The app runs in Operate mode: dense, calm, built for checking a score in a café or after brewing at home. The landing page is a quiet Persuade front door in the same world: the same blue table, a live-looking score sheet laid slightly askew on top of a second sheet, and one plain call to action. Motion is small and physical: sheets slide up, a saved score is pencilled in from left to right, the red ring draws itself.

**Key Characteristics:**
- Form-blue table for the shell; white score sheets for all content.
- One printed sans (Public Sans) for every label and sentence, in sentence case.
- A graphite pencil hand (Kalam) only for scores and short timeline quotes.
- One red pencil, reserved for marks of attention and the Scan action.
- Roast-tinted cupping bowls as each coffee's mark.
- Member colours forced to ink-safe contrast on paper.
- Errors are an amber slip, never red.

## Colors

A cool, papery palette: one blue for the table, near-white sheets ruled in pale form blue, graphite for marks, and a single red pencil.

### Primary
- **Form Blue Table** (`table`): the ground of the shell header, desktop rail, sign-in, 404 and landing. Also the primary button, selected chip, link colour, the active tab, week headings on the timeline and small section headings. `table-deep` is its hover/pressed state; `table-hi` is the focus ring, the input focus border, and the rail hover.
- **Red Pencil** (`red-pencil`): the top-cup ring, the "split" mark, the verdict ring, and the Scan action (the round centre tab, the desktop rail Scan button, and every "Scan a bag" / "Take a photo" camera button). `red-pencil-deep` is its hover.

### Secondary
- **Graphite Pencil** (`pencil`): every pencilled score numeral, the score slider's thumb ring, the tick on the 6–10 scale, and short timeline quotes.
- **Verdict Inks**: Buy it (`verdict-buy`, deep green), Maybe (`verdict-maybe`, dark ochre), Skip it (`verdict-skip`, graphite, set with a strikethrough). Buy green also marks crew agreement and match ticks on the verdict; ochre marks the mismatch alert. `verdict-buy-tint` is the pale green ground of the one confirmation note ("filled in from photo/link") in the coffee form, with buy-green text.

### Neutral
- **Score Sheet** (`sheet`): the content surface under the header, overlays and bottom sheets, the auth card, the landing's sample sheet.
- **Card White** (`card`): raised paper on the sheet: tally cards, tasting columns, inputs, chips, the tab bar, the install banner, bowl rims.
- **Pale Tint** (`tint`): row hover, quiet-button hover, tag fills, the segmented control's track, tasting-column headers, the "Want to try" on-state, and (with `rule-2` as its inner stop) the empty bowl.
- **Ink** (`ink`, `ink-2`, `ink-3`): primary text; secondary text and metadata; tertiary hints, placeholders and inactive tabs. `ink-3` still clears 4.5:1 on the sheet.
- **Rules** (`rule`, `rule-2`, `form-blue`): `rule` for control borders and spines; `rule-2` for hairlines between rows; `form-blue` for the printed form lines (week headings, section heads, score scales, the lane header's bottom rule, dashed drop zone).
- **On-table text** (`on-table`, `on-table-soft`): white headlines and the paler blue-white sub-line on the table.
- **Slip** (`slip`, `slip-line`, `slip-ink`): the amber error slip and nothing else.

### Member colours
Each member has a colour, used for the avatar disc, the per-member score bar on the timeline, the legend dot and the palate scale dot. A member's chosen colour passes through `inkSafe()` (src/marks.js), which darkens it step by step until it reaches 4.6:1 against white. Members without a colour get a stable pick from the crew palette (`crew-green`, `crew-blue`, `crew-plum`, `crew-rust`, `crew-teal`, `crew-olive`); new sign-ups default to `crew-green`.

### Bowl tints by roast
Bowls carry a two-stop coffee tint keyed to roast level, from `bowl-light` through `bowl-dark`, each with a `-deep` centre, plus `bowl-unknown` when no roast is set (src/marks.js, BOWLS). The CSS fallback when no tint is passed is `bowl-default`/`bowl-default-deep`. The rim is mixed toward `crema` and `crema-pale`. These colours are only ever used inside a bowl.

### Utility
- **Selection** (`selection`): text selection highlight on the sheet.
- **Ink pressed** (`ink-pressed`): hover on the ink button.

### Not UI colour
src/lib.js `FLAVOR_CATEGORIES` still carries eight per-category hex values. They are legacy data the interface no longer renders (the flavour picker is words only), so they are not part of this palette, and `impeccable detect` will keep listing them as advisories until the data is cleaned.

### Named Rules
**The One Red Pencil Rule.** Red marks attention: the top cup, a split, the verdict, and Scan. Nothing else is red. If a screen has two red things that aren't one of those four, one of them is wrong.

**The Amber Slip Rule.** Errors are an amber slip with an alert icon and dark ochre text, never red. Red already means "look at this coffee", and an error must not borrow that.

**The Ink-Safe Member Rule.** No member colour reaches the paper without passing `inkSafe()`. A member colour that fails 4.6:1 on white is darkened, never used as-is.

## Typography

**Body Font:** Public Sans (variable 100–900, self-hosted, with system-ui fallback)
**Pencil Font:** Kalam 400 only (self-hosted, with Segoe Print and Bradley Hand fallbacks)
**Data Font:** the system monospace stack (ui-monospace, SFMono-Regular, Menlo), for invite codes only

**Character:** A plain, governmental print sans for everything the form says, against a loose graphite hand for everything a person wrote. Numerals are tabular in print; the hand keeps its natural figures.

### Hierarchy
- **Display** (800, clamp 36–60px, 1.02, -0.03em): the landing headline only, capped at 14ch.
- **Headline** (800, 34px, 1.05, -0.02em): the screen title on the table ("The table"). Auth card titles use 28px at the same weight.
- **Title** (800, 20px, 1.2): overlay and bottom-sheet titles, empty-state titles.
- **Lede** (400, 18–19px, 1.5): the Palate lede (18px) and the landing lede (19px), capped at 40ch.
- **Entry** (800, 16px, 1.2): coffee names on the timeline, member names in lane headers. **Entry large** (17px) for coffee names in the list, the roaster line on a coffee page, section heads and the rail wordmark.
- **Body** (400, 16px, 1.5): sentences and inputs. Long prose caps at 60–65ch.
- **Body small** (15px, 1.45): the workhorse secondary size: buttons, hints, meta lines, list sub-lines, tasting notes in print, slips, toasts, popup options.
- **Label** (600, 14px): field labels, chips, tags, week headings (800 in `table` blue), metadata.
- **Small** (700, 13px): per-member score captions, fact labels, "×2" counts, dates under scores.
- **Caption** (600, 12px): tab bar labels and the tiniest meta (score captions in verdict reasons).
- **Data** (system mono 700, 15px, form blue): invite codes, because a code is data to be read character by character. Nowhere else.
- **Verdict** (900, 44px, 1, -0.025em): the scan verdict word, in its verdict colour.
- **Pencil score** (Kalam 400, 20–34px in lists and timeline, 56px in the score input, 64px max): every score numeral, always to one decimal.
- **Pencil quote** (Kalam 400, 16px, 1.2; 15px under 400px): the short quote beside a score on the timeline, truncated.

### Named Rules
**The Pencil Is For Marks Rule.** Kalam writes scores and the short timeline quotes, plus the red "split" mark. Full tasting notes, labels, buttons, headings and numbers that aren't scores stay in Public Sans. If a paragraph is in the hand, it should be in print.

**The Printed Label Rule.** Every label is sentence case Public Sans. No uppercase captions, no letter-spaced small caps, and no monospace except the data face on invite codes.

## Layout

Mobile first, single column. The shell is a blue header (wordmark and stacked crew avatars on one line, then the screen title and a one-line sub) followed by a white sheet with 14px top corners that fills the rest of the screen and scrolls under a fixed white tab bar. Content is capped at 760px on phones and tablets; side gutter is 16px throughout.

The tab bar holds Table, Coffees, Scan, Palate, You. Scan is a 68px red disc raised 26px above the bar, ringed in white. At 960px and up the tab bar disappears: a 240px rail sits on the table at the left (wordmark, nav buttons, a full-width red Scan button), and the header and sheet sit to its right, capped at 880px, with the sheet fully rounded and a 28px right margin.

Rows run 12px vertical by 16px gutter, divided by hairline rules rather than gaps or cards. The timeline's two-lane row is a three-column grid (`1fr 124px 1fr`, 106px under 400px, 150px from 640px) with the bowl on the centre column. Week headings are ruled across the sheet with a 1.5px form-blue line. Overlays are bottom sheets on phones (16px top corners, 94dvh max) and centred 16px-radius panels from 768px. The landing is a two-area grid (copy over sheet) that becomes copy left and sheet right at 900px, max 1120px.

## Elevation & Depth

Mostly flat paper on a flat table. Depth means a sheet lifting off the table, so shadows are soft, blue-black and only on objects that sit above the table or float over the sheet. Rows, cards and chips on the sheet are flat and separated by rules and borders.

### Shadow Vocabulary
- **Overlay panel** (`box-shadow: 0 30px 80px -20px rgba(10,30,42,.5)`): centred overlays from 768px.
- **Sheet on table** (`box-shadow: 0 24px 60px -30px rgba(5,20,30,.6)`): the auth card; the landing sample sheet uses `0 30px 60px -30px rgba(5,20,30,.7)`.
- **Floating banner** (`box-shadow: 0 16px 40px -16px rgba(10,30,42,.45)`): the install banner.
- **Toast** (`box-shadow: 0 12px 30px -10px rgba(0,0,0,.5)`).
- **Scan disc** (`box-shadow: 0 0 0 5px #fff, 0 8px 18px -6px rgba(31,74,99,.45)`): the raised centre tab.
- **Bowl** (`box-shadow: inset 0 0 0 1px #e3e9ed, 0 0 0 1.5px #c3ced6, 0 2px 4px -1px rgba(31,74,99,.22)`): the porcelain rim.

### Named Rules
**The Paper Lifts Rule.** Only things that leave the table cast shadows: overlays, the auth card, the landing sheet, the toast, the install banner, the Scan disc. Anything resting on the sheet is flat.

## Shapes

Soft, plain corners. Small radii serve small parts: 2px on tick marks and the slider track, 3px on score bars, 4px on the focus outline, 6px on toast actions and the sign-in back link, 7px on popup options, 8px on skeletons and row-level hit areas, 9px on segmented-control buttons. Then 10px on controls (buttons, inputs, the slip), 12px on cards placed on the sheet, 14px on the main sheet's top corners, 16px on overlays and the auth card, 18px pill chips, 20px on icon buttons and 22px on the crew-avatar button. Circles carry meaning: bowls, avatars, the Scan disc, member dots. Borders are 1.5px on controls and cards, 1px for hairlines. Hand-drawn marks are open SVG strokes (2.6px ring, 1.8px underline) with round caps, never closed perfect shapes, and set slightly off-axis (ring rotated -14°, split mark -5°). The landing's sample sheet sits at 1.2° over a second sheet at -3°.

## Components

### Buttons
- **Shape:** gently rounded (10px), 46px tall, 0 18px padding, 15px/700 label, 1.5px border, optional 20px icon.
- **Primary:** form blue with white text; hover deepens to `table-deep`; press nudges down 1px.
- **Scan / camera:** red pencil with white text, used only for Scan and photo capture; hover `red-pencil-deep`.
- **Ink:** ink-black with white text, for the one destructive confirm ("Delete for everyone"); hover goes to pure black. Destructive actions are ink, not red.
- **Line:** white with blue text and a `rule` border that turns form blue on hover. As a toggle ("Want to try"), its on-state fills pale tint with a form-blue border, blue text and a filled icon.
- **Quiet:** no fill, `ink-2` text, 40px tall; hover adds the pale tint.
- **Icon button:** 40px tinted circle, 20px icon.
- **Disabled:** 45% opacity, no press motion.
- **Focus:** a 2.5px `table-hi` outline, 2px offset, on every interactive element.

### Chips
- **Style:** white pill (36px tall, 18px radius) with a 1.5px `rule` border, 14px/600 `ink-2`.
- **State:** selected chips fill form blue with white text; hover darkens the border to form blue. Chips scroll horizontally without a scrollbar.

### Tags
Flavour tags are tinted pills (14px radius, 4px 11px, 14px/600 `ink-2`), static.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** card white on the sheet.
- **Shadow Strategy:** none; see Elevation.
- **Border:** 1.5px `rule`; the tasting form uses a 1.5px form-blue border to read as the active form.
- **Internal Padding:** 16px (tally, tasting form), 14px 16px (verdict cards), 12px (tasting entries).

### Inputs / Fields
- **Style:** white, 48px tall, 10px radius, 1.5px `rule` border, 16px text, `ink-3` placeholder, label above in 14px/600 `ink-2`.
- **Focus:** border turns `table-hi` with a 3px `rgba(42,92,121,.15)` halo. The caret is form blue.
- **Error:** shown as an amber slip below or above the form, never as a red border.
- **Segmented control:** a tinted 12px track with white selected segments and a faint shadow.

### Navigation
- **Mobile:** fixed white tab bar with a top rule; 24px icon over a 12px/600 label; inactive `ink-3`, active form blue; centre Scan disc in red.
- **Desktop rail:** on the table; 15px/600 `on-table-soft` buttons, hover fills `table-hi`, the current page is a sheet-white pill with blue text.

### Icons
One authored set on a 24px grid, 1.8px round-capped strokes, `currentColor`. The table icon is a spine with two bowls; Coffees is three bowls with lines; Palate is two overlapping circles.

### Cupping Bowl (signature)
A white porcelain circle with a hairline rim and a roast-tinted coffee surface inset 13%, or the bag photo inset 3px. Sizes run from 20px in lists to 84px in empty states. The empty-state bowl is filled with pale tint and `rule-2`, an empty cup; there are no hardcoded bowl colours outside the roast table.

### Pencil Marks (signature)
- **Score:** a Kalam numeral in graphite, one decimal, muted to `ink-3` when it isn't yours or isn't set.
- **Tick scale:** a 6–10 form-blue baseline with five small ticks and a slanted graphite tick at the score.
- **Score bar:** a 6px rounded bar in the member's colour, its length set by the score.
- **Ring:** an open red loop drawn around the top cup's bowl, and around the verdict word (where it draws itself in).
- **Split:** the word "split" in red Kalam at 19px with a hand-drawn underline, set at -5°.
- **Score input:** a ruled form-blue slider with a white thumb ringed in graphite (dashed `rule` until scored) and a 56px pencil numeral that answers as you drag.

### Timeline (signature)
Rulings by week ("This week", "Last week", "Two weeks ago"), then by month. Two cuppers: a sticky lane header with each member's avatar and name, a 2px centre spine, and per side a pencil score, a score bar and a quoted note. One or three or more: a left spine with the bowl and a wrapping row of per-member scores.

### Verdict
A 44px/900 word in its verdict colour (Skip struck through), ringed in red pencil, followed by a 16px/600 line and a list of reasons with green check and ochre alert icons.

### Slip, Toast, Sheet
- **Slip:** amber fill, 1.5px amber border, dark ochre text, alert icon, 10px radius.
- **Toast:** ink-black pill near the bottom with a pale-blue (`toast-action`) action, slides up.
- **Sheet:** bottom sheet with a sticky, blurred sheet-white header holding the title and close.

### Motion
One ease, `cubic-bezier(.16,1,.3,1)`. Overlay fade 0.25s, panel rise 0.35s from 24px, toast rise 0.4s, pencil-in 0.9s (a left-to-right clip reveal from -2°), ring draw 1s after 0.25s. The spinner is a 2px `rule` circle with a form-blue top, turning linearly every 0.7s. All of it is switched off under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** put every piece of content on a white sheet (`sheet` or `card`) over the form-blue table.
- **Do** write scores in the pencil hand, to one decimal, in graphite.
- **Do** keep red for the top-cup ring, the split mark, the verdict ring and Scan.
- **Do** show errors as the amber slip.
- **Do** pass every member colour through `inkSafe()` before it touches paper.
- **Do** draw a coffee as its roast-tinted bowl, or its bag photo inside the bowl.
- **Do** divide rows with hairline rules (`rule-2`) and head sections with a 1.5px form-blue line.
- **Do** give every interactive element the 2.5px `table-hi` focus outline and a reduced-motion fallback.

### Don't:
- **Don't** use red for errors, warnings, destructive actions, toggled states, badges, counts or decoration.
- **Don't** set labels, headings or full tasting notes in Kalam.
- **Don't** use uppercase captions, letter-spaced labels or monospace type.
- **Don't** turn the timeline back into a list of cards, or stack shadowed cards on the sheet.
- **Don't** use a raw member colour that fails 4.6:1 on white.
- **Don't** bring back the retired dark ledger look (ink-black ground, manila, stamp red, condensed display type).
