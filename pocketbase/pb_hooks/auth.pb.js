/// <reference path="../pb_data/types.d.ts" />
//
// Auth hardening:
//   1. Prevent privilege escalation — non-admins can never set/keep is_admin=true
//      on a user record, no matter what they PATCH.
//   2. Server-side gated signup — validates and consumes an invite with $app
//      privileges, so invites stay locked down (admins-only) and the client
//      never reads invite codes or sets is_admin itself.

// ── 1. is_admin guard ──────────────────────────────────────────────────────
// These run on the public records API (POST/PATCH /api/collections/users/...).
// The /api/signup route below uses $app.save directly and is unaffected.
//
// NOTE: the privilege check is inlined into each handler. File-scope helpers
// are NOT visible inside hook handlers (each runs in its own pooled goja VM) —
// referencing one throws "ReferenceError: ... is not defined". This matches the
// same constraint documented in ai.pb.js.

onRecordCreateRequest((e) => {
  const info = e.requestInfo();
  const privileged = info.hasSuperuserAuth() || !!(info.auth && info.auth.getBool("is_admin"));
  if (!privileged) e.record.set("is_admin", false);
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  const info = e.requestInfo();
  const privileged = info.hasSuperuserAuth() || !!(info.auth && info.auth.getBool("is_admin"));
  if (!privileged) {
    // Force is_admin back to its stored value — a non-admin can't change it.
    e.record.set("is_admin", e.record.original().getBool("is_admin"));
  }
  e.next();
}, "users");

// ── 2. Gated signup ────────────────────────────────────────────────────────
// Body: { email, password, name, color?, code }. Validates the invite, creates
// the user (is_admin decided server-side), consumes the invite, and sets up the
// household/group membership — all atomically. The client then logs in.
routerAdd("POST", "/api/signup", (e) => {
  const body = e.requestInfo().body || {};
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const color = String(body.color || "").trim() || "#8B5E3C";
  const code = String(body.code || "").trim();

  if (!email || !password || !name) throw new BadRequestError("Email, password and name are required.");
  if (password.length < 8) throw new BadRequestError("Password must be at least 8 characters.");
  if (!code) throw new BadRequestError("Please enter your invite code.");

  // Validate the invite (bound param — no filter injection).
  let invite;
  try {
    invite = $app.findFirstRecordByFilter("invites", "code = {:code}", { code });
  } catch (_) {
    throw new BadRequestError("That invite code wasn't found.");
  }
  if (invite.get("used_by")) throw new BadRequestError("That invite has already been used.");
  const expStr = invite.getString("expires");
  if (expStr && new Date(expStr.replace(" ", "T")) < new Date()) {
    throw new BadRequestError("That invite has expired.");
  }

  // The first-ever account becomes the platform admin.
  const isFirst = $app.countRecords("users") === 0;

  let newUserId = "";
  $app.runInTransaction((txApp) => {
    // Re-read the invite inside the tx and guard against a concurrent claim.
    const inv = txApp.findRecordById("invites", invite.id);
    if (inv.get("used_by")) throw new BadRequestError("That invite has already been used.");

    const usersCol = txApp.findCollectionByNameOrId("users");
    const user = new Record(usersCol);
    user.set("email", email);
    user.set("name", name);
    user.set("color", color);
    user.set("is_admin", isFirst);
    user.setPassword(password);
    user.setVerified(true);
    try {
      txApp.save(user);
    } catch (err) {
      throw new BadRequestError("Could not create the account — that email may already be registered.");
    }
    newUserId = user.id;

    // Consume the invite.
    inv.set("used_by", user.id);
    txApp.save(inv);

    // Set up group membership.
    const kind = inv.getString("kind");
    if (kind === "new_household") {
      const groupsCol = txApp.findCollectionByNameOrId("groups");
      const group = new Record(groupsCol);
      group.set("name", name + "'s household");
      group.set("created_by", user.id);
      txApp.save(group);

      const gmCol = txApp.findCollectionByNameOrId("group_members");
      const gm = new Record(gmCol);
      gm.set("group", group.id);
      gm.set("user", user.id);
      gm.set("role", "owner");
      txApp.save(gm);
    } else if (kind === "join_group" && inv.getString("group")) {
      const gmCol = txApp.findCollectionByNameOrId("group_members");
      const gm = new Record(gmCol);
      gm.set("group", inv.getString("group"));
      gm.set("user", user.id);
      gm.set("role", "member");
      txApp.save(gm);
    }
  });

  return e.json(200, { ok: true, id: newUserId });
});
