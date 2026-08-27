import { useState, useEffect, useCallback } from "react";
import { useNav } from "./nav.jsx";
import { CoffeeRing } from "./components.jsx";
import { listCoffees, listAllTastings, coffeeImageUrl } from "./data.js";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";
const BODY = "var(--font-body)";

function CoffeeRow({ coffee, avg, count, onClick }) {
  const img = coffeeImageUrl(coffee, "120x120");
  const origin = [coffee.origin, coffee.region].filter(Boolean).join(", ");
  const meta = [origin, coffee.process].filter(Boolean).join("  ✱  ");

  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", cursor: "pointer", borderTop: "1px solid var(--ink-line)" }}
    >
      <div style={{ width: 56, height: 56, flexShrink: 0, overflow: "hidden", background: "var(--ink-2)", border: "1px solid var(--ink-line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {img
          ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--dim-2)" strokeWidth="1.5"><path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 10h2a2 2 0 0 1 0 4h-2" /></svg>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 17, color: "var(--bone)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{coffee.name}</div>
        {coffee.roaster && (
          <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--manila)", marginTop: 4, letterSpacing: "0.04em", lineHeight: 1.3 }}>{coffee.roaster}</div>
        )}
        {meta && (
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: "var(--dim)", marginTop: 4, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta}</div>
        )}
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {avg ? (
          <>
            <div className="tnum" style={{ fontFamily: DISPLAY, fontSize: 30, color: "var(--stamp)", lineHeight: 0.9 }}>{avg}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--dim)", marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>{count} {count === 1 ? "rating" : "ratings"}</div>
          </>
        ) : (
          <div style={{ fontFamily: DISPLAY, fontSize: 26, color: "var(--dim-2)", lineHeight: 1 }}>—</div>
        )}
      </div>
    </div>
  );
}

export default function Catalog() {
  const { openCoffee, openBuyVerdict, dataVersion } = useNav();
  const [coffees, setCoffees] = useState(null);
  const [aggregates, setAggregates] = useState({});
  const [search, setSearch] = useState("");

  const refresh = useCallback(async (q) => {
    const [list, tastings] = await Promise.all([listCoffees(q), listAllTastings()]);
    const agg = {};
    tastings.forEach((t) => { const s = Number(t.score); if (s) (agg[t.coffee] ||= []).push(s); });
    const summary = {};
    Object.entries(agg).forEach(([id, arr]) => { summary[id] = { avg: (arr.reduce((a, x) => a + x, 0) / arr.length).toFixed(1), count: arr.length }; });
    setAggregates(summary);
    setCoffees(list);
  }, []);

  useEffect(() => { const t = setTimeout(() => refresh(search), 250); return () => clearTimeout(t); }, [search, refresh, dataVersion]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px var(--gut)" }}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="SEARCH COFFEES, ROASTERS, ORIGINS…"
        className="cl-input"
        style={{ marginBottom: 14, letterSpacing: "0.08em" }}
      />

      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <button
          onClick={openBuyVerdict}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--stamp)", textDecoration: "underline", textUnderlineOffset: 4 }}
        >
          Should I buy this coffee? →
        </button>
      </div>

      {coffees === null ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--dim)", fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Loading ledger…</div>
      ) : coffees.length === 0 ? (
        <div style={{ padding: "40px 0 56px" }}>
          <CoffeeRing size={260}>
            <div style={{ color: "var(--bone)", marginBottom: 6 }}>{search ? "No matches on file" : "No entries on file"}</div>
            <div style={{ color: "var(--dim)" }}>{search ? `Nothing matches “${search}”` : "Tap + to scan your first bag"}</div>
          </CoffeeRing>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--dim)" }}>The index</span>
            <span className="tnum" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--dim)" }}>{coffees.length} {coffees.length === 1 ? "entry" : "entries"}</span>
          </div>
          <div style={{ borderBottom: "1px solid var(--ink-line)" }}>
            {coffees.map((c) => (
              <CoffeeRow key={c.id} coffee={c} avg={aggregates[c.id]?.avg} count={aggregates[c.id]?.count || 0} onClick={() => openCoffee(c)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
