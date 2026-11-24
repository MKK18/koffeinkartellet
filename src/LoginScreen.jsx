import { useState } from "react";
import { login, signUpWithInvite } from "./pb.js";
import { useAuth } from "./auth.jsx";
import { navigate } from "./router.js";
import { Icon, Slip } from "./components.jsx";
import { CREW_COLORS } from "./marks.js";

const startMode = () => (new URLSearchParams(window.location.search).has("invite") ? "signup" : "signin");

export default function LoginScreen() {
  const { refresh } = useAuth();
  const [mode, setMode] = useState(startMode); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(CREW_COLORS[0]);
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
        if (!code.trim()) throw new Error("Enter the invite code you were sent.");
        if (!name.trim()) throw new Error("Pick a name the crew will see.");
        if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
        await signUpWithInvite({ email: email.trim(), password, name: name.trim(), color, code: code.trim() });
      }
      refresh();
    } catch (err) {
      const m = err?.message || "";
      setError(mode === "signin" && /authenticate|invalid|400/i.test(m)
        ? "That email and password don't match. Check them and try again."
        : m || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const swap = (m) => { setMode(m); setError(""); };

  return (
    <div className="ct auth">
      <div className="auth-col">
        <a href="/" className="auth-back" onClick={(e) => { e.preventDefault(); navigate("/"); }}><Icon name="back" size={18} />Koffeinkartellet</a>

        <div className="auth-card">
          <h1>{mode === "signin" ? "Welcome back" : "Join with your invite"}</h1>
          <p className="auth-lede">{mode === "signin" ? "Sign in to see what the crew has been cupping." : "Someone in the crew sent you a code. Use it to make your account."}</p>

          <form onSubmit={submit} noValidate>
            {mode === "signup" && (
              <label className="field">
                <span className="label">Invite code</span>
                <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. BREW-7K2Q" autoCapitalize="characters" autoComplete="off" />
              </label>
            )}
            <label className="field">
              <span className="label">Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </label>
            <label className="field">
              <span className="label">Password</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
              {mode === "signup" && <span className="hint">At least 8 characters.</span>}
            </label>

            {mode === "signup" && (
              <>
                <label className="field">
                  <span className="label">Your name</span>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="What the crew calls you" autoComplete="nickname" />
                </label>
                <fieldset className="field" style={{ border: 0, padding: 0, margin: "0 0 18px" }}>
                  <legend className="label">Your colour on the table</legend>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {CREW_COLORS.map((c) => (
                      <button type="button" key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`} aria-pressed={color === c}
                        style={{ width: 40, height: 40, borderRadius: "50%", background: c, cursor: "pointer", border: 0,
                          boxShadow: color === c ? "0 0 0 3px #fff, 0 0 0 5.5px var(--pencil)" : "none" }} />
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            {error && <Slip style={{ marginBottom: 14 }}>{error}</Slip>}

            <button type="submit" disabled={busy} className="btn btn-primary btn-block">
              {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create my account"}
            </button>
          </form>
        </div>

        <p className="auth-swap">
          {mode === "signin"
            ? <>Got an invite code? <button type="button" className="linkbtn" onClick={() => swap("signup")}>Join with it</button></>
            : <>Already have an account? <button type="button" className="linkbtn" onClick={() => swap("signin")}>Sign in</button></>}
        </p>
      </div>
    </div>
  );
}
