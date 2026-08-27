import { useState, useRef } from "react";
import { getApiKey, setApiKey, getProvider, setProvider as writeProvider } from "./settings.js";
import { updateProfile, changePassword, requestEmailChange, currentUser } from "./pb.js";
import { useAuth } from "./auth.jsx";
import { compressImage } from "./lib.js";
import { RATER_COLORS } from "./ui.jsx";
import { Sheet, SectionHead, Avatar } from "./components.jsx";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";

function Note({ ok, children }) {
  if (!children) return null;
  return <div style={{ marginTop: 8, fontSize: 12, fontFamily: MONO, letterSpacing: "0.03em", color: ok ? "var(--ok)" : "#f0b7a6" }}>{children}</div>;
}
const L = ({ children }) => <span className="cl-label">{children}</span>;

export default function SettingsModal({ onClose }) {
  const { user, refresh } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [color, setColor] = useState(user?.color || RATER_COLORS[0]);
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const fileRef = useRef();

  const pickAvatar = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const { blob } = await compressImage(file);
    setAvatarBlob(blob); setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(blob));
  };

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState(null);

  const [key, setKey] = useState(getApiKey());
  const [aiProvider, setAiProvider] = useState(getProvider());
  const [showKey, setShowKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState(null);
  const providerInfo = {
    anthropic: { placeholder: "sk-ant-…", helper: "Get a key at console.anthropic.com → API Keys." },
    openai:    { placeholder: "sk-…",     helper: "Get a key at platform.openai.com → API Keys." },
  };

  const [busy, setBusy] = useState("");

  const saveProfile = async () => {
    setBusy("profile"); setProfileMsg(null);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("color", color);
      fd.append("bio", bio.trim());
      if (avatarBlob) fd.append("avatar", avatarBlob, "avatar.jpg");
      else if (removeAvatar) fd.append("avatar", "");
      await updateProfile(fd);
      refresh();
      setAvatarBlob(null); setAvatarPreview(""); setRemoveAvatar(false);
      setProfileMsg({ ok: true, t: "Profile saved." });
    } catch (e) {
      const detail = e?.data?.data ? Object.entries(e.data.data).map(([k, v]) => `${k}: ${v?.message || v}`).join("; ") : "";
      console.error("saveProfile failed:", e?.data || e);
      setProfileMsg({ ok: false, t: detail ? `Couldn't save — ${detail}` : (e?.message || "Couldn't save.") });
    } finally { setBusy(""); }
  };

  const savePassword = async () => {
    if (newPw.length < 8) { setPwMsg({ ok: false, t: "New password must be at least 8 characters." }); return; }
    setBusy("pw"); setPwMsg(null);
    try { await changePassword(oldPw, newPw); setOldPw(""); setNewPw(""); setPwMsg({ ok: true, t: "Password changed." }); }
    catch (e) { setPwMsg({ ok: false, t: e?.message?.includes("password") ? "Current password is incorrect." : "Couldn't change password." }); }
    finally { setBusy(""); }
  };

  const saveEmail = async () => {
    if (!newEmail.includes("@")) { setEmailMsg({ ok: false, t: "Enter a valid email." }); return; }
    setBusy("email"); setEmailMsg(null);
    try { await requestEmailChange(newEmail.trim()); setEmailMsg({ ok: true, t: `Confirmation sent to ${newEmail.trim()}. Click the link there to finish.` }); setNewEmail(""); }
    catch (e) { setEmailMsg({ ok: false, t: e?.message || "Couldn't request the change." }); }
    finally { setBusy(""); }
  };

  const saveKey = () => { setApiKey(key.trim()); writeProvider(aiProvider); setKeyMsg({ ok: true, t: "Saved." }); };

  const inputMb = { marginBottom: 12 };

  return (
    <Sheet onClose={onClose} maxWidth={480}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 24, fontWeight: 400, textTransform: "uppercase", color: "var(--bone)" }}>Account &amp; settings</h2>
        <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 24, color: "var(--dim)", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
      <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: MONO, letterSpacing: "0.06em" }}>Signed in as {currentUser()?.email}</div>

      <SectionHead title="Profile" />
      <L>Photo</L>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        {avatarPreview
          ? <img src={avatarPreview} alt="" style={{ width: 56, height: 56, objectFit: "cover", border: "1px solid var(--ink-line)" }} />
          : <Avatar user={{ ...user, color, avatar: removeAvatar ? "" : user?.avatar }} size={56} />}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickAvatar(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} className="cl-ghost-btn" style={{ padding: "9px 12px" }}>Upload photo</button>
        {(user?.avatar || avatarPreview) && (
          <button onClick={() => { setAvatarBlob(null); setAvatarPreview(""); setRemoveAvatar(true); }} className="cl-ghost-btn" style={{ padding: "9px 12px", color: "var(--stamp)", borderColor: "var(--stamp)" }}>Remove</button>
        )}
      </div>
      {(avatarBlob || removeAvatar) && (
        <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: MONO, marginTop: -4, marginBottom: 12 }}>Save profile below to keep this change.</div>
      )}
      <L>Display name</L>
      <input className="cl-input" style={inputMb} value={name} onChange={(e) => setName(e.target.value)} />
      <L>Stamp color</L>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {RATER_COLORS.map((c) => (
          <button key={c} type="button" onClick={() => setColor(c)} aria-label={"color " + c} style={{ width: 32, height: 32, background: c, cursor: "pointer", border: color === c ? "2px solid var(--bone)" : "2px solid var(--ink-line)", outline: color === c ? "2px solid var(--stamp)" : "none", outlineOffset: 1 }} />
        ))}
      </div>
      <L>Bio</L>
      <textarea className="cl-input" style={{ minHeight: 50, resize: "vertical" }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="optional" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={saveProfile} disabled={busy === "profile"} className="cl-stamp-btn">{busy === "profile" ? "Saving…" : "Save profile"}</button>
      </div>
      <Note ok={profileMsg?.ok}>{profileMsg?.t}</Note>

      <SectionHead title="Change password" />
      <L>Current password</L>
      <input type="password" className="cl-input" style={inputMb} value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" />
      <L>New password</L>
      <input type="password" className="cl-input" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={savePassword} disabled={busy === "pw" || !oldPw || !newPw} className="cl-stamp-btn">{busy === "pw" ? "Saving…" : "Change password"}</button>
      </div>
      <Note ok={pwMsg?.ok}>{pwMsg?.t}</Note>

      <SectionHead title="Change email" />
      <L>New email</L>
      <input type="email" className="cl-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={saveEmail} disabled={busy === "email" || !newEmail} className="cl-stamp-btn">{busy === "email" ? "Sending…" : "Send confirmation"}</button>
      </div>
      <Note ok={emailMsg?.ok}>{emailMsg?.t}</Note>

      <SectionHead title="AI provider key" />
      <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: MONO, letterSpacing: "0.03em", marginBottom: 12, lineHeight: 1.5 }}>Enables photo &amp; link scanning. If set, your key is used; otherwise the server's shared key is used automatically.</div>
      <L>Provider</L>
      <div style={{ display: "flex", gap: 4, border: "1px solid var(--ink-line)", padding: 4, marginBottom: 12 }}>
        {[["anthropic", "Anthropic"], ["openai", "OpenAI"]].map(([id, lab]) => {
          const active = aiProvider === id;
          return (
            <button key={id} type="button" onClick={() => setAiProvider(id)} style={{ flex: 1, padding: "10px 4px", border: "none", cursor: "pointer", fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", background: active ? "var(--stamp)" : "transparent", color: active ? "#fff" : "var(--dim)" }}>{lab}</button>
          );
        })}
      </div>
      <L>API key (optional)</L>
      <div style={{ position: "relative" }}>
        <input type={showKey ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} placeholder={providerInfo[aiProvider].placeholder} className="cl-input" style={{ paddingRight: 64 }} />
        <button onClick={() => setShowKey((s) => !s)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--dim)", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", padding: "4px 8px" }}>{showKey ? "Hide" : "Show"}</button>
      </div>
      <div style={{ fontSize: 10, color: "var(--dim-2)", fontFamily: MONO, letterSpacing: "0.03em", marginTop: 6 }}>{providerInfo[aiProvider].helper}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={() => { setApiKey(""); setKey(""); setKeyMsg({ ok: true, t: "Removed." }); }} className="cl-ghost-btn" style={{ color: "var(--stamp)", borderColor: "var(--stamp)" }}>Remove key</button>
        <button onClick={saveKey} className="cl-stamp-btn">Save</button>
      </div>
      <Note ok={keyMsg?.ok}>{keyMsg?.t}</Note>

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--ink-line)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} className="cl-ghost-btn">Done</button>
      </div>
    </Sheet>
  );
}
