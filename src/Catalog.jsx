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
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.card,
        border: `1px solid ${C.borderSoft}`,
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: hover
          ? "0 8px 24px rgba(100,70,40,0.13)"
          : "0 2px 10px rgba(100,70,40,0.06)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Image area */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3" }}>
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
              background: "linear-gradient(135deg, #f0e6da 0%, #e8d5c4 50%, #dcc5b0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 48, opacity: 0.4 }}>☕</span>
          </div>
        )}
        {/* Score badge overlaid on image */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            minWidth: 38,
            height: 38,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 10px",
            background: avg ? C.accent : "rgba(200,185,170,0.85)",
            color: avg ? "#fff8f0" : "#fff8f0",
            fontFamily: serif,
            fontWeight: 700,
            fontSize: avg ? 15 : 11,
            letterSpacing: avg ? 0 : "0.06em",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            backdropFilter: avg ? "none" : "blur(4px)",
          }}
        >
          {avg || "NEW"}
        </div>
      </div>

      {/* Info area */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            fontSize: 16,
            fontFamily: serif,
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.25,
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {coffee.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.muted,
            fontFamily: sans,
            lineHeight: 1.3,
            marginBottom: 10,
          }}
        >
          {[
            coffee.roaster,
            [coffee.origin, coffee.region].filter(Boolean).join(", "),
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {coffee.process && <Pill>{coffee.process}</Pill>}
          {coffee.tags?.slice(0, 2).map((t) => (
            <Pill key={t} green>
              {TAG_EMOJI[t] ? `${TAG_EMOJI[t]} ${t}` : t}
            </Pill>
          ))}
          {count > 0 && (
            <span
              style={{
                fontSize: 11,
                color: C.faint,
                fontFamily: sans,
                marginLeft: "auto",
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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍  Search coffees, roasters, origins…"
        style={{ ...inputStyle, marginBottom: 12, fontSize: 15, padding: "12px 16px" }}
      />

      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <button
          onClick={openBuyVerdict}
          style={{
            background: "none",
            border: "none",
            color: C.brown,
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            padding: "4px 0",
            borderBottom: `1px solid transparent`,
            transition: "border-color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = C.brown)}
          onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
        >
          🔮 Should I buy this coffee?
        </button>
      </div>

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
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>☕</div>
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
            gap: 16,
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
