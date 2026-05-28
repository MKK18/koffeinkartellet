import { useEffect, useState } from "react";
import { C, sans, primaryBtn, ghostBtn } from "./ui.jsx";

const DISMISSED_KEY = "install-banner-dismissed-until";
const HIDE_FOR_DAYS = 7;

// Listens for the Android Chrome `beforeinstallprompt` event and surfaces a
// small banner asking to add the app to the home screen. Dismissing hides it
// for a week. Doesn't render on iOS (no `beforeinstallprompt` there) or once
// the app is already running in standalone mode.
export default function InstallPrompt() {
  const [evt, setEvt] = useState(null);

  useEffect(() => {
    // already installed?
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;
    const until = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (Date.now() < until) return;

    const handler = (e) => { e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    const onInstalled = () => setEvt(null);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!evt) return null;

  const install = async () => {
    try { evt.prompt(); await evt.userChoice; } catch { /* ignore */ }
    setEvt(null);
  };
  const later = () => {
    const ms = HIDE_FOR_DAYS * 24 * 60 * 60 * 1000;
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now() + ms)); } catch { /* ignore */ }
    setEvt(null);
  };

  return (
    <div style={{
      position: "fixed", left: 12, right: 12,
      bottom: "calc(86px + env(safe-area-inset-bottom))",
      maxWidth: 480, margin: "0 auto", zIndex: 50,
      background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 16,
      padding: "12px 14px", boxShadow: "0 10px 30px rgba(60,20,0,0.18)",
      display: "flex", alignItems: "center", gap: 12, fontFamily: sans,
    }}>
      <span style={{ fontSize: 28, lineHeight: 1 }}>☕</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>Add to home screen</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Open Koffeinkartellet like an app — full-screen, one tap.</div>
      </div>
      <button onClick={later} style={{ ...ghostBtn, padding: "8px 12px", fontSize: 12 }}>Later</button>
      <button onClick={install} style={{ ...primaryBtn(true), padding: "8px 14px", fontSize: 13 }}>Install</button>
    </div>
  );
}
