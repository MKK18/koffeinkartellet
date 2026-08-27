import { useState, useEffect, useRef } from "react";
import { useIsWide } from "./useMediaQuery.js";
import { COFFEE_COUNTRIES, FLAVOR_CATEGORIES, TAG_EMOJI, ROAST_INTENSITY } from "./lib.js";
import { avatarUrl } from "./pb.js";

// Contraband Ledger primitives. Every screen renders inside AppShell's `.cl`
// container, so var(--ink)/var(--font-mono)/etc. resolve in inline styles here.
const DISPLAY = "var(--font-display)";
const MONO = "var(--font-mono)";
const BODY = "var(--font-body)";

// Avatar: uploaded photo, else a colored square (the member's stamp color) with
// their initial — squares, not circles, to sit in the ledger world.
export function Avatar({ user, size = 32, onClick, ring }) {
  const url = avatarUrl(user);
  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();
  const base = {
    width: size, height: size, flexShrink: 0,
    border: ring ? `2px solid ${ring}` : "1px solid var(--ink-line)",
    cursor: onClick ? "pointer" : "default", display: "block",
  };
  if (url) {
    return <img src={url} alt={user?.name || ""} onClick={onClick} style={{ ...base, objectFit: "cover" }} />;
  }
  return (
    <div onClick={onClick} title={user?.name || ""} style={{
      ...base, background: user?.color || "var(--stamp)", display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff", fontFamily: DISPLAY,
      fontSize: Math.round(size * 0.5), lineHeight: 1, userSelect: "none",
    }}>{initial}</div>
  );
}

// Repurposed empty-state motif: a stamped "void" frame (the ledger world refuses
// the old coffee-ring). Children render centered inside the stamp.
export function CoffeeRing({ size = 220, children, style }) {
  return (
    <div aria-hidden={!children} style={{
      position: "relative", width: size, height: size * 0.62, margin: "0 auto",
      display: "flex", alignItems: "center", justifyContent: "center", ...style,
    }}>
      <div style={{
        position: "absolute", inset: 0, transform: "rotate(-4deg)", borderRadius: 6,
        border: "2.5px solid var(--ink-line)",
      }} />
      <div style={{
        position: "absolute", inset: "8px 6px", transform: "rotate(-4deg)", borderRadius: 5,
        border: "1px dashed var(--dim-2)",
      }} />
      {children && <div style={{ position: "relative", textAlign: "center", padding: 24, color: "var(--dim)", fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>{children}</div>}
    </div>
  );
}

export function Pill({ children, green, awaiting, color }) {
  const common = { fontSize: 10, padding: "3px 9px", fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-block" };
  if (awaiting) {
    return <span style={{ ...common, background: "transparent", color: color || "var(--dim)", border: `1px dashed ${color || "var(--dim)"}` }}>{children}</span>;
  }
  return (
    <span style={{ ...common, background: "transparent", color: green ? "var(--ok)" : "var(--manila)", border: `1px solid ${green ? "var(--ok)" : "var(--ink-line)"}` }}>{children}</span>
  );
}

export function Tag({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "8px 14px", fontSize: 11, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase",
      border: active ? "1px solid var(--stamp)" : "1px solid var(--ink-line)",
      background: active ? "var(--stamp)" : "transparent", color: active ? "#fff" : "var(--manila)",
      cursor: "pointer", transition: "all 0.15s ease",
    }}>{label}</button>
  );
}

export function SectionHead({ title }) {
  return <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--dim)", fontFamily: MONO, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--ink-line)", marginTop: 22 }}>{title}</div>;
}

export function Spinner() {
  return (
    <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--ink-line)", borderTopColor: "var(--stamp)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

// Responsive overlay: full-screen sheet on phones, centered modal on desktop.
export const SHEET_PAD_X_WIDE = 28;
export const SHEET_PAD_X_NARROW = 18;
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
        position: "fixed", inset: 0, background: "rgba(6,4,3,0.72)", zIndex: 100,
        display: "flex", alignItems: wide ? "center" : "flex-end", justifyContent: "center",
        padding: wide ? 16 : 0, backdropFilter: "blur(2px)",
      }}
    >
      <div className="sheet-scroll" style={{
        background: "var(--ink-2)",
        border: "1px solid var(--ink-line)",
        borderRadius: wide ? 6 : "6px 6px 0 0",
        color: "var(--bone)", fontFamily: BODY,
        padding: wide
          ? `28px ${SHEET_PAD_X_WIDE}px`
          : `20px ${SHEET_PAD_X_NARROW}px calc(20px + env(safe-area-inset-bottom))`,
        width: "100%", maxWidth: wide ? maxWidth : "100%",
        maxHeight: wide ? "92vh" : "94vh",
        overflowX: "hidden", overflowY: "auto",
        boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
        scrollbarWidth: "thin", scrollbarColor: "var(--ink-line) transparent",
        scrollbarGutter: wide ? "stable" : "auto",
      }}>
        <style>{`
          .sheet-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
          .sheet-scroll::-webkit-scrollbar-track { background: transparent; margin: 12px 0; }
          .sheet-scroll::-webkit-scrollbar-thumb { background: var(--ink-line); }
          .sheet-scroll::-webkit-scrollbar-thumb:hover { background: var(--dim-2); }
        `}</style>
        {children}
      </div>
    </div>
  );
}

// Dropdown panel shared by the comboboxes.
const POPUP = {
  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--ink-2)",
  border: "1px solid var(--ink-line)", borderRadius: 4, maxHeight: 220, overflowY: "auto",
  zIndex: 20, boxShadow: "0 16px 40px rgba(0,0,0,.6)",
};
const OPT = { padding: "10px 14px", fontSize: 14, fontFamily: BODY, color: "var(--bone)", cursor: "pointer" };
const optEnter = (e) => (e.currentTarget.style.background = "var(--ink-line)");
const optLeave = (e) => (e.currentTarget.style.background = "transparent");

export function Combobox({ value, onChange, options, placeholder, style }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef();
  useEffect(() => {
    const onDocDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const q = (value || "").toLowerCase().trim();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const exactMatch = filtered.length === 1 && filtered[0].toLowerCase() === q;

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <input
        type="text" value={value || ""} placeholder={placeholder || ""}
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "Enter" && filtered.length > 0 && !exactMatch) { e.preventDefault(); onChange(filtered[0]); setOpen(false); }
        }}
        style={style}
      />
      {open && filtered.length > 0 && !exactMatch && (
        <div style={POPUP}>
          {filtered.map((o) => (
            <div key={o} onMouseDown={(e) => { e.preventDefault(); onChange(o); setOpen(false); }}
              style={OPT} onMouseEnter={optEnter} onMouseLeave={optLeave}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MultiCombobox({ values = [], onChange, options = [], placeholder, style }) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef();
  const inputRef = useRef();
  useEffect(() => {
    const onDocDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const add = (v) => {
    const t = (v || "").trim();
    if (!t) return;
    if (values.some((x) => x.toLowerCase() === t.toLowerCase())) { setInput(""); return; }
    onChange([...values, t]);
    setInput("");
  };
  const removeAt = (i) => onChange(values.filter((_, j) => j !== i));

  const q = input.toLowerCase().trim();
  const filtered = (q ? options.filter((o) => o.toLowerCase().includes(q)) : options)
    .filter((o) => !values.some((v) => v.toLowerCase() === o.toLowerCase()));

  const outerStyle = { ...style, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", cursor: "text", padding: "8px 10px" };

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <div onClick={() => inputRef.current?.focus()} style={outerStyle}>
        {values.map((v, i) => (
          <span key={`${v}-${i}`} style={{
            display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 4px 3px 10px",
            background: "transparent", border: "1px solid var(--ink-line)",
            fontSize: 12, fontFamily: MONO, letterSpacing: "0.06em", color: "var(--manila)",
          }}>
            {v}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeAt(i); }} style={{
              background: "none", border: "none", color: "var(--dim)", cursor: "pointer", padding: "0 6px", lineHeight: 1, fontSize: 16,
            }}>×</button>
          </span>
        ))}
        <input
          ref={inputRef} type="text" value={input}
          placeholder={values.length === 0 ? (placeholder || "") : ""}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0 && q && filtered[0].toLowerCase().startsWith(q)) add(filtered[0]);
              else if (input.trim()) add(input);
            } else if (e.key === ",") {
              e.preventDefault();
              if (input.trim()) add(input);
            } else if (e.key === "Backspace" && !input && values.length > 0) {
              e.preventDefault();
              removeAt(values.length - 1);
            } else if (e.key === "Escape") { setOpen(false); }
          }}
          onBlur={() => { if (input.trim()) add(input); }}
          style={{ flex: 1, minWidth: 80, border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontSize: 14, color: "var(--bone)", padding: "2px 0" }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div style={POPUP}>
          {filtered.map((o) => (
            <div key={o} onMouseDown={(e) => { e.preventDefault(); add(o); }}
              style={OPT} onMouseEnter={optEnter} onMouseLeave={optLeave}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

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
        <div style={POPUP}>
          {filtered.map((c) => (
            <div key={c} onMouseDown={(e) => { e.preventDefault(); onChange(c); setOpen(false); }}
              style={OPT} onMouseEnter={optEnter} onMouseLeave={optLeave}>{c}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Category-grouped flavour picker. Category dots keep their own hue; chips read
// as stamped marks in the ledger world.
export function FlavorPicker({ value = [], onChange }) {
  const toggle = (t) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  return (
    <div>
      {value.length > 0 && (
        <div style={{ marginBottom: 16, padding: 12, background: "var(--ink)", border: "1px solid var(--ink-line)" }}>
          <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: MONO, marginBottom: 8, letterSpacing: "0.16em", textTransform: "uppercase" }}>Selected ({value.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {value.map((t) => (
              <button key={t} type="button" onClick={() => toggle(t)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                border: "1px solid var(--stamp)", background: "var(--stamp)", color: "#fff",
                fontFamily: MONO, fontSize: 12, letterSpacing: "0.06em", cursor: "pointer",
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
            <span style={{ width: 8, height: 8, background: cat.color, display: "inline-block" }} />
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--bone)" }}>{cat.name}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {cat.tags.map((t) => {
              const active = value.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggle(t)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", cursor: "pointer",
                  border: `1px solid ${active ? cat.color : "var(--ink-line)"}`,
                  background: active ? cat.color : "transparent",
                  color: active ? "#fff" : "var(--manila)",
                  fontFamily: MONO, fontSize: 12, letterSpacing: "0.06em", transition: "all 0.15s",
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

const SCALE_LABEL = ["—", "Low", "Med-Low", "Medium", "Med-High", "High"];
function ScaleBars({ value, color = "var(--stamp)" }) {
  const v = Math.round(Number(value) || 0);
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ width: 18, height: 18, background: i <= v ? color : "var(--ink-line)", display: "inline-block" }} />
      ))}
    </div>
  );
}

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
        <div key={r.label} style={{ background: "var(--ink)", border: "1px solid var(--ink-line)", padding: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 10 }}>{r.label}</div>
          <ScaleBars value={r.val} />
          <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.04em", color: "var(--manila)", marginTop: 10 }}>{r.text}</div>
        </div>
      ))}
    </div>
  );
}

export function ScaleSlider({ label, value, onChange, color = "var(--stamp)" }) {
  const v = Number(value) || 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--dim)", fontFamily: MONO }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--manila)" }}>{v > 0 ? SCALE_LABEL[v] : "—"}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => onChange(i === v ? 0 : i)} style={{
            flex: 1, height: 32, border: "none", cursor: "pointer",
            background: i <= v ? color : "var(--ink-line)",
          }} />
        ))}
      </div>
    </div>
  );
}

// Score badge — Anton numerals, stamp ink.
export function ScorePuck({ score, label, color = "var(--stamp)", size = 44 }) {
  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <div className="tnum" style={{ fontSize: size * 0.62, fontFamily: DISPLAY, color: score ? color : "var(--dim-2)", lineHeight: 0.9 }}>
        {score ? Number(score).toFixed(1) : "—"}
      </div>
      {label && <div style={{ fontSize: 9, color: "var(--dim)", fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3 }}>{label}</div>}
    </div>
  );
}
