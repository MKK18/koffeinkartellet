import { useState, useEffect, useRef, useId } from "react";
import { COFFEE_COUNTRIES, FLAVOR_CATEGORIES } from "./lib.js";
import { avatarUrl } from "./pb.js";
import { memberColor, initial, bowlTint, fmtScore } from "./marks.js";

// ── Icons: one authored set, 24px grid, 1.8 stroke ─────────────────────────
const P = {
  table: <><path d="M12 3v18" /><circle cx="12" cy="7" r="2.6" /><circle cx="12" cy="16" r="2.6" /><path d="M4 7h4.5M15.5 16H20" /></>,
  coffees: <><circle cx="6" cy="6.5" r="2.2" /><circle cx="6" cy="12" r="2.2" /><circle cx="6" cy="17.5" r="2.2" /><path d="M11 6.5h9M11 12h9M11 17.5h6" /></>,
  camera: <><path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10.5H4z" /><circle cx="12" cy="13.5" r="3.4" /></>,
  palate: <><circle cx="9" cy="12" r="5.5" /><circle cx="15" cy="12" r="5.5" /></>,
  you: <><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.8-3.7 3.6-5.6 7-5.6s6.2 1.9 7 5.6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  check: <path d="m5 12.5 4.3 4.3L19 7" />,
  alert: <><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.5M12 17.2v.3" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.6 6.7" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7" /></>,
  want: <><path d="M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  cup: <><path d="M5 9h12v4.5A5.5 5.5 0 0 1 11.5 19h-1A5.5 5.5 0 0 1 5 13.5z" /><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17" /></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4.5 17 5-4.5 4 3.5 2.5-2 3.5 3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" /></>,
  out: <><path d="M14 4h5v16h-5" /><path d="M10 8l-4 4 4 4M6 12h9" /></>,
};
export function Icon({ name, size, label, style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? "img" : undefined}
      aria-label={label} style={style}>{P[name]}</svg>
  );
}

// ── Avatar: photo, else a member-coloured disc with an initial ─────────────
export function Avatar({ user, size = 32, onClick, title }) {
  const url = avatarUrl(user);
  const color = memberColor(user);
  const base = { width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "block" };
  const inner = url
    ? <img src={url} alt="" style={{ ...base, objectFit: "cover" }} />
    : <span aria-hidden="true" style={{ ...base, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: Math.round(size * 0.42), lineHeight: 1, userSelect: "none" }}>{initial(user)}</span>;
  if (onClick) {
    return <button type="button" onClick={onClick} aria-label={title || `Open ${user?.name || "profile"}`}
      style={{ ...base, padding: 0, border: 0, background: "none", cursor: "pointer" }}>{inner}</button>;
  }
  return <span title={user?.name || ""} style={{ ...base, display: "inline-block" }}>{inner}</span>;
}

// ── Marks ──────────────────────────────────────────────────────────────────
// A coffee's cupping bowl, tinted by roast; the bag photo when one exists.
export function Bowl({ coffee, size = 48, photo = false, img, children, style }) {
  const [a, b] = bowlTint(coffee?.roast_level);
  return (
    <span className={`bowl${photo && img ? " has-img" : ""}`} style={{ width: size, height: size, "--b": a, "--b2": b, display: "inline-block", ...style }} aria-hidden="true">
      {photo && img && <img src={img} alt="" />}
      {children}
    </span>
  );
}

// The red pencil ring: an open, overshooting loop drawn around something.
export function Ring({ inset = -7, draw = false, rotate = -14 }) {
  return (
    <svg className={`ring${draw ? " draw" : ""}`} viewBox="0 0 100 80" preserveAspectRatio="none"
      style={{ inset, width: `calc(100% - ${inset * 2}px)`, height: `calc(100% - ${inset * 2}px)`, transform: `rotate(${rotate}deg)` }} aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M80 12C62 1 22 3 9 23-2 41 13 70 46 75c33 4 52-17 48-39C91 21 77 11 58 8" />
    </svg>
  );
}

// A red pencil underline / "split" mark.
export function PencilMark({ children, style }) {
  return (
    <span style={{ fontFamily: "var(--hand)", color: "var(--red)", fontSize: 19, lineHeight: 1, display: "inline-block", transform: "rotate(-5deg)", position: "relative", ...style }}>
      {children}
      <svg viewBox="0 0 60 6" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: -2, right: -4, bottom: -4, width: "calc(100% + 6px)", height: 5 }}>
        <path d="M1 4C15 1 40 2 59 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

// The cupping form's quality scale: 6 to 10, a pencil tick where the score sits.
export function Tick({ score, width = 64, min = 6, max = 10 }) {
  const pos = Math.max(0, Math.min(1, (Number(score) - min) / (max - min)));
  return (
    <div className="tick" style={{ width }} aria-hidden="true">
      {Array.from({ length: max - min + 1 }, (_, i) => <i key={i} style={{ left: `${(i / (max - min)) * 100}%` }} />)}
      {score != null && <b style={{ left: `${pos * 100}%` }} />}
    </div>
  );
}

// A pencilled score.
export function Score({ value, size = 28, muted, className = "", style }) {
  return (
    <span className={`hand ${className}`} style={{ fontSize: size, color: muted ? "var(--ink-3)" : "var(--pencil)", ...style }}>
      {fmtScore(value)}
    </span>
  );
}

// ── Feedback ───────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }) {
  return <span aria-hidden="true" style={{ display: "inline-block", width: size, height: size, border: "2px solid var(--rule)", borderTopColor: "var(--table)", borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />;
}

export function Slip({ children, style }) {
  return <div className="slip" role="alert" style={style}><Icon name="alert" />{<div>{children}</div>}</div>;
}

export function Toast({ children, action, onAction, onDone, ms = 5000 }) {
  useEffect(() => { const t = setTimeout(onDone, ms); return () => clearTimeout(t); }, [onDone, ms]);
  return (
    <div className="toast" role="status">
      <span>{children}</span>
      {action && <button type="button" onClick={onAction}>{action}</button>}
    </div>
  );
}

// Empty state: an empty cupping bowl on the sheet, a sentence, and a way forward.
export function Empty({ title, body, children }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px 40px" }}>
      <span className="bowl" style={{ width: 84, height: 84, display: "inline-block", "--b": "var(--tint)", "--b2": "var(--rule-2)", marginBottom: 18 }} aria-hidden="true" />
      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-.01em" }}>{title}</h3>
      {body && <p style={{ margin: "6px auto 0", maxWidth: "36ch", color: "var(--ink-2)", fontSize: 15 }}>{body}</p>}
      {children && <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>{children}</div>}
    </div>
  );
}

export function SectionHead({ title, aside }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "28px 0 10px", paddingBottom: 8, borderBottom: "1.5px solid var(--form)" }}>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-.005em" }}>{title}</h3>
      {aside}
    </div>
  );
}

// ── Sheet: bottom sheet on phones, centred panel on wider screens ──────────
// `dirty` guards against losing typed work: closing asks first, in the sheet.
export function Sheet({ title, onClose, children, maxWidth = 600, dirty = false, headerAside, labelledBy }) {
  const [asking, setAsking] = useState(false);
  const tid = useId();
  const panel = useRef();
  const request = () => { if (dirty) setAsking(true); else onClose(); };
  const reqRef = useRef(request); reqRef.current = request;
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") reqRef.current(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lastFocus = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; lastFocus?.focus?.({ preventScroll: true }); };
  }, []);

  return (
    <div className="ov ct" onMouseDown={(e) => { if (e.target === e.currentTarget) request(); }}>
      <div ref={panel} className="ov-panel" role="dialog" aria-modal="true" aria-labelledby={labelledBy || (title ? tid : undefined)} tabIndex={-1}
        style={{ maxWidth, outline: "none" }}>
        <div className="ov-grab">
          {title ? <h2 id={tid}>{title}</h2> : <span />}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {headerAside}
            <button type="button" className="iconbtn" onClick={request} aria-label="Close"><Icon name="close" /></button>
          </div>
        </div>
        {asking && (
          <div className="ov-body" style={{ marginBottom: 12 }}>
            <div className="slip" role="alertdialog" aria-label="Discard changes?" style={{ alignItems: "center", flexWrap: "wrap" }}>
              <Icon name="alert" />
              <span style={{ flex: 1, minWidth: 160 }}>Close and lose what you've typed?</span>
              <button type="button" className="btn btn-quiet" onClick={() => setAsking(false)}>Keep editing</button>
              <button type="button" className="btn btn-line" style={{ color: "var(--slip-ink)", borderColor: "var(--slip-line)" }} onClick={onClose}>Discard</button>
            </div>
          </div>
        )}
        <div className="ov-body">{children}</div>
      </div>
    </div>
  );
}

// ── Inputs ─────────────────────────────────────────────────────────────────
const POPUP = {
  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--card)",
  border: "1.5px solid var(--rule)", borderRadius: 10, maxHeight: 240, overflowY: "auto",
  zIndex: 20, boxShadow: "0 16px 32px -12px rgba(31,74,99,.35)", padding: 4,
};
function Option({ children, onPick }) {
  return (
    <div role="option" aria-selected="false" onMouseDown={(e) => { e.preventDefault(); onPick(); }}
      style={{ padding: "10px 12px", fontSize: 15, borderRadius: 7, cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--tint)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>{children}</div>
  );
}
function useOutside(ref, fn) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) fn(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, fn]);
}

export function Combobox({ value, onChange, options, placeholder, id }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef();
  useOutside(wrap, () => setOpen(false));
  const q = (value || "").toLowerCase().trim();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const exact = filtered.length === 1 && filtered[0].toLowerCase() === q;
  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <input id={id} className="input" type="text" value={value || ""} placeholder={placeholder || ""} autoComplete="off"
        role="combobox" aria-expanded={open && filtered.length > 0 && !exact} aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "Enter" && filtered.length > 0 && !exact) { e.preventDefault(); onChange(filtered[0]); setOpen(false); }
        }} />
      {open && filtered.length > 0 && !exact && (
        <div role="listbox" style={POPUP}>{filtered.map((o) => <Option key={o} onPick={() => { onChange(o); setOpen(false); }}>{o}</Option>)}</div>
      )}
    </div>
  );
}

export function CountryCombobox(props) {
  return <Combobox {...props} options={COFFEE_COUNTRIES} />;
}

export function MultiCombobox({ values = [], onChange, options = [], placeholder, id }) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef();
  const inputRef = useRef();
  useOutside(wrap, () => setOpen(false));
  const add = (v) => {
    const t = (v || "").trim();
    if (!t) return;
    if (!values.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...values, t]);
    setInput("");
  };
  const removeAt = (i) => onChange(values.filter((_, j) => j !== i));
  const q = input.toLowerCase().trim();
  const filtered = (q ? options.filter((o) => o.toLowerCase().includes(q)) : options)
    .filter((o) => !values.some((v) => v.toLowerCase() === o.toLowerCase()));

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <div className="input" onClick={() => inputRef.current?.focus()} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", cursor: "text", padding: "7px 10px" }}>
        {values.map((v, i) => (
          <span key={`${v}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "3px 4px 3px 10px", background: "var(--tint)", borderRadius: 14, fontSize: 14, fontWeight: 600 }}>
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={(e) => { e.stopPropagation(); removeAt(i); }}
              style={{ background: "none", border: 0, color: "var(--ink-2)", cursor: "pointer", width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
              <Icon name="close" size={14} />
            </button>
          </span>
        ))}
        <input id={id} ref={inputRef} type="text" value={input} autoComplete="off"
          placeholder={values.length === 0 ? (placeholder || "") : ""}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0 && q && filtered[0].toLowerCase().startsWith(q)) add(filtered[0]);
              else if (input.trim()) add(input);
            } else if (e.key === ",") { e.preventDefault(); if (input.trim()) add(input); }
            else if (e.key === "Backspace" && !input && values.length > 0) { e.preventDefault(); removeAt(values.length - 1); }
            else if (e.key === "Escape") setOpen(false);
          }}
          onBlur={() => { if (input.trim()) add(input); }}
          style={{ flex: 1, minWidth: 90, border: 0, outline: "none", background: "transparent", fontSize: 16, color: "var(--ink)", padding: "4px 2px" }} />
      </div>
      {open && filtered.length > 0 && (
        <div role="listbox" style={POPUP}>{filtered.map((o) => <Option key={o} onPick={() => add(o)}>{o}</Option>)}</div>
      )}
    </div>
  );
}

// Flavour picker: words, grouped. Selected flavours are pencilled-in chips.
export function FlavorPicker({ value = [], onChange }) {
  const toggle = (t) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  return (
    <div>
      {FLAVOR_CATEGORIES.map((cat) => (
        <fieldset key={cat.name} style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
          <legend style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8, padding: 0 }}>{cat.name}</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {cat.tags.map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={value.includes(t)} onClick={() => toggle(t)}>{t}</button>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

// Score input: the big pencil numeral answers as you drag. Starts unscored, so
// nobody's rating is anchored by a default.
export function ScoreInput({ value, onChange, id }) {
  const scored = value != null && value !== "";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <label htmlFor={id} className="label" style={{ marginBottom: 4 }}>Your score</label>
        <span className="hand" aria-hidden="true" style={{ fontSize: 56, lineHeight: .85, color: scored ? "var(--pencil)" : "var(--rule)", minWidth: 96, textAlign: "right" }}>
          {scored ? Number(value).toFixed(1) : "–.–"}
        </span>
      </div>
      <input id={id} type="range" min="1" max="10" step="0.5" value={scored ? value : 7}
        aria-valuetext={scored ? `${Number(value).toFixed(1)} out of 10` : "Not scored yet"}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={(e) => { if (!scored) onChange(Number(e.currentTarget.value)); }}
        className={`score-range${scored ? "" : " unset"}`} />
      <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
        <span>1</span><span>4</span><span>7</span><span>10</span>
      </div>
      {!scored && <div className="hint">Drag to score. Nothing is filled in for you.</div>}
    </div>
  );
}

// Flavour dimension readout (roast / acidity / body / sweetness).
const SCALE_LABEL = ["–", "Low", "Medium-low", "Medium", "Medium-high", "High"];
export function ScaleSlider({ label, value, onChange }) {
  const v = Number(value) || 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="label" style={{ margin: 0 }}>{label}</span>
        <span style={{ fontSize: 14, color: "var(--ink-2)" }}>{v > 0 ? SCALE_LABEL[v] : "–"}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }} role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={i === v} aria-label={SCALE_LABEL[i]} onClick={() => onChange(i === v ? 0 : i)}
            style={{ flex: 1, height: 32, border: 0, borderRadius: 6, cursor: "pointer", background: i <= v ? "var(--table)" : "var(--rule-2)" }} />
        ))}
      </div>
    </div>
  );
}
