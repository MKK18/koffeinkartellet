import { useState, useEffect, useCallback } from "react";
import { C, sans, serif, inputStyle } from "./ui.jsx";
import { useIsWide } from "./useMediaQuery.js";
import { useNav } from "./nav.jsx";
import { Pill } from "./components.jsx";
import { TAG_EMOJI } from "./lib.js";
import { listCoffees, listAllTastings, coffeeImageUrl } from "./data.js";

function CoffeeCard({ coffee, avg, count, onClick }) {
  const img = coffeeImageUrl(coffee, "300x300");
  const [hover, setHover] = useState(false);
  const origin = [coffee.origin, coffee.region].filter(Boolean).join(", ");

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.card,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: hover
          ? "0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.03)",
        transition: "box-shadow 0.25s ease",
      }}
    >
      {/* Image area */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2" }}>
        {img ? (
          <img
            src={img}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#ece3d5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 40, color: C.faint, opacity: 0.45 }}>☕</span>
          </div>
        )}
      </div>

      {/* Info area */}
      <div style={{ padding: "18px 18px 16px" }}>
        {/* Top row: name + score */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontFamily: serif,
              fontWeight: 700,
              color: C.ink,
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {coffee.name}
          </div>
          {avg && (
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <span
                style={{
                  fontFamily: serif,
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.accent,
                  lineHeight: 1,
                }}
              >
                {avg}
              </span>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 11,
                  color: C.faint,
                  marginLeft: 1,
                }}
              >
                / 10
              </span>
            </div>
          )}
        </div>

        {/* Roaster */}
        {coffee.roaster && (
          <div
            style={{
              fontSize: 13,
              color: C.muted,
              fontFamily: sans,
              lineHeight: 1.3,
              marginBottom: 3,
            }}
          >
            {coffee.roaster}
          </div>
        )}

        {/* Origin */}
        {origin && (
          <div
            style={{
              fontSize: 12,
              color: C.faint,
              fontFamily: sans,
              lineHeight: 1.3,
              marginBottom: 12,
            }}
          >
            {origin}
          </div>
        )}

        {/* Bottom row: process pill + tasting count */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 22,
          }}
        >
          <div>
            {coffee.process && (
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 12,
                  fontFamily: sans,
                  background: "transparent",
                  color: C.muted,
                  border: `1px solid ${C.border}`,
                  letterSpacing: "0.01em",
                }}
              >
                {coffee.process}
              </span>
            )}
          </div>
          {count > 0 && (
            <span
              style={{
                fontSize: 10,
                color: C.faint,
                fontFamily: sans,
                letterSpacing: "0.02em",
              }}
            >
              {count} {count === 1 ? "tasting" : "tastings"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Catalog() {
  const wide = useIsWide();
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
          width: "100%",
          padding: "12px 18px",
          borderRadius: 14,
          border: "none",
          background: "#ece3d5",
          fontSize: 15,
          fontFamily: sans,
          color: C.ink,
          outline: "none",
          boxSizing: "border-box",
          marginBottom: 14,
        }}
      />

      {/* Buy verdict link */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <button
          onClick={openBuyVerdict}
          style={{
            background: "none",
            border: "none",
            color: C.accent,
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            padding: "2px 0",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            textDecorationColor: C.border,
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
        <div
          style={{
            textAlign: "center",
            padding: "64px 24px",
            color: C.muted,
            fontFamily: sans,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.35 }}>☕</div>
          <div
            style={{
              fontFamily: serif,
              fontSize: 20,
              color: C.ink,
              marginBottom: 8,
            }}
          >
            {search ? "No matches" : "No coffees yet"}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 280, margin: "0 auto" }}>
            {search
              ? `Nothing matches "${search}"`
              : "Tap + to add the first one — scan a bag or paste a link."}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: wide ? "1fr 1fr" : "1fr",
            gap: 20,
          }}
        >
          {coffees.map((c) => (
            <CoffeeCard
              key={c.id}
              coffee={c}
              avg={aggregates[c.id]?.avg}
              count={aggregates[c.id]?.count || 0}
              onClick={() => openCoffee(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
