import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth.jsx";
import LoginScreen from "./LoginScreen.jsx";
import AppShell from "./AppShell.jsx";
import LandingPage from "./LandingPage.jsx";
import { C, sans } from "./ui.jsx";
import { navigate, isStandalone } from "./router.js";

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

  if (path === "/" || path === "") {
    // Installed (home-screen) apps should never land on the marketing page —
    // PWAs installed before the app moved to /app still open with the old
    // cached start_url of "/". Send them straight into the journal; the /app
    // route handles auth from there.
    if (isStandalone()) { navigate("/app", { replace: true }); return null; }
    return <LandingPage user={user} />;
  }

  if (path === "/login") {
    if (user) { navigate("/app", { replace: true }); return null; }
    return <LoginScreen />;
  }

  if (path.startsWith("/app")) {
    if (!user) { navigate("/login", { replace: true }); return null; }
    return <AppShell />;
  }

  navigate("/", { replace: true });
  return null;
}

export default function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
