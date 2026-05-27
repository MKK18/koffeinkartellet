// localStorage shim that mimics the window.storage shape the app was written against.
// get(key) -> { value } | null  ;  set(key, value) -> void
const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? null : { value };
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      // Quota exceeded is the realistic failure here (base64 images can be big).
      console.error("Storage write failed:", err);
      alert(
        "Couldn't save — your browser storage is full. " +
        "Try removing photos from older beans, or export and clear the journal."
      );
      throw err;
    }
  },
};

if (typeof window !== "undefined") window.storage = storage;

export default storage;
