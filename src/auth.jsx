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
      pb.collection("users").authRefresh().catch(() => { /* keep cached session if offline/expired */ });
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
