# Koffeinkartellet — contributor onboarding

Welcome! This is the coffee tasting app (live at **https://koffeinkartellet.dk**).
Stack: React + Vite frontend, PocketBase backend, deployed on Railway. You don't
need to know any of that to contribute — follow the steps below.

---

## One-time setup (~15 min)

1. **GitHub account** — sign up at github.com if you don't have one. Accept the
   email invite to the `koffeinkartellet` repo.
2. **GitHub Desktop** — install from desktop.github.com and sign in. This is the
   friendly button-based git tool; you'll rarely touch a terminal.
3. **Use a personal identity (important):** GitHub Desktop → Settings/Preferences
   → Git. Make sure the name/email are your **personal** ones, NOT your work email.
   (Tip: use `yourusername@users.noreply.github.com` to keep your email private.)
   This keeps work and personal cleanly separated.
4. **Clone the repo** — in GitHub Desktop: "Clone a repository" → `koffeinkartellet`.
5. **Install Node** — nodejs.org → the LTS download.
6. **Run it locally** — double-click **`Start Coffee Journal.command`** in the
   project folder. First run installs everything (~1 min) and opens the app at
   http://localhost:5173 with a local database. Close the Terminal window to stop.
7. **Make a local account** — in the app, "Create an account" with invite code
   `DEV-INVITE` (the launcher seeds it). The first local account becomes admin.

---

## Local vs. live — read this once

There are **two completely separate databases**:

- **Local** — runs on your laptop via the launcher. Your playground. Adding beans,
  ratings, or accounts here **never touches the real site.**
- **Live** — `koffeinkartellet.dk`, hosted on Railway. The real data you + others use.

So: experiment freely locally. Nothing you do on your machine affects production
until your *code* is merged and deployed (see below).

---

## How we work — the daily loop

Every change merged to `main` **auto-deploys to the live site**, so we keep `main`
always-working by going through Pull Requests:

1. **Pull first.** GitHub Desktop → "Fetch origin" → Pull. Always start here.
2. **Make a branch.** Current Branch → New Branch (e.g. `kiki/feed-tweaks`). Work
   there, not on `main`.
3. **Say what you're doing.** A quick "I'm on the profile page" so you're not both
   editing the same file — the one thing that causes messy conflicts.
4. **Commit** — small and often beats big and rare.
5. **Push** the branch → "Create Pull Request" → open it.
6. **Merge the PR** on GitHub once it looks good. That's when it goes live (~30s).
7. Pull `main` again so your copy is fresh.

`main` is protected — you can't push to it directly, only via PR. That's on purpose.

### Rules of thumb
- Never sit on changes for days — the longer unpushed, the more you drift apart.
- `main` is the live site. Only merge things that work.
- Conflicts aren't scary. Nothing is lost. Tell Claude Code: *"I have a merge
  conflict in <file>, help me resolve it."*

---

## Project map — where things live

```
src/
  Root.jsx          app entry / login gate
  AppShell.jsx      bottom tab bar + overlays (the frame)
  LoginScreen.jsx   sign in / invite signup
  Catalog.jsx       the coffee list + search
  CoffeeForm.jsx    add/edit a coffee (Photo / Link / Manual tabs)
  CoffeeDetail.jsx  a coffee + everyone's tastings
  Feed.jsx          recent tastings from everyone
  Profile.jsx       a person's stats + "Palate vs household"
  TasteProfile.jsx  the palate comparison
  data.js           all database reads/writes
  pb.js             database connection + auth helpers
  lib.js            coffee constants + AI photo/link scanning
  ui.jsx            colors, fonts, shared styles
pocketbase/
  pb_migrations/    database structure (see below) — KEEP in git
  setup_schema.py   how the schema was first created (reference)
  *.mjs             end-to-end tests
```

---

## Changing the database? Commit the migrations

If you add a field or collection (via the local PocketBase admin at
http://127.0.0.1:8090/_/), PocketBase writes new files into
`pocketbase/pb_migrations/`. **You must commit those files** — they're how the live
site learns about the change when you deploy. If you skip them, production breaks.

Migrations also run in **filename order**, and order matters when one table points
at another. If you touch the schema, the safe move is: **ask Claude Code to verify a
clean build from scratch** before you open the PR (it knows how — it caught a real
ordering bug this way).

---

## AI features need an API key

The "scan a photo" and "paste a link" auto-fill features call Anthropic. They won't
work until you add your own **Anthropic API key** in the app: **⚙ Account & settings
→ Anthropic API key**. It's stored in your browser only (per device), never in the
code. Everything else in the app works without it.

---

## Security (the repo is public)

- **Never commit secrets** — API keys, passwords, `.env`. `.env` is git-ignored on
  purpose; keep keys in the app's Settings or in Railway, never in code.
- The `devpassword12345` you'll see in the scripts is a **local-only throwaway** —
  it can't touch the live site. Don't reuse it for anything real.

---

## Using Claude Code

You don't need to know the code — describe what you want. Examples:

- *"Add a 'decaf' checkbox to the add-coffee form and save it on the coffee."*
- *"The feed should show the coffee's roaster. Make that change."*
- *"I have a merge conflict in Catalog.jsx, help me resolve it."*
- *"Why isn't the photo scan working?"*

Then commit + PR the changes it makes (Claude can do the git steps for you too).

---

## Troubleshooting

- **App won't load at localhost:5173** → is the launcher's Terminal window still
  open? It runs both the app *and* the database; closing it stops everything. Re-run
  `Start Coffee Journal.command`.
- **Login fails locally** → the local DB is fresh; create an account with `DEV-INVITE`.
- **Photo/link scan fails** → add your Anthropic API key (see above).
- **Anything weird** → ask Claude Code; it knows this whole project.

---

## Handy facts

| | |
|---|---|
| Live site | https://koffeinkartellet.dk |
| Local dev | http://localhost:5173 (via the launcher) |
| Local DB dashboard | http://127.0.0.1:8090/_/ |
| Local invite code | `DEV-INVITE` |
| Deploys | Automatic — merging to `main` redeploys the live site |
