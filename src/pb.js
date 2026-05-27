import PocketBase from "pocketbase";

// One shared PocketBase client for the whole app.
// - explicit VITE_PB_URL wins (set it in .env if you want)
// - local dev: the PocketBase binary on your Mac
// - production: same origin "/" — the PocketBase container serves the app AND
//   the API from one domain, so no hardcoded URL is needed.
const PB_URL = import.meta.env.VITE_PB_URL || (import.meta.env.DEV ? "http://127.0.0.1:8090" : "/");
export const pb = new PocketBase(PB_URL);

// Keep auth state across reloads (PocketBase already persists to localStorage,
// this just makes the autoCancel behaviour saner for a small app).
pb.autoCancellation(false);

export const currentUser = () => pb.authStore.record;
export const isLoggedIn = () => pb.authStore.isValid;

// URL of a user's uploaded avatar photo, or "" if they have none.
export function avatarUrl(user) {
  if (!user?.avatar) return "";
  try { return pb.files.getURL(user, user.avatar); } catch { return ""; }
}

export function onAuthChange(cb) {
  // fire once immediately, then on every change
  cb(pb.authStore.record);
  return pb.authStore.onChange(() => cb(pb.authStore.record));
}

export async function login(email, password) {
  return pb.collection("users").authWithPassword(email, password);
}

export function logout() {
  pb.authStore.clear();
}

// Look up an invite by code (public read). Returns the invite record or throws.
export async function findInvite(code) {
  const clean = (code || "").trim();
  if (!clean) throw new Error("Please enter your invite code.");
  let invite;
  try {
    invite = await pb.collection("invites").getFirstListItem(`code = "${clean}"`);
  } catch {
    throw new Error("That invite code wasn't found.");
  }
  if (invite.used_by) throw new Error("That invite has already been used.");
  if (invite.expires && new Date(invite.expires) < new Date())
    throw new Error("That invite has expired.");
  return invite;
}

// Sign up gated by an invite code, then log in, then consume the invite.
export async function signUpWithInvite({ email, password, name, color, code }) {
  const invite = await findInvite(code);

  await pb.collection("users").create({
    email,
    password,
    passwordConfirm: password,
    name,
    color: color || "#8B5E3C",
    is_admin: false,
  });
  await login(email, password);

  // The first-ever account becomes the admin (the person who set up the platform).
  // NOTE: Phase 2 hardens this with a server-side hook so is_admin can't be self-set.
  try {
    const all = await pb.collection("users").getList(1, 1);
    if (all.totalItems === 1) {
      await pb.collection("users").update(currentUser().id, { is_admin: true });
      await pb.collection("users").authRefresh();
    }
  } catch { /* non-fatal */ }

  // Mark invite used (best-effort).
  try {
    await pb.collection("invites").update(invite.id, { used_by: currentUser().id });
  } catch { /* non-fatal */ }

  // If this invite created a new household, make the group and add the user as owner.
  if (invite.kind === "new_household") {
    try {
      const group = await pb.collection("groups").create({
        name: `${name}'s household`,
        created_by: currentUser().id,
      });
      await pb.collection("group_members").create({
        group: group.id, user: currentUser().id, role: "owner",
      });
    } catch { /* non-fatal for now */ }
  } else if (invite.kind === "join_group" && invite.group) {
    try {
      await pb.collection("group_members").create({
        group: invite.group, user: currentUser().id, role: "member",
      });
    } catch { /* non-fatal */ }
  }

  return currentUser();
}

export async function updateProfile(patch) {
  const u = currentUser();
  if (!u) throw new Error("Not logged in.");
  const rec = await pb.collection("users").update(u.id, patch);
  await pb.collection("users").authRefresh();
  return rec;
}

// Change password. PocketBase requires the current password; we then re-auth
// so the session stays valid with the new credentials.
export async function changePassword(oldPassword, newPassword) {
  const u = currentUser();
  if (!u) throw new Error("Not logged in.");
  await pb.collection("users").update(u.id, {
    oldPassword, password: newPassword, passwordConfirm: newPassword,
  });
  await pb.collection("users").authWithPassword(u.email, newPassword);
}

// Request an email change. PocketBase sends a confirmation link to the NEW
// address; the change only takes effect once that link is clicked. Requires
// email delivery (configured on the server in Phase 2).
export async function requestEmailChange(newEmail) {
  return pb.collection("users").requestEmailChange(newEmail);
}
