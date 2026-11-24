import { useEffect, useState } from "react";


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

const CupMark = () => <span className="bowl" aria-hidden="true" style={{ width: 34, height: 34, display: "inline-block" }} />;

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

  if (evt) {
    return (
      <div className="install" role="region" aria-label="Install the app">
        <CupMark />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="install-t">Add to your home screen</div>
          <div className="install-b">Opens full-screen, one tap from the camera.</div>
        </div>
        <button type="button" onClick={later} className="btn btn-quiet">Later</button>
        <button type="button" onClick={install} className="btn btn-primary">Install</button>
      </div>
    );
  }

  return (
    <div className="install" role="region" aria-label="Install the app">
      <CupMark />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="install-t">Add to your home screen</div>
        <div className="install-b">In Safari, tap Share, then <b>Add to Home Screen</b>.</div>
      </div>
      <button type="button" onClick={later} className="btn btn-quiet">Got it</button>
    </div>
  );
}
