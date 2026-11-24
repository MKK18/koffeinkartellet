import { useState, useRef } from "react";
import { getApiKey, setApiKey, getProvider, setProvider as writeProvider } from "./settings.js";
import { updateProfile, changePassword, requestEmailChange, currentUser } from "./pb.js";
import { useAuth } from "./auth.jsx";
import { compressImage } from "./lib.js";
import { Sheet, SectionHead, Avatar, Icon } from "./components.jsx";
import { CREW_COLORS, inkSafe } from "./marks.js";

function Note({ ok, children }) {
  if (!children) return null;
  return ok
    ? <div role="status" style={{ marginTop: 8, fontSize: 15, fontWeight: 600, color: "var(--buy)", display: "flex", gap: 6, alignItems: "center" }}><Icon name="check" size={18} />{children}</div>
    : <div className="slip" role="alert" style={{ marginTop: 10 }}><Icon name="alert" /><div>{children}</div></div>;
}
const L = ({ children, htmlFor }) => <label className="label" htmlFor={htmlFor}>{children}</label>;

export default function SettingsModal({ onClose }) {
  const { user, refresh } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [color, setColor] = useState(user?.color ? inkSafe(user.color) : CREW_COLORS[0]);
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

  const dirty = name !== (user?.name || "") || bio !== (user?.bio || "") || !!avatarBlob || removeAvatar || !!oldPw || !!newPw || !!newEmail;
  const row = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 };

  return (
    <Sheet title="Account and settings" onClose={onClose} maxWidth={520} dirty={dirty}>
      <p style={{ margin: "0 0 4px", fontSize: 15, color: "var(--ink-2)" }}>Signed in as {currentUser()?.email}</p>

      <SectionHead title="Profile" />
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        {avatarPreview
          ? <img src={avatarPreview} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%" }} />
          : <Avatar user={{ ...user, color, avatar: removeAvatar ? "" : user?.avatar }} size={64} />}
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => pickAvatar(e.target.files[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-line"><Icon name="image" />{user?.avatar || avatarPreview ? "Change photo" : "Add a photo"}</button>
        {(user?.avatar || avatarPreview) && !removeAvatar && (
          <button type="button" onClick={() => { setAvatarBlob(null); setAvatarPreview(""); setRemoveAvatar(true); }} className="btn btn-quiet">Remove</button>
        )}
      </div>
      {(avatarBlob || removeAvatar) && <p className="hint" style={{ marginTop: -8, marginBottom: 12 }}>Save your profile to keep this change.</p>}
      <div className="field"><L htmlFor="s-name">Name</L><input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <fieldset className="field" style={{ border: 0, padding: 0 }}>
        <legend className="label">Your colour on the table</legend>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CREW_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Colour ${c}`} aria-pressed={color === c}
              style={{ width: 40, height: 40, borderRadius: "50%", background: c, cursor: "pointer", border: 0, boxShadow: color === c ? "0 0 0 3px #fff, 0 0 0 5.5px var(--pencil)" : "none" }} />
          ))}
        </div>
      </fieldset>
      <div className="field"><L htmlFor="s-bio">About you</L><textarea id="s-bio" className="input" style={{ minHeight: 64 }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Optional, e.g. Washed Kenyans or nothing" /></div>
      <div style={row}><button type="button" onClick={saveProfile} disabled={busy === "profile"} className="btn btn-primary">{busy === "profile" ? "Saving…" : "Save profile"}</button></div>
      <Note ok={profileMsg?.ok}>{profileMsg?.t}</Note>

      <SectionHead title="Password" />
      <div className="field"><L htmlFor="s-old">Current password</L><input id="s-old" type="password" className="input" value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" /></div>
      <div className="field"><L htmlFor="s-new">New password</L><input id="s-new" type="password" className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" /><span className="hint">At least 8 characters.</span></div>
      <div style={row}><button type="button" onClick={savePassword} disabled={busy === "pw" || !oldPw || !newPw} className="btn btn-primary">{busy === "pw" ? "Saving…" : "Change password"}</button></div>
      <Note ok={pwMsg?.ok}>{pwMsg?.t}</Note>

      <SectionHead title="Email" />
      <div className="field"><L htmlFor="s-email">New email</L><input id="s-email" type="email" className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" /></div>
      <div style={row}><button type="button" onClick={saveEmail} disabled={busy === "email" || !newEmail} className="btn btn-primary">{busy === "email" ? "Sending…" : "Send confirmation"}</button></div>
      <Note ok={emailMsg?.ok}>{emailMsg?.t}</Note>

      <SectionHead title="Scanning key" />
      <p className="hint" style={{ marginTop: 0, marginBottom: 14 }}>Photo and link scanning use the server's shared key. Add your own only if you'd rather use it.</p>
      <div className="field">
        <span className="label">Provider</span>
        <div className="chips" style={{ padding: 0 }} role="radiogroup" aria-label="Provider">
          {[["anthropic", "Anthropic"], ["openai", "OpenAI"]].map(([id, lab]) => (
            <button key={id} type="button" role="radio" aria-checked={aiProvider === id} aria-pressed={aiProvider === id} className="chip" onClick={() => setAiProvider(id)}>{lab}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <L htmlFor="s-key">API key (optional)</L>
        <div style={{ position: "relative" }}>
          <input id="s-key" type={showKey ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} placeholder={providerInfo[aiProvider].placeholder} className="input" style={{ paddingRight: 76 }} autoComplete="off" />
          <button type="button" onClick={() => setShowKey((v) => !v)} className="btn btn-quiet" style={{ position: "absolute", right: 4, top: 4, minHeight: 40 }}>{showKey ? "Hide" : "Show"}</button>
        </div>
        <span className="hint">{providerInfo[aiProvider].helper}</span>
      </div>
      <div style={row}>
        {key && <button type="button" onClick={() => { setApiKey(""); setKey(""); setKeyMsg({ ok: true, t: "Key removed." }); }} className="btn btn-quiet">Remove key</button>}
        <button type="button" onClick={saveKey} className="btn btn-primary">Save</button>
      </div>
      <Note ok={keyMsg?.ok}>{keyMsg?.t}</Note>

      <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} className="btn btn-line">Done</button>
      </div>
    </Sheet>
  );
}
