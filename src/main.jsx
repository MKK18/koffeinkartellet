import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./Root.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// Register the service worker (production only — Vite dev replaces the bundle
// every reload, which fights the SW's caching). The SW enables PWA install +
// fast subsequent loads.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => { /* ignore */ });
  });
}
