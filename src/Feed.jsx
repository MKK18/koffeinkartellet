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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
      {items === null ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontFamily: sans }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 20px", color: C.muted, fontFamily: sans }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontFamily: serif, fontSize: 20, color: C.muted, marginBottom: 8 }}>Nothing brewing yet</div>
          <div style={{ fontSize: 14 }}>Tastings from everyone will show up here.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((t) => {
            const u = t.expand?.user || {};
            const c = t.expand?.coffee || {};
            const img = coffeeImageUrl(c, "100x100");
            return (
              <div key={t.id} style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 14, padding: "12px 14px", boxShadow: "0 2px 8px rgba(100,70,40,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 13 }}>
                  <span onClick={() => u.id && openProfile(u.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: u.color || C.brown, display: "inline-block" }} />
                    <strong style={{ color: u.color || C.brown }}>{u.name || "Someone"}</strong>
                  </span>
                  <span style={{ color: C.muted }}>rated</span>
                  <span style={{ fontFamily: serif, fontWeight: 700, color: u.color || C.brown }}>{Number(t.score).toFixed(1)}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: C.faint, fontSize: 11 }}>{timeAgo(t.created)}</span>
                </div>
                <div onClick={() => c.id && openCoffee(c)} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, cursor: "pointer" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, flexShrink: 0, background: img ? "transparent" : "#f0e6da", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>☕</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: serif, fontWeight: 700, color: C.ink, fontSize: 15, lineHeight: 1.2 }}>{c.name || "a coffee"}</div>
                    {c.roaster && <div style={{ fontFamily: sans, fontSize: 12, color: C.muted }}>{c.roaster}</div>}
                  </div>
                </div>
                {t.notes && <div style={{ fontSize: 13, color: "#5a4030", marginTop: 8, fontFamily: sans, whiteSpace: "pre-wrap" }}>{t.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
