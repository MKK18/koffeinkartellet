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
// Editorial accent serif — scores, pull quotes, numerals. Pairs with Archivo
// caps the same way it does on the landing page.
export const fraunces = "'Fraunces', Georgia, serif";

// Per-person identity colors (kept distinct from the brand orange).
export const RATER_COLORS = ["#C0704A", "#4A7A90", "#5E8C61", "#9A6FB0", "#C99846", "#6B4226"];

export const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${C.border}`,
  background: C.card, fontSize: 14, fontFamily: sans, color: C.ink, outline: "none",
  boxSizing: "border-box",
};

export const labelStyle = {
  fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted,
  fontFamily: sans, marginBottom: 6, display: "block",
};

// Pill-shaped buttons — fully rounded, generous padding (Coffi-inspired airy feel).
export const primaryBtn = (enabled = true) => ({
  padding: "12px 24px", borderRadius: 999, border: "none",
  background: enabled ? C.brown : "#d4c5b5", color: "#fff8f0",
  fontFamily: sans, fontSize: 14, fontWeight: 600,
  cursor: enabled ? "pointer" : "not-allowed",
});

export const ghostBtn = {
  padding: "10px 20px", borderRadius: 999, border: `1.5px solid ${C.border}`,
  background: "transparent", color: C.muted, fontFamily: sans, fontSize: 13, cursor: "pointer",
};

// A dark pill, for emphasis (e.g. active segmented-control tab) — Coffi uses this.
export const darkPillBtn = {
  padding: "10px 20px", borderRadius: 999, border: "none",
  background: C.ink, color: "#fff8f0",
  fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer",
};

export function FontLink() {
  return (
    <link
      href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500&family=DM+Sans:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=Martian+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  );
}
