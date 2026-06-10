import { useState } from "react";
import { login, signUpWithInvite } from "./pb.js";
import { useAuth } from "./auth.jsx";
import { C, serif, sans, inputStyle, labelStyle, primaryBtn, RATER_COLORS, FontLink } from "./ui.jsx";
import { navigate } from "./router.js";

export default function LoginScreen() {
  const { refresh } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(RATER_COLORS[0]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (mode === "signin") {
        await login(email.trim(), password);
      } else {
        if (!name.trim()) throw new Error("Pick a display name.");
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        await signUpWithInvite({ email: email.trim(), password, name: name.trim(), color, code });
      }
      refresh();
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <FontLink />
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ marginBottom: 16 }}>
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}
            style={{ fontSize: 13, color: C.muted, fontFamily: sans, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>&larr;</span> Back to home
          </a>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.faint, fontFamily: sans }}>☕ Koffeinkartellet</div>
          <h1 style={{ margin: "8px 0 0", fontFamily: serif, fontSize: 36, color: C.ink, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 0.95 }}>
            {mode === "signin" ? "Welcome back" : "Join the cartel"}
          </h1>
          <div style={{ fontSize: 13, color: C.muted, fontFamily: sans, marginTop: 6 }}>
            {mode === "signin" ? "Sign in to your tasting journal" : "You'll need an invite code to sign up"}
          </div>
        </div>

        <form onSubmit={submit} style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 18, padding: 24, boxShadow: "0 8px 28px rgba(100,70,40,0.08)" }}>
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Invite code</label>
              <input style={inputStyle} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. KIKI-MADSY" autoCapitalize="characters" />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"} required />
          </div>

          {mode === "signup" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Display name</label>
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kiki" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Your color</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {RATER_COLORS.map((c) => (
                    <button type="button" key={c} onClick={() => setColor(c)} style={{
                      width: 34, height: 34, borderRadius: "50%", background: c, cursor: "pointer",
                      border: color === c ? "3px solid #2c1a0e" : "3px solid transparent",
                    }} />
                  ))}
                </div>
              </div>
            </>
          )}

          {error && (
            <div style={{ background: "#f7e4dc", color: "#a05040", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: sans, marginBottom: 14 }}>{error}</div>
          )}

          <button type="submit" disabled={busy} style={{ ...primaryBtn(!busy), width: "100%" }}>
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.muted, fontFamily: sans }}>
          {mode === "signin" ? (
            <>Got an invite? <button onClick={() => { setMode("signup"); setError(""); }} style={linkBtn}>Create an account</button></>
          ) : (
            <>Already a member? <button onClick={() => { setMode("signin"); setError(""); }} style={linkBtn}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}

const linkBtn = {
  background: "none", border: "none", color: "#8B5E3C", fontFamily: "'DM Sans', sans-serif",
  fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0,
};
