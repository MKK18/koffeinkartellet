import { useState, useRef, useEffect } from "react";
import { getApiKey, setApiKey, getProvider, setProvider as writeProvider, getUseGlobal, setUseGlobal as writeUseGlobal } from "./settings.js";
import { updateProfile, changePassword, requestEmailChange, currentUser } from "./pb.js";
import { useAuth } from "./auth.jsx";
import { compressImage, aiStatus } from "./lib.js";
import { C, sans, serif, inputStyle, labelStyle, primaryBtn, ghostBtn, RATER_COLORS } from "./ui.jsx";
import { Sheet, SectionHead, Avatar } from "./components.jsx";

function Note({ ok, children }) {
  if (!children) return null;
  return <div style={{ marginTop: 8, fontSize: 13, fontFamily: sans, color: ok ? "#3a6040" : "#a05040" }}>{children}</div>;
}

export default function SettingsModal({ onClose }) {
  const { user, refresh } = useAuth();

  // profile
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

  // password
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState(null);

  // email
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState(null);

  // api key
  const [key, setKey] = useState(getApiKey());
  const [aiProvider, setAiProvider] = useState(getProvider());
  const [useGlobal, setUseGlobalLocal] = useState(getUseGlobal());
  const [showKey, setShowKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState(null);
  const [globalAvail, setGlobalAvail] = useState({ anthropic: false, openai: false });
  useEffect(() => { aiStatus().then(setGlobalAvail); }, []);
  const globalReady = globalAvail.anthropic || globalAvail.openai;
  const providerInfo = {
    anthropic: { placeholder: "sk-ant-...", helper: "Get a key at console.anthropic.com → API Keys." },
    openai:    { placeholder: "sk-...",     helper: "Get a key at platform.openai.com → API Keys." },
  };

  const [busy, setBusy] = useState("");

  const saveProfile = async () => {
    setBusy("profile"); setProfileMsg(null);
    try {
      let patch;
      if (avatarBlob || removeAvatar) {
        patch = new FormData();
        patch.append("name", name.trim());
        patch.append("color", color);
        patch.append("bio", bio.trim());
        patch.append("avatar", avatarBlob || "", avatarBlob ? "avatar.jpg" : undefined);
      } else {
        patch = { name: name.trim(), color, bio: bio.trim() };
      }
      await updateProfile(patch);
      refresh();
      setAvatarBlob(null); setAvatarPreview(""); setRemoveAvatar(false);
      setProfileMsg({ ok: true, t: "Profile saved." });
    } catch (e) { setProfileMsg({ ok: false, t: e?.message || "Couldn't save." }); }
    finally { setBusy(""); }
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
    try { await requestEmailChange(newEmail.trim()); setEmailMsg({ ok: true, t: `Confirmation sent to ${newEmail.trim()}. Click the link there to finish. (Email delivery goes live after deployment.)` }); setNewEmail(""); }
    catch (e) { setEmailMsg({ ok: false, t: e?.message || "Couldn't request the change." }); }
    finally { setBusy(""); }
  };

  const saveKey = () => {
    setApiKey(key.trim());
    writeProvider(aiProvider);
    writeUseGlobal(useGlobal && (globalAvail.anthropic || globalAvail.openai));
    setKeyMsg({ ok: true, t: "Saved." });
  };

  return (
    <Sheet onClose={onClose} maxWidth={480}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontFamily: serif, fontSize: 22, color: C.ink }}>Account &amp; settings</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 26, color: C.muted, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, fontFamily: sans }}>Signed in as {currentUser()?.email}</div>

      {/* Profile */}
      <SectionHead title="Profile" />
      <label style={labelStyle}>Photo</label>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        {avatarPreview
          ? <img src={avatarPreview} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
          : <Avatar user={{ ...user, color, avatar: removeAvatar ? "" : user?.avatar }} size={56} />}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickAvatar(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} style={{ ...ghostBtn, padding: "7px 12px", fontSize: 12 }}>Upload photo</button>
        {(user?.avatar || avatarPreview) && (
          <button onClick={() => { setAvatarBlob(null); setAvatarPreview(""); setRemoveAvatar(true); }} style={{ ...ghostBtn, padding: "7px 12px", fontSize: 12, color: "#b07060", borderColor: "#e0c0b0" }}>Remove</button>
        )}
      </div>
      <label style={labelStyle}>Display name</label>
      <input style={{ ...inputStyle, marginBottom: 12 }} value={name} onChange={(e) => setName(e.target.value)} />
      <label style={labelStyle}>Color</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {RATER_COLORS.map((c) => (
          <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid #2c1a0e" : "3px solid transparent" }} />
        ))}
      </div>
      <label style={labelStyle}>Bio</label>
      <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="optional" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={saveProfile} disabled={busy === "profile"} style={primaryBtn(busy !== "profile")}>{busy === "profile" ? "Saving…" : "Save profile"}</button>
      </div>
      <Note ok={profileMsg?.ok}>{profileMsg?.t}</Note>

      {/* Password */}
      <SectionHead title="Change password" />
      <label style={labelStyle}>Current password</label>
      <input type="password" style={{ ...inputStyle, marginBottom: 12 }} value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" />
      <label style={labelStyle}>New password</label>
      <input type="password" style={inputStyle} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={savePassword} disabled={busy === "pw" || !oldPw || !newPw} style={primaryBtn(busy !== "pw" && !!oldPw && !!newPw)}>{busy === "pw" ? "Saving…" : "Change password"}</button>
      </div>
      <Note ok={pwMsg?.ok}>{pwMsg?.t}</Note>

      {/* Email */}
      <SectionHead title="Change email" />
      <label style={labelStyle}>New email</label>
      <input type="email" style={inputStyle} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={saveEmail} disabled={busy === "email" || !newEmail} style={primaryBtn(busy !== "email" && !!newEmail)}>{busy === "email" ? "Sending…" : "Send confirmation"}</button>
      </div>
      <Note ok={emailMsg?.ok}>{emailMsg?.t}</Note>

      {/* AI provider key */}
      <SectionHead title="AI provider key" />
      <div style={{ fontSize: 12, color: C.muted, fontFamily: sans, marginBottom: 10 }}>Enables photo &amp; link scanning. Stored in this browser only.</div>

      {/* Use shared server key (with fallback to personal) */}
      <label style={{ ...labelStyle, marginBottom: 8 }}>Shared (global) key</label>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: C.tint, border: `1px solid ${C.borderSoft}`, borderRadius: 12, cursor: globalReady ? "pointer" : "not-allowed", marginBottom: 12, opacity: globalReady ? 1 : 0.6 }}>
        <input type="checkbox" checked={useGlobal && globalReady} disabled={!globalReady} onChange={(e) => setUseGlobalLocal(e.target.checked)} style={{ marginTop: 2 }} />
        <div style={{ flex: 1, fontFamily: sans, fontSize: 13, color: C.ink, lineHeight: 1.5 }}>
          <strong>Use the shared key on the server when available</strong>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            {globalReady
              ? <>Server has{globalAvail.anthropic && <strong> Anthropic</strong>}{globalAvail.anthropic && globalAvail.openai && " +"}{globalAvail.openai && <strong> OpenAI</strong>} configured. Your personal key below is used as a fallback if the shared one fails.</>
              : <>No shared key configured on the server yet. Set <code>ANTHROPIC_API_KEY</code> or <code>OPENAI_API_KEY</code> on Railway to enable.</>}
          </div>
        </div>
      </label>

      {/* Personal provider + key (always present, used directly or as fallback) */}
      <label style={labelStyle}>Personal provider</label>
      <div style={{ display: "flex", gap: 6, background: C.tint, border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: 4, marginBottom: 12 }}>
        {[["anthropic", "Anthropic"], ["openai", "OpenAI"]].map(([id, label]) => {
          const active = aiProvider === id;
          return (
            <button key={id} type="button" onClick={() => setAiProvider(id)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer",
              fontFamily: sans, fontSize: 13, fontWeight: active ? 600 : 500,
              background: active ? C.card : "transparent", color: active ? C.brown : C.muted,
              boxShadow: active ? "0 1px 4px rgba(100,70,40,0.12)" : "none",
            }}>{label}</button>
          );
        })}
      </div>

      <label style={labelStyle}>Personal API key {useGlobal && globalReady && <span style={{ textTransform: "none", color: C.faint, letterSpacing: 0 }}>(fallback)</span>}</label>
      <div style={{ position: "relative" }}>
        <input type={showKey ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} placeholder={providerInfo[aiProvider].placeholder} style={{ ...inputStyle, paddingRight: 64 }} />
        <button onClick={() => setShowKey((s) => !s)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, fontFamily: sans, fontSize: 12, cursor: "pointer", padding: "4px 8px" }}>{showKey ? "Hide" : "Show"}</button>
      </div>
      <div style={{ fontSize: 11, color: C.faint, fontFamily: sans, marginTop: 6 }}>{providerInfo[aiProvider].helper}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={() => { setApiKey(""); setKey(""); setKeyMsg({ ok: true, t: "Removed." }); }} style={{ ...ghostBtn, color: "#b07060", borderColor: "#e0c0b0" }}>Remove key</button>
        <button onClick={saveKey} style={primaryBtn(true)}>Save</button>
      </div>
      <Note ok={keyMsg?.ok}>{keyMsg?.t}</Note>

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #ecddd0", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={ghostBtn}>Done</button>
      </div>
    </Sheet>
  );
}
