import { useState, useEffect } from "react";
import { C, sans, fraunces } from "./ui.jsx";
import { useNav } from "./nav.jsx";
import { CoffeeRing } from "./components.jsx";
import { listRecentTastings, coffeeImageUrl } from "./data.js";

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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
      {items === null ? (
        <div style={{
          textAlign: "center", padding: 60, color: C.muted, fontFamily: sans,
          fontSize: 14, letterSpacing: "0.02em",
        }}>
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: "48px 0 56px" }}>
          <CoffeeRing size={250}>
            <div style={{ fontFamily: fraunces, fontStyle: "italic", fontSize: 19, color: C.ink, lineHeight: 1.4, marginBottom: 6 }}>
              Nothing brewing yet.
            </div>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              Tastings from everyone show up here.
            </div>
          </CoffeeRing>
        </div>
      ) : (
        <div style={{ borderBottom: `1px solid ${C.ink}` }}>
          {items.map((t) => {
            const u = t.expand?.user || {};
            const c = t.expand?.coffee || {};
            const img = coffeeImageUrl(c, "100x100");
            const userColor = u.color || C.brown;

            return (
              <div key={t.id} style={{ padding: "24px 0", borderTop: `1px solid ${C.ink}` }}>
                {/* Score */}
                <div style={{
                  fontFamily: fraunces, fontStyle: "italic", fontWeight: 600,
                  fontSize: 30, color: C.accent, lineHeight: 1, letterSpacing: "-0.02em",
                  marginBottom: 12,
                }}>
                  {Number(t.score).toFixed(1)}
                </div>

                {/* Tasting notes — the pull quote */}
                {t.notes ? (
                  <div style={{
                    fontFamily: fraunces, fontStyle: "italic", fontWeight: 400,
                    fontSize: 19, color: C.ink, lineHeight: 1.45, whiteSpace: "pre-wrap",
                    letterSpacing: "-0.005em",
                  }}>
                    “{t.notes}”
                  </div>
                ) : (
                  <div style={{
                    fontFamily: sans, fontSize: 13, color: C.faint,
                    fontStyle: "italic", lineHeight: 1.5,
                  }}>
                    Rated without notes
                  </div>
                )}

                {/* Attribution */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
                  {img && (
                    <div
                      onClick={() => c.id && openCoffee(c)}
                      style={{
                        width: 32, height: 32, borderRadius: 4, flexShrink: 0,
                        overflow: "hidden", cursor: c.id ? "pointer" : "default",
                      }}
                    >
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  <div style={{
                    fontFamily: sans, fontSize: 10.5, letterSpacing: "0.14em",
                    textTransform: "uppercase", lineHeight: 1.6,
                    flex: 1, minWidth: 0,
                  }}>
                    <span
                      onClick={() => u.id && openProfile(u.id)}
                      style={{ color: userColor, fontWeight: 700, cursor: u.id ? "pointer" : "default" }}
                    >{u.name || "Someone"}</span>
                    <span style={{ color: C.faint }}> — on </span>
                    <span
                      onClick={() => c.id && openCoffee(c)}
                      style={{ color: C.ink, fontWeight: 600, cursor: c.id ? "pointer" : "default" }}
                    >{c.name || "a coffee"}</span>
                    {c.roaster && <span style={{ color: C.faint }}>, {c.roaster}</span>}
                  </div>
                  <span style={{
                    fontFamily: sans, fontSize: 10.5, color: C.faint,
                    letterSpacing: "0.06em", flexShrink: 0,
                  }}>{timeAgo(t.created)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
