// AI provider settings (for photo + URL scanning). Stored in this browser only.
const KEY_STORAGE = "ai-api-key";
const PROVIDER_STORAGE = "ai-provider"; // "anthropic" | "openai"
const USE_GLOBAL_STORAGE = "ai-use-global";
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

// Independent "prefer the server's shared key when it's available" preference.
// If the global call fails for any reason, the app falls back to the personal key.
export const getUseGlobal = () => {
  try { return localStorage.getItem(USE_GLOBAL_STORAGE) === "true"; } catch { return false; }
};
export const setUseGlobal = (b) => {
  try { localStorage.setItem(USE_GLOBAL_STORAGE, b ? "true" : "false"); } catch { /* ignore */ }
};

// True if AI features will work — either a personal key, or "use global" enabled.
// (We can't know from here whether the server actually has a global key, but the
// scan path falls back to personal, so this is a best-effort check.)
export const hasApiKey = () => getUseGlobal() || !!getApiKey();
