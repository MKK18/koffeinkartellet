export function navigate(to, { replace = false } = {}) {
  window.history[replace ? "replaceState" : "pushState"](null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// True when running as an installed (home-screen) app rather than in a browser
// tab. navigator.standalone is the legacy iOS Safari flag.
export function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}
