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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 12px" }}>
      {items === null ? (
        <div style={{
          textAlign: "center", padding: 60, color: C.muted, fontFamily: sans,
          fontSize: 14, letterSpacing: "0.02em",
        }}>
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "72px 24px", color: C.muted, fontFamily: sans,
          background: C.card, borderRadius: 20, border: `1px solid ${C.borderSoft}`,
          boxShadow: "0 2px 12px rgba(100,70,40,0.04)",
        }}>
          <div style={{ fontSize: 44, marginBottom: 16, lineHeight: 1 }}>📭</div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((t) => {
            const u = t.expand?.user || {};
            const c = t.expand?.coffee || {};
            const img = coffeeImageUrl(c, "100x100");
            const userColor = u.color || C.brown;

            return (
              <div key={t.id} style={{
                background: C.card,
                border: `1px solid ${C.borderSoft}`,
                borderRadius: 16,
                padding: "16px 18px",
                boxShadow: "0 1px 4px rgba(100,70,40,0.04), 0 4px 16px rgba(100,70,40,0.03)",
              }}>
                {/* Header: avatar + name ... time */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  fontFamily: sans, fontSize: 13,
                }}>
                  <div
                    onClick={() => u.id && openProfile(u.id)}
                    style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: userColor,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: sans,
                      cursor: u.id ? "pointer" : "default",
                      flexShrink: 0,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {(u.name || "?")[0].toUpperCase()}
                  </div>
                  <span
                    onClick={() => u.id && openProfile(u.id)}
                    style={{
                      fontWeight: 700, color: userColor,
                      cursor: u.id ? "pointer" : "default",
                      fontSize: 14,
                    }}
                  >
                    {u.name || "Someone"}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: C.faint, fontSize: 11, fontFamily: sans }}>
                    {timeAgo(t.created)}
                  </span>
                </div>

                {/* Score */}
                <div style={{
                  margin: "14px 0 12px",
                  display: "flex", alignItems: "baseline", gap: 2,
                }}>
                  <span style={{
                    fontFamily: serif, fontWeight: 800, fontSize: 32,
                    color: userColor, lineHeight: 1, letterSpacing: "-0.02em",
                  }}>
                    {Number(t.score).toFixed(1)}
                  </span>
                  <span style={{
                    fontFamily: sans, fontSize: 13, fontWeight: 500,
                    color: C.faint, marginLeft: 2,
                  }}>
                    /10
                  </span>
                </div>

                {/* Coffee row */}
                <div
                  onClick={() => c.id && openCoffee(c)}
                  style={{
                    display: "flex", gap: 12, alignItems: "center",
                    cursor: c.id ? "pointer" : "default",
                    padding: "10px 12px",
                    background: C.tint,
                    borderRadius: 12,
                    border: `1px solid ${C.borderSoft}`,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    background: img ? "transparent" : "#f0e6da",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {img
                      ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 22 }}>☕</span>}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontFamily: serif, fontWeight: 700, color: C.ink,
                      fontSize: 15, lineHeight: 1.25,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {c.name || "a coffee"}
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      marginTop: 2,
                    }}>
                      {c.roaster && (
                        <span style={{ fontFamily: sans, fontSize: 12, color: C.muted, lineHeight: 1.3 }}>
                          {c.roaster}
                        </span>
                      )}
                      {t.brew_method && (
                        <span style={{
                          fontFamily: sans, fontSize: 10, fontWeight: 600,
                          color: C.faint, textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          background: C.card,
                          border: `1px solid ${C.borderSoft}`,
                          borderRadius: 6, padding: "2px 7px",
                          lineHeight: 1.4,
                        }}>
                          {t.brew_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {t.notes && (
                  <div style={{
                    fontSize: 13, color: "#5a4030", lineHeight: 1.55,
                    marginTop: 12, paddingLeft: 2,
                    fontFamily: sans, whiteSpace: "pre-wrap",
                  }}>
                    {t.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
