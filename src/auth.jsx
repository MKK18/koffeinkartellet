import { createContext, useContext, useEffect, useState } from "react";
import { pb, onAuthChange, currentUser, isLoggedIn, logout as pbLogout } from "./pb.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  // Never trust a client-side-expired token as "logged in".
  const [user, setUser] = useState(isLoggedIn() ? currentUser() : null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    let alive = true;

    // Verify the session BEFORE rendering the app. Rendering while a stale token
    // is still in flight is the bug that shows an empty catalog (the app mounts,
    // fires data queries with the dead token, and only then does the 401 arrive).
    (async () => {
      if (isLoggedIn()) {
        try {
          await pb.collection("users").authRefresh();
        } catch (err) {
          // Auth failure = the token is dead (secret rotated on redeploy, account
          // deleted, server-side expiry). Clear it so we land on the login screen
          // instead of an empty app. Network/5xx errors keep the cache (offline).
          const status = err?.status ?? err?.response?.code;
          if (status === 401 || status === 403) pbLogout();
        }
      } else if (currentUser()) {
        // Token is expired/invalid client-side but a stale record lingers — drop it.
        pbLogout();
      }
      if (alive) setReady(true);
    })();

    return () => { alive = false; unsub(); };
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
