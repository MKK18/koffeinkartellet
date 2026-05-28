import { useState, useEffect } from "react";
import { C, sans, serif } from "./ui.jsx";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { Avatar } from "./components.jsx";
import { getUser, listTastingsByUser, coffeeImageUrl } from "./data.js";
import TasteProfile from "./TasteProfile.jsx";

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

function CoffeeWall({ items, color, onOpen }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 10 }}>Coffee wall</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {items.slice(0, 9).map((e) => {
          const img = coffeeImageUrl(e.coffee, "300x300");
          return (
            <div key={e.coffee.id} onClick={() => onOpen(e.coffee)} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 12, overflow: "hidden", background: img ? "transparent" : "#f0e6da", cursor: "pointer", border: `1px solid ${C.borderSoft}` }}>
              {img ? <img src={img} alt={e.coffee.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 30 }}>☕</div>}
              {e.count > 1 && (
                <span style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.7)", color: "#fff8f0", fontFamily: sans, fontSize: 10, padding: "2px 7px", borderRadius: 999 }}>×{e.count}</span>
              )}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 8px 6px", background: "linear-gradient(transparent, rgba(0,0,0,0.65))", color: "#fff8f0", fontFamily: sans, fontSize: 11, lineHeight: 1.2 }}>
                {e.coffee.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentTastings({ tastings, color, onOpen }) {
  if (!tastings.length) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 10 }}>Recent tastings</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tastings.slice(0, 5).map((t) => {
          const c = t.expand?.coffee || {};
          const img = coffeeImageUrl(c, "100x100");
          return (
            <div key={t.id} onClick={() => c.id && onOpen(c)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 12, cursor: "pointer" }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: img ? "transparent" : "#f0e6da", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>☕</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: sans, fontSize: 14, color: C.ink, fontWeight: 600 }}>{c.name || "a coffee"}</div>
                {c.roaster && <div style={{ fontFamily: sans, fontSize: 11, color: C.muted }}>{c.roaster}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 18, color }}>{Number(t.score).toFixed(1)}</div>
                <div style={{ fontFamily: sans, fontSize: 10, color: C.faint }}>{timeAgo(t.created)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ value, label, color = C.brown }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function avgOf(arr) { return arr.length ? arr.reduce((a, x) => a + x, 0) / arr.length : null; }

function groupAverages(tastings, key) {
  const g = {};
  tastings.forEach((t) => {
    const v = t.expand?.coffee?.[key];
    if (!v) return;
    (g[v] ||= []).push(Number(t.score));
  });
  return Object.entries(g).map(([k, v]) => ({ label: k, avg: avgOf(v), count: v.length })).sort((a, b) => b.avg - a.avg);
}

function Bars({ title, data, color }) {
  if (!data.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 10 }}>{title}</div>
      {data.slice(0, 6).map((d) => (
        <div key={d.label} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 13, color: "#3a2010", fontFamily: sans }}>{d.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: serif }}>{d.avg.toFixed(1)} <span style={{ fontSize: 10, color: C.faint, fontWeight: 400 }}>({d.count})</span></span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.borderSoft }}>
            <div style={{ height: 6, borderRadius: 3, background: color, width: `${(d.avg / 10) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// userId: whose profile. onClose: present when shown as an overlay (someone else).
export default function Profile({ userId, onClose }) {
  const { user: me } = useAuth();
  const { openCoffee } = useNav();
  const isMe = !userId || userId === me?.id;
  const [view, setView] = useState("profile"); // own profile: 'profile' | 'palate'
  const [person, setPerson] = useState(isMe ? me : null);
  const [tastings, setTastings] = useState(null);
  const [myTastings, setMyTastings] = useState(null);

  useEffect(() => {
    const id = userId || me?.id;
    (isMe ? Promise.resolve(me) : getUser(id)).then(setPerson).catch(() => {});
    listTastingsByUser(id).then(setTastings).catch(() => setTastings([]));
    if (!isMe) listTastingsByUser(me.id).then(setMyTastings).catch(() => setMyTastings([]));
  }, [userId]); // eslint-disable-line

  const color = person?.color || C.brown;
  const scores = (tastings || []).map((t) => Number(t.score)).filter((s) => s > 0);
  const avg = avgOf(scores);
  const distinctCoffees = new Set((tastings || []).map((t) => t.coffee)).size;
  const topPicks = [...(tastings || [])].sort((a, b) => b.score - a.score).slice(0, 3);

  // Distinct coffees the user has rated, with tasting count + avg, sorted by frequency.
  const tastedCoffees = (() => {
    const m = new Map();
    (tastings || []).forEach((t) => {
      const c = t.expand?.coffee; if (!c) return;
      const e = m.get(c.id) || { coffee: c, count: 0, scores: [] };
      e.count++; e.scores.push(Number(t.score));
      m.set(c.id, e);
    });
    return [...m.values()]
      .map((e) => ({ ...e, avg: e.scores.reduce((a, x) => a + x, 0) / e.scores.length }))
      .sort((a, b) => b.count - a.count || b.avg - a.avg);
  })();

  // comparison: coffees both have rated
  let comparison = null;
  if (!isMe && myTastings) {
    const mineByCoffee = {};
    myTastings.forEach((t) => { (mineByCoffee[t.coffee] ||= []).push(Number(t.score)); });
    const rows = [];
    const seen = new Set();
    (tastings || []).forEach((t) => {
      if (seen.has(t.coffee)) return;
      const mine = mineByCoffee[t.coffee];
      if (!mine) return;
      seen.add(t.coffee);
      const theirAvg = avgOf((tastings).filter((x) => x.coffee === t.coffee).map((x) => Number(x.score)));
      rows.push({ name: t.expand?.coffee?.name || "a coffee", coffee: t.expand?.coffee, them: theirAvg, me: avgOf(mine) });
    });
    comparison = rows;
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Avatar user={person} size={52} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontFamily: serif, fontSize: 24, color: C.ink }}>{person?.name || "…"}{person?.is_admin && <span style={{ fontSize: 10, background: C.brown, color: "#fff8f0", padding: "2px 7px", borderRadius: 8, letterSpacing: "0.06em", marginLeft: 8, verticalAlign: "middle" }}>ADMIN</span>}</h2>
          {person?.bio && <div style={{ fontSize: 13, color: C.muted, fontFamily: sans, marginTop: 2 }}>{person.bio}</div>}
        </div>
        {onClose && <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 26, color: C.muted, cursor: "pointer" }}>×</button>}
      </div>

      <div style={{ display: "flex", background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 14, padding: "16px 8px", marginBottom: 20 }}>
        <Stat value={tastings?.length ?? "—"} label="Tastings" color={color} />
        <Stat value={avg ? avg.toFixed(1) : "—"} label="Avg score" color={color} />
        <Stat value={distinctCoffees || "—"} label="Coffees" color={color} />
      </div>

      {isMe && (
        <div style={{ display: "flex", gap: 6, background: C.tint, border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {[["profile", "My taste"], ["palate", "Household taste"]].map(([id, label]) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => setView(id)} style={{
                flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                fontFamily: sans, fontSize: 13, fontWeight: active ? 600 : 500,
                background: active ? C.card : "transparent", color: active ? C.brown : C.muted,
                boxShadow: active ? "0 1px 4px rgba(100,70,40,0.12)" : "none",
              }}>{label}</button>
            );
          })}
        </div>
      )}

      {isMe && view === "palate" && <TasteProfile />}

      {(!isMe || view === "profile") && (<>

      {comparison && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 10 }}>You &amp; {person?.name}</div>
          {comparison.length === 0 ? (
            <div style={{ fontFamily: sans, fontSize: 13, color: C.muted }}>No coffees you've both rated yet.</div>
          ) : comparison.map((r) => {
            const delta = Math.abs(r.me - r.them);
            return (
              <div key={r.name} onClick={() => r.coffee && openCoffee(r.coffee)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #ecddd0", cursor: "pointer" }}>
                <div style={{ flex: 1, fontFamily: sans, fontSize: 14, color: C.ink }}>{r.name}</div>
                <span style={{ fontFamily: serif, fontWeight: 700, color: C.brown }}>{r.me.toFixed(1)}</span>
                <span style={{ color: C.faint, fontSize: 12 }}>vs</span>
                <span style={{ fontFamily: serif, fontWeight: 700, color }}>{r.them.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: delta <= 0.5 ? "#4a7a50" : delta >= 2 ? "#b07060" : C.faint, fontFamily: sans, minWidth: 54, textAlign: "right" }}>
                  {delta <= 0.5 ? "agree" : `Δ ${delta.toFixed(1)}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <CoffeeWall items={tastedCoffees} color={color} onOpen={openCoffee} />
      <RecentTastings tastings={tastings || []} color={color} onOpen={openCoffee} />

      {topPicks.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 10 }}>{isMe ? "Your" : `${person?.name}'s`} top picks</div>
          {topPicks.map((t) => (
            <div key={t.id} onClick={() => t.expand?.coffee && openCoffee(t.expand.coffee)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #ecddd0", cursor: "pointer" }}>
              <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 18, color, minWidth: 36 }}>{Number(t.score).toFixed(1)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: sans, fontSize: 14, color: C.ink }}>{t.expand?.coffee?.name || "a coffee"}</div>
                {t.expand?.coffee?.roaster && <div style={{ fontFamily: sans, fontSize: 11, color: C.muted }}>{t.expand.coffee.roaster}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Bars title={`${isMe ? "Your" : "Their"} favourite origins`} data={groupAverages(tastings || [], "origin")} color={color} />
      <Bars title="By process" data={groupAverages(tastings || [], "process")} color={color} />
      </>)}
    </div>
  );
}
