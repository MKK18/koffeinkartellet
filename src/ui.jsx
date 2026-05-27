// Shared visual tokens. Coffelo-inspired: warm paper, espresso ink, punchy
// burnt-orange accent, heavy display sans for headings.
export const C = {
  bg: "#f6efe2",        // warm oat paper
  card: "#fffaf2",
  ink: "#2a1a10",       // espresso (headlines, dark header)
  brown: "#E2611D",     // brand accent (now a vivid burnt orange) — drives buttons/scores/highlights
  accent: "#E2611D",    // alias for clarity
  accentDark: "#C2521A",// hover/pressed
  cocoa: "#8B5E3C",     // soft brown, for occasional earthy details
  muted: "#8a7060",
  faint: "#b89880",
  border: "#e0d0c0",
  borderSoft: "#e8ddd0",
  tint: "#fbf2e8",
  kiki: "#C0704A",
  madsy: "#4A7A90",
};

// "serif" kept as the token name for zero churn, but it now points at a heavy
// display sans (Coffelo-style chunky headings).
export const serif = "'Archivo', system-ui, sans-serif";
export const sans = "'DM Sans', sans-serif";

// Per-person identity colors (kept distinct from the brand orange).
export const RATER_COLORS = ["#C0704A", "#4A7A90", "#5E8C61", "#9A6FB0", "#C99846", "#6B4226"];

export const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`,
  background: C.card, fontSize: 14, fontFamily: sans, color: C.ink, outline: "none",
  boxSizing: "border-box",
};

export const labelStyle = {
  fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted,
  fontFamily: sans, marginBottom: 6, display: "block",
};

export const primaryBtn = (enabled = true) => ({
  padding: "11px 22px", borderRadius: 10, border: "none",
  background: enabled ? C.brown : "#d4c5b5", color: "#fff8f0",
  fontFamily: sans, fontSize: 14, fontWeight: 600,
  cursor: enabled ? "pointer" : "not-allowed",
});

export const ghostBtn = {
  padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${C.border}`,
  background: "transparent", color: C.muted, fontFamily: sans, fontSize: 13, cursor: "pointer",
};

export function FontLink() {
  return (
    <link
      href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  );
}
