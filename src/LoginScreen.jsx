import { useState } from "react";
import { login, signUpWithInvite } from "./pb.js";
import { useAuth } from "./auth.jsx";
import { RATER_COLORS, FontLink } from "./ui.jsx";
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
    <div className="cl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <FontLink />
      <style>{LOGIN_CSS}</style>
      <div style={{ width: "100%", maxWidth: 430 }}>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="cl-login-back">
          ← Back to home
        </a>

        <div style={{ marginTop: 22, marginBottom: 20 }}>
          <div className="cl-brand">KOFFEIN<b>KARTELLET</b></div>
          <h1 className="cl-login-head">{mode === "signin" ? "Welcome back" : "Request entry"}</h1>
          <div className="cl-login-sub">
            {mode === "signin" ? "Present your credentials to the ledger" : "Entry requires a valid invitation code"}
          </div>
        </div>

        <form onSubmit={submit} className="cl-login-panel">
          {mode === "signup" && (
            <label className="cl-field">
              <span className="cl-label">Invitation code</span>
              <input className="cl-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. TUR-2026" autoCapitalize="characters" />
            </label>
          )}

          <label className="cl-field">
            <span className="cl-label">Email</span>
            <input className="cl-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>

          <label className="cl-field">
            <span className="cl-label">Password</span>
            <input className="cl-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"} required />
          </label>

          {mode === "signup" && (
            <>
              <label className="cl-field">
                <span className="cl-label">Display name</span>
                <input className="cl-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kiki" />
              </label>
              <div className="cl-field">
                <span className="cl-label">Your stamp color</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {RATER_COLORS.map((c) => (
                    <button type="button" key={c} onClick={() => setColor(c)} aria-label={"color " + c} style={{
                      width: 34, height: 34, background: c, cursor: "pointer",
                      border: color === c ? "2px solid var(--bone)" : "2px solid var(--ink-line)",
                      outline: color === c ? "2px solid var(--stamp)" : "none", outlineOffset: 1,
                    }} />
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <div className="cl-login-err">{error}</div>}

          <button type="submit" disabled={busy} className="cl-stamp-btn" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {busy ? "One moment…" : mode === "signin" ? "Sign in →" : "Request entry →"}
          </button>
        </form>

        <div className="cl-login-toggle">
          {mode === "signin" ? (
            <>Got an invitation? <button onClick={() => { setMode("signup"); setError(""); }}>Request a seat</button></>
          ) : (
            <>Already a member? <button onClick={() => { setMode("signin"); setError(""); }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}

const LOGIN_CSS = `
.cl-login-back{font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);text-decoration:none}
.cl-login-back:hover{color:var(--bone)}
.cl-login-head{font-family:var(--font-display);font-weight:400;text-transform:uppercase;font-size:clamp(38px,9vw,58px);line-height:.9;letter-spacing:-.01em;color:var(--bone);margin:10px 0 0}
.cl-login-sub{font-family:var(--font-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:10px}
.cl-login-panel{background:var(--ink-2);border:1px solid var(--ink-line);padding:26px 24px}
.cl-login-err{background:rgba(226,67,29,.12);border:1px solid var(--stamp);color:#f0b7a6;font-family:var(--font-mono);font-size:12px;letter-spacing:.04em;padding:10px 12px;margin-bottom:14px}
.cl-login-toggle{text-align:center;margin-top:18px;font-family:var(--font-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}
.cl-login-toggle button{background:none;border:none;color:var(--stamp);font-family:inherit;font-size:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:0}
`;
