import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth.jsx";
import LoginScreen from "./LoginScreen.jsx";
import AppShell from "./AppShell.jsx";
import LandingPage from "./LandingPage.jsx";
import NotFound from "./NotFound.jsx";
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#100d0a", color: "#8a7c67", fontFamily: "'Martian Mono', ui-monospace, monospace", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>
        Loading ledger…
      </div>
    );
  }

  if (path === "/" || path === "") {
    // The marketing page is for logged-out visitors in a browser tab.
    // Signed-in users go straight to their journal, and installed
    // (home-screen) apps always do — PWAs installed before the app moved to
    // /app still open with the old cached start_url of "/".
    if (user || isStandalone()) { navigate("/app", { replace: true }); return null; }
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

  // Unknown path → a real 404 (kept in-world), not a silent bounce home.
  return <NotFound loggedIn={!!user} />;
}

export default function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
