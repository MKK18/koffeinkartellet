import { useState, useEffect, useCallback } from "react";
import { C, sans, serif, inputStyle, ghostBtn, FontLink } from "./ui.jsx";
import { useAuth } from "./auth.jsx";
import { useIsWide } from "./useMediaQuery.js";
import { Pill } from "./components.jsx";
import { listCoffees, listAllTastings, coffeeImageUrl } from "./data.js";
import CoffeeForm from "./CoffeeForm.jsx";
import CoffeeDetail from "./CoffeeDetail.jsx";
import SettingsModal from "./SettingsModal.jsx";

function CoffeeCard({ coffee, avg, count, onClick }) {
  const img = coffeeImageUrl(coffee, "300x300");
  return (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", display: "flex", boxShadow: "0 2px 8px rgba(100,70,40,0.06)" }}>
      <div style={{ width: 84, flexShrink: 0, background: img ? "transparent" : "#f0e6da", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 26 }}>☕</span>}
      </div>
      <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontFamily: serif, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{coffee.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3, fontFamily: sans }}>
              {[coffee.roaster, [coffee.origin, coffee.region].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
              {coffee.process && <Pill>{coffee.process}</Pill>}
              {coffee.tags?.slice(0, 2).map((t) => <Pill key={t} green>{t}</Pill>)}
            </div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontFamily: serif, fontWeight: 700, color: avg ? C.brown : "#d4c5b5", lineHeight: 1 }}>{avg || "—"}</div>
            {count > 0 && <div style={{ fontSize: 9, color: C.faint, fontFamily: sans, marginTop: 2 }}>{count} {count === 1 ? "tasting" : "tastings"}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Catalog() {
  const { user, logout } = useAuth();
  const wide = useIsWide();
  const [coffees, setCoffees] = useState(null);
  const [aggregates, setAggregates] = useState({});
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [settings, setSettings] = useState(false);

  const refresh = useCallback(async (q = search) => {
    const [list, tastings] = await Promise.all([listCoffees(q), listAllTastings()]);
    const agg = {};
    tastings.forEach((t) => {
      const s = Number(t.score);
      if (!s) return;
      (agg[t.coffee] ||= []).push(s);
    });
    const summary = {};
    Object.entries(agg).forEach(([id, arr]) => {
      summary[id] = { avg: (arr.reduce((a, x) => a + x, 0) / arr.length).toFixed(1), count: arr.length };
    });
    setAggregates(summary);
    setCoffees(list);
  }, [search]);

  useEffect(() => { refresh(""); /* eslint-disable-next-line */ }, []);
  useEffect(() => { const t = setTimeout(() => refresh(search), 300); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  const openExisting = (c) => { setAdding(false); setViewing(c); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 96 }}>
      <FontLink />
      {/* Header */}
      <div style={{ background: C.ink, padding: "18px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b89870", fontFamily: sans }}>☕ Koffeinkartellet</div>
            <h1 style={{ margin: "3px 0 0", fontFamily: serif, fontSize: 22, color: "#fff8f0", fontWeight: 900 }}>The catalog</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: user?.color || C.brown, display: "inline-block", border: "2px solid #4a3525" }} title={user?.name} />
            <button onClick={() => setSettings(true)} title="Settings" style={{ ...ghostBtn, color: "#b89870", borderColor: "#6b5040", padding: "6px 10px" }}>⚙</button>
            <button onClick={logout} style={{ ...ghostBtn, color: "#b89870", borderColor: "#6b5040", padding: "6px 12px" }}>Sign out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coffees, roasters, origins…" style={{ ...inputStyle, marginBottom: 16, fontSize: 15, padding: "12px 16px" }} />

        {coffees === null ? (
          <div style={{ textAlign: "center", padding: 40, color: C.muted, fontFamily: sans }}>Loading…</div>
        ) : coffees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 20px", color: C.muted, fontFamily: sans }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
            <div style={{ fontFamily: serif, fontSize: 20, color: C.muted, marginBottom: 8 }}>{search ? "No matches" : "No coffees yet"}</div>
            <div style={{ fontSize: 14 }}>{search ? `Nothing matches "${search}"` : "Tap + to add the first one — scan a bag to autofill it."}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: wide ? "1fr 1fr" : "1fr", gap: 12 }}>
            {coffees.map((c) => (
              <CoffeeCard key={c.id} coffee={c} avg={aggregates[c.id]?.avg} count={aggregates[c.id]?.count || 0} onClick={() => setViewing(c)} />
            ))}
          </div>
        )}
      </div>

      {/* Floating add button (mobile-first) */}
      <button onClick={() => setAdding(true)} style={{
        position: "fixed", right: 18, bottom: "calc(18px + env(safe-area-inset-bottom))", zIndex: 20,
        width: 60, height: 60, borderRadius: "50%", border: "none", background: C.brown, color: "#fff8f0",
        fontSize: 30, lineHeight: 1, cursor: "pointer", boxShadow: "0 6px 20px rgba(80,40,10,0.35)",
      }} aria-label="Add coffee">+</button>

      {adding && (
        <CoffeeForm
          coffee={null}
          onClose={() => setAdding(false)}
          onSaved={(c) => { setAdding(false); refresh(); setViewing(c); }}
          onOpenExisting={openExisting}
          onOpenSettings={() => { setAdding(false); setSettings(true); }}
        />
      )}
      {viewing && !editing && (
        <CoffeeDetail
          coffee={viewing}
          onClose={() => { setViewing(null); refresh(); }}
          onEdit={() => setEditing(viewing)}
        />
      )}
      {editing && (
        <CoffeeForm
          coffee={editing}
          onClose={() => setEditing(null)}
          onSaved={(c) => { setEditing(null); setViewing(c); refresh(); }}
        />
      )}
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  );
}
