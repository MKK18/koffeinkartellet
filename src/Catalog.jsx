import { useState, useEffect, useCallback } from "react";
import { C, sans, serif, fraunces } from "./ui.jsx";
import { useNav } from "./nav.jsx";
import { CoffeeRing } from "./components.jsx";
import { listCoffees, listAllTastings, coffeeImageUrl } from "./data.js";

function CoffeeRow({ coffee, avg, count, onClick }) {
  const img = coffeeImageUrl(coffee, "120x120");
  const origin = [coffee.origin, coffee.region].filter(Boolean).join(", ");
  const meta = [origin, coffee.process].filter(Boolean).join("  ✱  ");

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "16px 0", cursor: "pointer",
        borderTop: `1px solid ${C.ink}`,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 56, height: 56, borderRadius: 4, flexShrink: 0, overflow: "hidden",
        background: "#ece3d5", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {img
          ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <span style={{ fontSize: 22, opacity: 0.35 }}>☕</span>}
      </div>

      {/* Name / roaster / meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: serif, fontWeight: 700, fontSize: 16.5, color: C.ink,
          lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{coffee.name}</div>
        {coffee.roaster && (
          <div style={{ fontFamily: sans, fontSize: 12.5, color: C.muted, marginTop: 3, lineHeight: 1.3 }}>
            {coffee.roaster}
          </div>
        )}
        {meta && (
          <div style={{
            fontFamily: sans, fontSize: 10, color: C.faint, marginTop: 4,
            letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{meta}</div>
        )}
      </div>

      {/* Score */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {avg ? (
          <>
            <div style={{
              fontFamily: fraunces, fontStyle: "italic", fontWeight: 600,
              fontSize: 27, color: C.accent, lineHeight: 1, letterSpacing: "-0.02em",
            }}>{avg}</div>
            <div style={{ fontFamily: sans, fontSize: 9.5, color: C.faint, marginTop: 4, letterSpacing: "0.06em" }}>
              {count} {count === 1 ? "tasting" : "tastings"}
            </div>
          </>
        ) : (
          <div style={{ fontFamily: fraunces, fontStyle: "italic", fontSize: 22, color: C.border, lineHeight: 1 }}>—</div>
        )}
      </div>
    </div>
  );
}

export default function Catalog() {
  const { openCoffee, addCoffee, openBuyVerdict, dataVersion } = useNav();
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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search coffees, roasters, origins…"
        style={{
          width: "100%", padding: "12px 18px", borderRadius: 14, border: "none",
          background: "#ece3d5", fontSize: 15, fontFamily: sans, color: C.ink,
          outline: "none", boxSizing: "border-box", marginBottom: 12,
        }}
      />

      {/* Buy verdict link */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button
          onClick={openBuyVerdict}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "2px 0",
            fontFamily: fraunces, fontStyle: "italic", fontSize: 15, color: C.accent,
            textDecoration: "underline", textUnderlineOffset: 4, textDecorationColor: C.border,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = C.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = C.border)}
        >
          Should I buy this coffee?
        </button>
      </div>

      {/* Content */}
      {coffees === null ? (
        <div style={{ textAlign: "center", padding: 48, color: C.muted, fontFamily: sans }}>
          Loading…
        </div>
      ) : coffees.length === 0 ? (
        <div style={{ padding: "40px 0 56px" }}>
          <CoffeeRing size={250}>
            <div style={{ fontFamily: fraunces, fontStyle: "italic", fontSize: 19, color: C.ink, lineHeight: 1.4, marginBottom: 6 }}>
              {search ? "No matches." : "Nothing in the catalog yet."}
            </div>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              {search ? `Nothing matches "${search}"` : "Tap + to scan your first bag."}
            </div>
          </CoffeeRing>
        </div>
      ) : (
        <>
          {/* Index header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            marginBottom: 10,
          }}>
            <span style={{
              fontFamily: sans, fontSize: 10, letterSpacing: "0.18em",
              textTransform: "uppercase", color: C.muted,
            }}>The index</span>
            <span style={{
              fontFamily: sans, fontSize: 10, letterSpacing: "0.12em",
              textTransform: "uppercase", color: C.faint,
            }}>{coffees.length} {coffees.length === 1 ? "coffee" : "coffees"}</span>
          </div>

          {/* Rows */}
          <div style={{ borderBottom: `1px solid ${C.ink}` }}>
            {coffees.map((c) => (
              <CoffeeRow
                key={c.id}
                coffee={c}
                avg={aggregates[c.id]?.avg}
                count={aggregates[c.id]?.count || 0}
                onClick={() => openCoffee(c)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
