import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./Root.jsx";
import "./ledger.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// Register the service worker (production only — Vite dev replaces the bundle
// every reload, which fights the SW's caching). The SW enables PWA install +
// fast subsequent loads.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // When a new SW activates and takes control of this page, reload once so
  // the freshly-deployed code is actually running. Without this, users keep
  // seeing the previous bundle until they reload manually.
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => { /* ignore */ });
  });
}
