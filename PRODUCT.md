# Koffeinkartellet — Product truth

> Authored by Claude from established product knowledge (built the app), not a fresh
> user interview — the user asked to proceed directly. Product truth only; no visual
> decisions live here (those belong in DESIGN.md, written at finish).

## What it is
An **invite-only coffee tasting journal shared within a household or crew** — "the
caffeine cartel." Members log the coffees they brew, score and tag them, and see each
other's verdicts in a shared feed. It is a private, opinionated record, not a public
review site.

## Unique mechanism
It turns a bag of coffee into a **logged, scored, shared tasting** with almost no typing:
- **Scan to log** — photograph a bag (or paste a roaster URL) and AI fills in roaster,
  origin, region, producer, varietal, process, roast, altitude, tasting notes.
- **Buy verdict** — scan a bag *in the shop* and it scores it against your household's
  collective palate and answers **buy / maybe / skip**, with the reasons.
- **Shared palate** — every member's scores accumulate into a taste profile the crew
  can see and argue about.

## Audience & scene
Specialty-coffee enthusiasts who buy interesting single-origin bags and want to
remember, compare, and share them. Used on a phone: at home after brewing, and
standing in a café holding a bag deciding whether to buy it.

## What the landing page must prove
That this is a beautiful, private, seriously-crafted journal worth wanting an invite to
— not another generic tracker. A first-time visitor should grasp within seconds: *what
it is, why it's different (scan + verdict + shared palate), and that entry is by invite.*

## Real proof & content available
Tasting scores (0–10), flavor tags, origin/process/varietal metadata, per-member rater
colors and avatars, a live feed of verdicts and quotes, bag photos.

## Constraints
- **Invite-only** — no open signup; the primary CTA is "have an invite" / request one.
- PWA, React + PocketBase, English UI, mobile-first.

## What it is NOT
A shop, a price comparison tool, a public review aggregator, or a social network.
