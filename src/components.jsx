import { useState, useEffect, useRef } from "react";
import { C, sans, serif } from "./ui.jsx";
import { useIsWide } from "./useMediaQuery.js";
import { COFFEE_COUNTRIES, FLAVOR_CATEGORIES, TAG_EMOJI, ROAST_INTENSITY } from "./lib.js";
import { avatarUrl } from "./pb.js";

// Round avatar: shows the uploaded photo if there is one, else a colored circle
// with the person's first initial.
export function Avatar({ user, size = 32, onClick, ring }) {
  const url = avatarUrl(user);
  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();
  const base = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    border: ring ? `2px solid ${ring}` : "none",
    cursor: onClick ? "pointer" : "default", display: "block",
  };
  if (url) {
    return <img src={url} alt={user?.name || ""} onClick={onClick} style={{ ...base, objectFit: "cover" }} />;
  }
  return (
    <div onClick={onClick} title={user?.name || ""} style={{
      ...base, background: user?.color || C.brown, display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff8f0", fontFamily: serif, fontWeight: 700,
      fontSize: Math.round(size * 0.46), lineHeight: 1, userSelect: "none",
    }}>{initial}</div>
  );
}

export function Pill({ children, green, awaiting, color }) {
  if (awaiting) {
    return (
      <span style={{ fontSize: 11, padding: "1px 9px", borderRadius: 12, fontFamily: sans, background: "transparent", color, border: `1px dashed ${color}`, letterSpacing: "0.02em" }}>{children}</span>
    );
  }
  return (
    <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 12, fontFamily: sans, background: green ? "#e8f0e8" : "#f0e6da", color: green ? "#3a6040" : "#6b4226" }}>{children}</span>
  );
}

export function Tag({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "8px 14px", borderRadius: 20, fontSize: 13, fontFamily: sans, letterSpacing: "0.04em",
      border: active ? `1.5px solid ${C.brown}` : `1.5px solid #d4c5b5`,
      background: active ? C.brown : "transparent", color: active ? "#fff8f0" : C.muted,
      cursor: "pointer", transition: "all 0.15s ease",
    }}>{label}</button>
  );
}

export function SectionHead({ title }) {
  return <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #ecddd0", marginTop: 20 }}>{title}</div>;
}

export function Spinner() {
  return (
    <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #e0d0c0", borderTopColor: C.brown, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

// Responsive overlay: full-screen sheet on phones, centered modal on desktop.
export function Sheet({ children, onClose, maxWidth = 580 }) {
  const wide = useIsWide();
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,10,5,0.6)", zIndex: 100,
        display: "flex", alignItems: wide ? "center" : "flex-end", justifyContent: "center",
        padding: wide ? 16 : 0,
      }}
    >
      <div style={{
        background: C.card,
        borderRadius: wide ? 20 : "20px 20px 0 0",
        padding: wide ? 28 : "20px 18px calc(20px + env(safe-area-inset-bottom))",
        width: "100%", maxWidth: wide ? maxWidth : "100%",
        maxHeight: wide ? "92vh" : "94vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(60,20,0,0.25)",
      }}>
        {children}
      </div>
    </div>
  );
}

// Country autocomplete (free text allowed) — ported from the original.
export function CountryCombobox({ value, onChange, placeholder, style }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef();
  useEffect(() => {
    const onDocDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const q = (value || "").toLowerCase().trim();
  const filtered = q ? COFFEE_COUNTRIES.filter((c) => c.toLowerCase().includes(q)) : COFFEE_COUNTRIES;
  const exactMatch = filtered.length === 1 && filtered[0].toLowerCase() === q;

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <input
        type="text" value={value || ""} placeholder={placeholder || ""}
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); onChange(filtered[0]); setOpen(false); }
        }}
        style={style}
      />
      {open && filtered.length > 0 && !exactMatch && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, maxHeight: 220, overflowY: "auto", zIndex: 20, boxShadow: "0 8px 20px rgba(100,70,40,0.14)" }}>
          {filtered.map((c) => (
            <div key={c}
              onMouseDown={(e) => { e.preventDefault(); onChange(c); setOpen(false); }}
              style={{ padding: "10px 14px", fontSize: 14, fontFamily: sans, color: C.ink, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fbeee4")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Category-grouped flavour picker (Coffi-inspired). Replaces the flat tag list.
export function FlavorPicker({ value = [], onChange }) {
  const toggle = (t) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  return (
    <div>
      {value.length > 0 && (
        <div style={{ marginBottom: 16, padding: 12, background: C.tint, borderRadius: 14, border: `1px solid ${C.borderSoft}` }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: sans, marginBottom: 8, letterSpacing: "0.06em" }}>SELECTED ({value.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {value.map((t) => (
              <button key={t} type="button" onClick={() => toggle(t)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 999, border: "none", background: C.brown, color: "#fff8f0",
                fontFamily: sans, fontSize: 13, cursor: "pointer",
              }}>
                <span>{TAG_EMOJI[t] || ""}</span>{t}<span style={{ opacity: 0.75, marginLeft: 2 }}>×</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {FLAVOR_CATEGORIES.map((cat) => (
        <div key={cat.name} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, display: "inline-block" }} />
            <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.ink }}>{cat.name}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {cat.tags.map((t) => {
              const active = value.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggle(t)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                  border: `1.5px solid ${active ? cat.color : C.border}`,
                  background: active ? cat.color : "transparent",
                  color: active ? "#fff8f0" : C.muted,
                  fontFamily: sans, fontSize: 13, transition: "all 0.15s",
                }}>
                  <span>{TAG_EMOJI[t] || ""}</span>{t}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Filled-square scale (1-5).
const SCALE_LABEL = ["—", "Low", "Med-Low", "Medium", "Med-High", "High"];
function ScaleBars({ value, color = C.ink }) {
  const v = Math.round(Number(value) || 0);
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ width: 18, height: 18, borderRadius: 3, background: i <= v ? color : C.borderSoft, display: "inline-block" }} />
      ))}
    </div>
  );
}

// Coffi-style flavour profile: roast (from text), acidity, body, sweetness.
export function FlavorProfile({ roast, acidity, body, sweetness }) {
  const roastVal = ROAST_INTENSITY[roast] || 0;
  const rows = [
    { label: "Roast", val: roastVal, text: roast || "—" },
    { label: "Acidity", val: Number(acidity) || 0, text: SCALE_LABEL[Number(acidity) || 0] },
    { label: "Body", val: Number(body) || 0, text: SCALE_LABEL[Number(body) || 0] },
    { label: "Sweetness", val: Number(sweetness) || 0, text: SCALE_LABEL[Number(sweetness) || 0] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.muted, marginBottom: 10 }}>{r.label}</div>
          <ScaleBars value={r.val} />
          <div style={{ fontFamily: sans, fontStyle: "italic", fontSize: 13, color: C.ink, marginTop: 10 }}>{r.text}</div>
        </div>
      ))}
    </div>
  );
}

// Small slider used inside the form (acidity/body/sweetness).
export function ScaleSlider({ label, value, onChange, color = C.brown }) {
  const v = Number(value) || 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, fontFamily: sans }}>{label}</span>
        <span style={{ fontFamily: sans, fontSize: 13, color: C.ink }}>{v > 0 ? SCALE_LABEL[v] : "—"}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => onChange(i === v ? 0 : i)} style={{
            flex: 1, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
            background: i <= v ? color : C.borderSoft,
          }} />
        ))}
      </div>
    </div>
  );
}

// Small circular score badge.
export function ScorePuck({ score, label, color = C.brown, size = 44 }) {
  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <div style={{ fontSize: size * 0.5, fontFamily: serif, fontWeight: 700, color: score ? color : "#d4c5b5", lineHeight: 1 }}>
        {score ? Number(score).toFixed(1) : "—"}
      </div>
      {label && <div style={{ fontSize: 9, color, opacity: 0.75, fontFamily: sans, letterSpacing: "0.1em", marginTop: 2 }}>{label}</div>}
    </div>
  );
}
