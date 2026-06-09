import { useEffect, useState } from "react";
import { C, sans, primaryBtn, ghostBtn } from "./ui.jsx";

const DISMISSED_KEY = "install-banner-dismissed-until";
const HIDE_FOR_DAYS = 7;

const isStandalone = () =>
  (typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true));

const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPad on iPadOS 13+ reports as Mac with touch; detect that too.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
};

// Two banners in one component:
// - Android Chrome (and other browsers that fire `beforeinstallprompt`):
//   intercept the event, show a banner with an [Install] button.
// - iOS Safari (no `beforeinstallprompt`): show an instructional banner
//   pointing at Share → Add to Home Screen.
// Dismissing either hides for a week. Hidden entirely once installed.
export default function InstallPrompt() {
  const [evt, setEvt] = useState(null);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const until = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (Date.now() < until) return;

    // Android / desktop Chrome path
    const handler = (e) => { e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    const onInstalled = () => { setEvt(null); setShowIOS(false); };
    window.addEventListener("appinstalled", onInstalled);

    // iOS path — no event, just detect + delay so it doesn't ambush first paint
    let iosTimer;
    if (isIOS()) iosTimer = setTimeout(() => setShowIOS(true), 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const later = () => {
    const ms = HIDE_FOR_DAYS * 24 * 60 * 60 * 1000;
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now() + ms)); } catch { /* ignore */ }
    setEvt(null); setShowIOS(false);
  };

  const install = async () => {
    if (!evt) return;
    try { evt.prompt(); await evt.userChoice; } catch { /* ignore */ }
    setEvt(null);
  };

  if (!evt && !showIOS) return null;

  const baseStyle = {
    position: "fixed", left: 12, right: 12,
    bottom: "calc(86px + env(safe-area-inset-bottom))",
    maxWidth: 480, margin: "0 auto", zIndex: 50,
    background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 16,
    padding: "12px 14px", boxShadow: "0 10px 30px rgba(60,20,0,0.18)",
    display: "flex", alignItems: "center", gap: 12, fontFamily: sans,
  };

  if (evt) {
    return (
      <div style={baseStyle}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>☕</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>Add to home screen</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Open Koffeinkollektivet like an app — full-screen, one tap.</div>
        </div>
        <button onClick={later} style={{ ...ghostBtn, padding: "8px 12px", fontSize: 12 }}>Later</button>
        <button onClick={install} style={{ ...primaryBtn(true), padding: "8px 14px", fontSize: 13 }}>Install</button>
      </div>
    );
  }

  // iOS instructional banner — there's no API to trigger Add-to-Home-Screen.
  return (
    <div style={{ ...baseStyle, alignItems: "flex-start" }}>
      <span style={{ fontSize: 28, lineHeight: 1 }}>☕</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>Add to home screen</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>
          In Safari: tap <span aria-label="share" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 4, background: C.tint, border: `1px solid ${C.border}`, fontSize: 11, verticalAlign: "middle" }}>􀈂</span> Share, then <strong>Add to Home Screen</strong>.
        </div>
      </div>
      <button onClick={later} style={{ ...ghostBtn, padding: "8px 12px", fontSize: 12, alignSelf: "center" }}>Got it</button>
    </div>
  );
}
