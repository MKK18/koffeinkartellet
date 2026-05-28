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

export const getProvider = () => {
  try { return localStorage.getItem(PROVIDER_STORAGE) || "anthropic"; } catch { return "anthropic"; }
};

export const setProvider = (p) => {
  try {
    const v = (p === "openai" || p === "global") ? p : "anthropic";
    localStorage.setItem(PROVIDER_STORAGE, v);
  } catch { /* ignore */ }
};

// Global mode uses a server-side shared key — no per-user key needed.
export const hasApiKey = () => {
  if (getProvider() === "global") return true; // server holds it
  return !!getApiKey();
};
