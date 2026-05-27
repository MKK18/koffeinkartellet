import { AuthProvider, useAuth } from "./auth.jsx";
import LoginScreen from "./LoginScreen.jsx";
import { C, serif, sans, ghostBtn, FontLink } from "./ui.jsx";

function AuthedHome() {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <FontLink />
      <div style={{ background: C.ink, padding: "20px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b89870", fontFamily: sans }}>☕ Koffeinkartellet</div>
            <h1 style={{ margin: "4px 0 0", fontFamily: serif, fontSize: 24, color: "#fff8f0", fontWeight: 900 }}>Tasting journal</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff8f0", fontFamily: sans, fontSize: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: user?.color || "#8B5E3C", display: "inline-block" }} />
              {user?.name || user?.email}
              {user?.is_admin && <span style={{ fontSize: 10, background: "#8B5E3C", color: "#fff8f0", padding: "2px 7px", borderRadius: 8, letterSpacing: "0.06em" }}>ADMIN</span>}
            </span>
            <button onClick={logout} style={{ ...ghostBtn, color: "#b89870", borderColor: "#6b5040" }}>Sign out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontFamily: serif, fontSize: 26, color: C.ink, margin: "0 0 8px" }}>You're in, {user?.name || "friend"}.</h2>
        <p style={{ fontFamily: sans, fontSize: 15, color: C.muted, lineHeight: 1.6, maxWidth: 440, margin: "0 auto" }}>
          Accounts and login are working. Next we build the good stuff: the shared coffee
          catalog, tasting pages where everyone's scores stack up side by side, profiles, and
          the feed.
        </p>
      </div>
    </div>
  );
}

function Gate() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.muted, fontFamily: sans }}>
        Loading…
      </div>
    );
  }
  return user ? <AuthedHome /> : <LoginScreen />;
}

export default function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
