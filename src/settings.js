// Anthropic API key for the photo-scan feature. Stored in this browser only,
// never sent anywhere except directly to Anthropic when scanning a package.
const API_KEY_STORAGE = "anthropic-api-key";

export const getApiKey = () => {
  try { return localStorage.getItem(API_KEY_STORAGE) || ""; } catch { return ""; }
};

export const setApiKey = (k) => {
  try {
    k ? localStorage.setItem(API_KEY_STORAGE, k) : localStorage.removeItem(API_KEY_STORAGE);
  } catch { /* ignore */ }
};

export const hasApiKey = () => !!getApiKey();
