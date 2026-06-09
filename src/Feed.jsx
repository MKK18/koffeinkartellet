import { useState, useEffect } from "react";
import { C, sans, serif } from "./ui.jsx";
import { useNav } from "./nav.jsx";
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
        <div style={{
          textAlign: "center", padding: "80px 24px", color: C.muted, fontFamily: sans,
        }}>
          <div style={{ fontSize: 48, marginBottom: 20, lineHeight: 1 }}>☕</div>
          <div style={{
            fontFamily: serif, fontSize: 22, fontWeight: 700, color: C.ink,
            marginBottom: 8, lineHeight: 1.3,
          }}>
            Nothing brewing yet
          </div>
          <div style={{ fontSize: 14, color: C.faint, lineHeight: 1.5 }}>
            Tastings from everyone will show up here.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((t) => {
            const u = t.expand?.user || {};
            const c = t.expand?.coffee || {};
            const img = coffeeImageUrl(c, "100x100");
            const userColor = u.color || C.brown;

            return (
              <div key={t.id} style={{
                background: C.card,
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.03)",
              }}>
                {/* Score row */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: 14,
                }}>
                  <span style={{ color: "#D4A574", fontSize: 16, lineHeight: 1 }}>★</span>
                  <span style={{
                    fontFamily: serif, fontWeight: 700, fontSize: 18,
                    color: C.ink, lineHeight: 1,
                  }}>
                    {Number(t.score).toFixed(1)}
                  </span>
                </div>

                {/* Tasting notes — the hero */}
                {t.notes ? (
                  <div style={{
                    fontFamily: sans, fontSize: 15, color: C.ink,
                    lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>
                    {t.notes}
                  </div>
                ) : (
                  <div style={{
                    fontFamily: sans, fontSize: 14, color: C.faint,
                    fontStyle: "italic", lineHeight: 1.5,
                  }}>
                    Rated without notes
                  </div>
                )}

                {/* User row */}
                <div
                  onClick={() => u.id && openProfile(u.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    marginTop: 16,
                    cursor: u.id ? "pointer" : "default",
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: userColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 11, fontWeight: 600, fontFamily: sans,
                    flexShrink: 0,
                  }}>
                    {(u.name || "?")[0].toUpperCase()}
                  </div>
                  <span style={{
                    fontFamily: sans, fontSize: 12, color: C.muted,
                  }}>
                    {u.name || "Someone"}
                  </span>
                  <span style={{ fontFamily: sans, fontSize: 12, color: C.faint }}>·</span>
                  <span style={{
                    fontFamily: sans, fontSize: 12, color: C.faint,
                  }}>
                    {timeAgo(t.created)}
                  </span>
                </div>

                {/* Coffee row */}
                <div
                  onClick={() => c.id && openCoffee(c)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginTop: 14, paddingTop: 14,
                    borderTop: "1px solid #ece3d5",
                    cursor: c.id ? "pointer" : "default",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: img ? "transparent" : "#f0e6da",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {img
                      ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 18 }}>☕</span>}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontFamily: sans, fontWeight: 500, fontSize: 13, color: C.ink,
                      lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {c.name || "a coffee"}
                    </div>
                    {c.roaster && (
                      <div style={{
                        fontFamily: sans, fontSize: 12, color: C.faint,
                        lineHeight: 1.3, marginTop: 1,
                      }}>
                        {c.roaster}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
