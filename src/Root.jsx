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
      <div className="ct" role="status" aria-label="Loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", background: "var(--table)" }}>
        <span className="bowl" aria-hidden="true" style={{ width: 56, height: 56, display: "inline-block", opacity: 0.9 }} />
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
