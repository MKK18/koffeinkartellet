import { useState } from "react";
import { getApiKey, setApiKey } from "./settings.js";
import { C, sans, serif, inputStyle, labelStyle, primaryBtn, ghostBtn } from "./ui.jsx";
import { Sheet } from "./components.jsx";

export default function SettingsModal({ onClose }) {
  const [key, setKey] = useState(getApiKey());
  const [show, setShow] = useState(false);

  return (
    <Sheet onClose={onClose} maxWidth={460}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontFamily: serif, fontSize: 22, color: C.ink }}>Settings</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 26, color: C.muted, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
      <p style={{ fontSize: 13, color: "#5a4030", fontFamily: sans, lineHeight: 1.55, marginBottom: 16 }}>
        Paste your <strong>Anthropic API key</strong> to enable AI package scanning. It stays in this browser only and is sent only to Anthropic when you scan a photo.
      </p>
      <label style={labelStyle}>API Key</label>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input type={show ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..." style={{ ...inputStyle, paddingRight: 64 }} />
        <button onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, fontFamily: sans, fontSize: 12, cursor: "pointer", padding: "4px 8px" }}>{show ? "Hide" : "Show"}</button>
      </div>
      <p style={{ fontSize: 12, color: C.faint, fontFamily: sans, marginBottom: 20 }}>
        Get a key at console.anthropic.com → API Keys.
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        <button onClick={() => { setApiKey(""); setKey(""); }} style={{ ...ghostBtn, color: "#b07060", borderColor: "#e0c0b0" }}>Remove key</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={() => { setApiKey(key.trim()); onClose(); }} style={primaryBtn(true)}>Save</button>
        </div>
      </div>
    </Sheet>
  );
}
