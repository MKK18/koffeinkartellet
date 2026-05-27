import PocketBase from "pocketbase";

// One shared PocketBase client for the whole app.
// URL comes from .env (VITE_PB_URL) so the same code works locally and in prod.
export const pb = new PocketBase(import.meta.env.VITE_PB_URL || "http://127.0.0.1:8090");

// Keep auth state across reloads (PocketBase already persists to localStorage,
// this just makes the autoCancel behaviour saner for a small app).
pb.autoCancellation(false);

export const currentUser = () => pb.authStore.record;
export const isLoggedIn = () => pb.authStore.isValid;

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
    // first ever account becomes admin; otherwise normal member
    is_admin: false,
  });
  await login(email, password);

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
  return pb.collection("users").update(u.id, patch);
}
