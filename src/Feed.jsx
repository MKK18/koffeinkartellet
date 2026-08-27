import { useState, useEffect } from "react";
import { useNav } from "./nav.jsx";
import { CoffeeRing } from "./components.jsx";
import { listRecentTastings, coffeeImageUrl } from "./data.js";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";
const BODY = "var(--font-body)";

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function Feed() {
  const { openCoffee, openProfile, dataVersion } = useNav();
  const [items, setItems] = useState(null);

  useEffect(() => { listRecentTastings(60).then(setItems).catch(() => setItems([])); }, [dataVersion]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px var(--gut) 100px" }}>
      {items === null ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--dim)", fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Loading feed…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: "48px 0 56px" }}>
          <CoffeeRing size={260}>
            <div style={{ color: "var(--bone)", marginBottom: 6 }}>No verdicts on file</div>
            <div style={{ color: "var(--dim)" }}>Tastings from the crew show up here</div>
          </CoffeeRing>
        </div>
      ) : (
        <div style={{ borderBottom: "1px solid var(--ink-line)" }}>
          {items.map((t) => {
            const u = t.expand?.user || {};
            const c = t.expand?.coffee || {};
            const img = coffeeImageUrl(c, "100x100");
            const userColor = u.color || "var(--stamp)";

            return (
              <div key={t.id} style={{ padding: "24px 0", borderTop: "1px solid var(--ink-line)" }}>
                <div className="tnum" style={{ fontFamily: DISPLAY, fontSize: 34, color: "var(--stamp)", lineHeight: 0.9, marginBottom: 14 }}>
                  {Number(t.score).toFixed(1)}
                </div>

                {t.notes ? (
                  <div style={{ fontFamily: BODY, fontStyle: "italic", fontWeight: 500, fontSize: 20, color: "var(--bone)", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                    <span style={{ color: "var(--stamp)" }}>“</span>{t.notes}<span style={{ color: "var(--stamp)" }}>”</span>
                  </div>
                ) : (
                  <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--dim)", letterSpacing: "0.06em" }}>Rated without notes</div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
                  {img && (
                    <div onClick={() => c.id && openCoffee(c)} style={{ width: 32, height: 32, flexShrink: 0, overflow: "hidden", border: "1px solid var(--ink-line)", cursor: c.id ? "pointer" : "default" }}>
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1.6, flex: 1, minWidth: 0 }}>
                    <span onClick={() => u.id && openProfile(u.id)} style={{ color: userColor, fontWeight: 600, cursor: u.id ? "pointer" : "default" }}>{u.name || "Someone"}</span>
                    <span style={{ color: "var(--dim-2)" }}> — on </span>
                    <span onClick={() => c.id && openCoffee(c)} style={{ color: "var(--manila)", fontWeight: 600, cursor: c.id ? "pointer" : "default" }}>{c.name || "a coffee"}</span>
                    {c.roaster && <span style={{ color: "var(--dim-2)" }}>, {c.roaster}</span>}
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--dim-2)", letterSpacing: "0.06em", flexShrink: 0 }}>{timeAgo(t.created)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
