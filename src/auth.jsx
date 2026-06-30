import { createContext, useContext, useEffect, useState } from "react";
import { pb, onAuthChange, currentUser, isLoggedIn, logout as pbLogout } from "./pb.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(currentUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    // Refresh the cached session on load so profile/role changes (e.g. becoming
    // admin) propagate without needing to sign out and back in.
    if (isLoggedIn()) {
      pb.collection("users").authRefresh().catch((err) => {
        // 401 = token is invalid (DB reset, account deleted, secret key changed).
        // Clear the stale session so the user lands on the login screen instead
        // of seeing an empty app. Non-401 errors (offline, 5xx) keep the cache.
        if (err?.status === 401 || err?.response?.code === 401) {
          pbLogout();
        }
      });
    }
    setReady(true);
    return unsub;
  }, []);

  const value = {
    user,
    ready,
    logout: () => pbLogout(),
    refresh: () => setUser(currentUser() ? { ...currentUser() } : null),
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
