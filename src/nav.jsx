import { createContext, useContext } from "react";

// Lets any screen open a coffee, a person's profile, the add/edit forms, or
// settings — and signal that data changed so lists refresh. Provided by AppShell.
const NavCtx = createContext(null);

export const NavProvider = NavCtx.Provider;

export function useNav() {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error("useNav must be used inside <NavProvider>");
  return ctx;
}
