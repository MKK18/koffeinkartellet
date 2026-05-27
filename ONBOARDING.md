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

## How we work — the daily loop

Because every change merged to `main` **auto-deploys to the live site**, we keep
`main` always-working by going through Pull Requests. The loop:

1. **Pull first.** GitHub Desktop → "Fetch origin" → Pull. Always start here so you
   have the other person's latest work.
2. **Make a branch.** GitHub Desktop → Current Branch → New Branch (e.g.
   `kiki/feed-tweaks`). Work on that, not on `main`.
3. **Say what you're doing.** A quick message ("I'm on the profile page") so you're
   not both editing the same file at once — that's the only thing that causes messy
   conflicts for a two-person team.
4. **Commit** your changes (small and often beats big and rare). GitHub Desktop →
   write a one-line summary → Commit.
5. **Push** the branch → GitHub Desktop offers "Create Pull Request" → open it.
6. **Merge the PR** on GitHub once it looks good. That's when it goes live (~30s).
7. Pull `main` again so your copy is fresh.

### Rules of thumb
- **Never sit on changes for days** — the longer unpushed, the more you drift apart.
- **`main` is the live site.** Only merge things that work.
- **Conflicts aren't scary.** Nothing is lost. Tell Claude Code: *"I have a merge
  conflict in <file>, help me resolve it"* — it reads both sides and fixes it.

---

## Handy facts

| | |
|---|---|
| Live site | https://koffeinkartellet.dk |
| Local dev | http://localhost:5173 (via the launcher) |
| Local invite code | `DEV-INVITE` |
| Backend | PocketBase (runs locally via the launcher; in prod on Railway) |
| Deploys | Automatic — merging to `main` redeploys the live site |

Questions? Ask Claude Code — it knows this whole project.
