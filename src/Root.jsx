import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth.jsx";
import LoginScreen from "./LoginScreen.jsx";
import AppShell from "./AppShell.jsx";
import LandingPage from "./LandingPage.jsx";
import { C, sans } from "./ui.jsx";
import { navigate } from "./router.js";

function usePathname() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

function Gate() {
  const { user, ready } = useAuth();
  const path = usePathname();

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.muted, fontFamily: sans }}>
        Loading…
      </div>
    );
  }

  if (path === "/" || path === "") return <LandingPage user={user} />;

  if (path === "/login") {
    if (user) { navigate("/app"); return null; }
    return <LoginScreen />;
  }

  if (path.startsWith("/app")) {
    if (!user) { navigate("/login"); return null; }
    return <AppShell />;
  }

  navigate("/");
  return null;
}

export default function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
