// Shared visual tokens for the coffee aesthetic (Playfair Display + DM Sans, warm browns).
export const C = {
  bg: "#fdf6ee",
  card: "#fff8f0",
  ink: "#2c1a0e",
  brown: "#8B5E3C",
  muted: "#8a7060",
  faint: "#b89880",
  border: "#e0d0c0",
  borderSoft: "#e8ddd0",
  tint: "#fdf4ee",
  kiki: "#C0704A",
  madsy: "#4A7A90",
};

export const serif = "'Playfair Display', serif";
export const sans = "'DM Sans', sans-serif";

export const RATER_COLORS = ["#C0704A", "#4A7A90", "#5E8C61", "#8B5E3C", "#9A6FB0", "#C99846"];

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
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  );
}
