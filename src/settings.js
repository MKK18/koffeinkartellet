// AI provider settings (for photo + URL scanning). Stored in this browser only.
const KEY_STORAGE = "ai-api-key";
const PROVIDER_STORAGE = "ai-provider"; // "anthropic" | "openai"
const LEGACY_ANTHROPIC = "anthropic-api-key"; // backward compat

export const getApiKey = () => {
  try {
    return localStorage.getItem(KEY_STORAGE) || localStorage.getItem(LEGACY_ANTHROPIC) || "";
  } catch { return ""; }
};

export const setApiKey = (k) => {
  try {
    if (k) {
      localStorage.setItem(KEY_STORAGE, k);
      localStorage.removeItem(LEGACY_ANTHROPIC);
    } else {
      localStorage.removeItem(KEY_STORAGE);
      localStorage.removeItem(LEGACY_ANTHROPIC);
    }
  } catch { /* ignore */ }
};

// "anthropic" | "openai" — the personal provider, always selected.
// Old "global" stored as provider migrates to useGlobal=true + anthropic default.
export const getProvider = () => {
  try {
    const v = localStorage.getItem(PROVIDER_STORAGE);
    if (v === "global") {
      localStorage.setItem(PROVIDER_STORAGE, "anthropic");
      localStorage.setItem(USE_GLOBAL_STORAGE, "true");
      return "anthropic";
    }
    return v === "openai" ? "openai" : "anthropic";
  } catch { return "anthropic"; }
};

export const setProvider = (p) => {
  try { localStorage.setItem(PROVIDER_STORAGE, p === "openai" ? "openai" : "anthropic"); } catch { /* ignore */ }
};

// True if the user has a personal key set. The server's global key is always
// tried automatically as a fallback, so AI features may work even without one.
export const hasApiKey = () => !!getApiKey();
