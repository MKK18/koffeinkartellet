import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, currentUser, logout as pbLogout } from "./pb.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(currentUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
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
