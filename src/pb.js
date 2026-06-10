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

// Sign up gated by an invite code, then log in.
//
// Everything security-sensitive happens server-side in the /api/signup hook:
// the invite is validated + consumed, the user is created (is_admin is decided
// by the server — first account becomes admin), and the household/group is set
// up. Invites are admin-only at the API level, so the client never reads codes
// or sets is_admin itself. We only collect the form data and log in afterwards.
export async function signUpWithInvite({ email, password, name, color, code }) {
  try {
    await pb.send("/api/signup", {
      method: "POST",
      body: { email, password, name, color: color || "#8B5E3C", code },
    });
  } catch (err) {
    // Surface the server's friendly message (bad/used/expired code, etc.).
    const msg = err?.response?.message || err?.message || "Couldn't create your account.";
    throw new Error(msg);
  }
  await login(email, password);
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
