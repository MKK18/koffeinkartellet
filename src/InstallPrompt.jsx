import { useEffect, useState } from "react";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";

const DISMISSED_KEY = "install-banner-dismissed-until";
const HIDE_FOR_DAYS = 7;

const isStandalone = () =>
  (typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true));

const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
};

const CupMark = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--stamp)" strokeWidth="1.5" style={{ flexShrink: 0 }}>
    <path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 10h2a2 2 0 0 1 0 4h-2" />
  </svg>
);

export default function InstallPrompt() {
  const [evt, setEvt] = useState(null);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const until = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (Date.now() < until) return;

    const handler = (e) => { e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    const onInstalled = () => { setEvt(null); setShowIOS(false); };
    window.addEventListener("appinstalled", onInstalled);

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
    background: "var(--ink-2)", border: "1px solid var(--ink-line)",
    padding: "12px 14px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", gap: 12,
  };
  const title = { fontFamily: DISPLAY, fontSize: 16, textTransform: "uppercase", color: "var(--bone)", lineHeight: 1 };
  const body = { fontSize: 11, color: "var(--dim)", fontFamily: MONO, letterSpacing: "0.03em", marginTop: 4, lineHeight: 1.5 };

  if (evt) {
    return (
      <div style={baseStyle}>
        <CupMark />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={title}>Add to home screen</div>
          <div style={body}>Open Koffeinkartellet like an app — full-screen, one tap.</div>
        </div>
        <button onClick={later} className="cl-ghost-btn" style={{ padding: "9px 12px" }}>Later</button>
        <button onClick={install} className="cl-stamp-btn" style={{ padding: "9px 14px" }}>Install</button>
      </div>
    );
  }

  return (
    <div style={{ ...baseStyle, alignItems: "flex-start" }}>
      <CupMark />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={title}>Add to home screen</div>
        <div style={body}>
          In Safari: tap <span aria-label="share" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, background: "var(--ink)", border: "1px solid var(--ink-line)", fontSize: 11, verticalAlign: "middle" }}>􀈂</span> Share, then <b style={{ color: "var(--manila)" }}>Add to Home Screen</b>.
        </div>
      </div>
      <button onClick={later} className="cl-ghost-btn" style={{ padding: "9px 12px", alignSelf: "center" }}>Got it</button>
    </div>
  );
}
