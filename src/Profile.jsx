import { useState, useEffect } from "react";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { Avatar } from "./components.jsx";
import { getUser, listTastingsByUser, coffeeImageUrl } from "./data.js";
import TasteProfile from "./TasteProfile.jsx";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";
const BODY = "var(--font-body)";
const label10 = { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--dim)", fontFamily: MONO, marginBottom: 12 };

const Cup = ({ s = 26 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="var(--dim-2)" strokeWidth="1.3"><path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 10h2a2 2 0 0 1 0 4h-2" /></svg>);

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

function CoffeeWall({ items, onOpen }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={label10}>Coffee wall</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {items.slice(0, 9).map((e) => {
          const img = coffeeImageUrl(e.coffee, "300x300");
          return (
            <div key={e.coffee.id} onClick={() => onOpen(e.coffee)} style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "var(--ink-2)", cursor: "pointer", border: "1px solid var(--ink-line)" }}>
              {img ? <img src={img} alt={e.coffee.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><Cup s={28} /></div>}
              {e.count > 1 && <span className="tnum" style={{ position: "absolute", top: 6, right: 6, background: "var(--stamp)", color: "#fff", fontFamily: MONO, fontSize: 10, padding: "2px 6px" }}>×{e.count}</span>}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 8px 6px", background: "linear-gradient(transparent, rgba(6,4,3,0.9))", color: "var(--bone)", fontFamily: MONO, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.2 }}>{e.coffee.name}</div>
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
    <div style={{ marginBottom: 24 }}>
      <div style={label10}>Recent tastings</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tastings.slice(0, 5).map((t) => {
          const c = t.expand?.coffee || {};
          const img = coffeeImageUrl(c, "100x100");
          return (
            <div key={t.id} onClick={() => c.id && onOpen(c)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--ink-2)", border: "1px solid var(--ink-line)", cursor: "pointer" }}>
              <div style={{ width: 44, height: 44, flexShrink: 0, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid var(--ink-line)" }}>
                {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Cup s={20} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: BODY, fontSize: 14, color: "var(--bone)", fontWeight: 700 }}>{c.name || "a coffee"}</div>
                {c.roaster && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: "var(--dim)" }}>{c.roaster}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="tnum" style={{ fontFamily: DISPLAY, fontSize: 20, color }}>{Number(t.score).toFixed(1)}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--dim-2)" }}>{timeAgo(t.created)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ value, label, color = "var(--stamp)" }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div className="tnum" style={{ fontFamily: DISPLAY, fontSize: 30, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--dim)", marginTop: 6 }}>{label}</div>
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
    <div style={{ marginBottom: 20 }}>
      <div style={label10}>{title}</div>
      {data.slice(0, 6).map((d) => (
        <div key={d.label} style={{ marginBottom: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--manila)", fontFamily: BODY }}>{d.label}</span>
            <span className="tnum" style={{ fontSize: 14, color, fontFamily: DISPLAY }}>{d.avg.toFixed(1)} <span style={{ fontSize: 10, color: "var(--dim-2)", fontFamily: MONO }}>({d.count})</span></span>
          </div>
          <div style={{ height: 6, background: "var(--ink-line)" }}>
            <div style={{ height: 6, background: color, width: `${(d.avg / 10) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Profile({ userId, onClose }) {
  const { user: me } = useAuth();
  const { openCoffee } = useNav();
  const isMe = !userId || userId === me?.id;
  const [view, setView] = useState("profile");
  const [person, setPerson] = useState(isMe ? me : null);
  const [tastings, setTastings] = useState(null);
  const [myTastings, setMyTastings] = useState(null);

  useEffect(() => {
    const id = userId || me?.id;
    (isMe ? Promise.resolve(me) : getUser(id)).then(setPerson).catch(() => {});
    listTastingsByUser(id).then(setTastings).catch(() => setTastings([]));
    if (!isMe) listTastingsByUser(me.id).then(setMyTastings).catch(() => setMyTastings([]));
  }, [userId]); // eslint-disable-line

  const color = person?.color || "var(--stamp)";
  const scores = (tastings || []).map((t) => Number(t.score)).filter((s) => s > 0);
  const avg = avgOf(scores);
  const distinctCoffees = new Set((tastings || []).map((t) => t.coffee)).size;
  const topPicks = [...(tastings || [])].sort((a, b) => b.score - a.score).slice(0, 3);

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
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px var(--gut)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Avatar user={person} size={52} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 26, fontWeight: 400, textTransform: "uppercase", color: "var(--bone)" }}>{person?.name || "…"}{person?.is_admin && <span style={{ fontSize: 9, background: "var(--stamp)", color: "#fff", padding: "2px 7px", letterSpacing: "0.12em", fontFamily: MONO, marginLeft: 8, verticalAlign: "middle" }}>ADMIN</span>}</h2>
          {person?.bio && <div style={{ fontSize: 12, color: "var(--dim)", fontFamily: MONO, letterSpacing: "0.04em", marginTop: 4 }}>{person.bio}</div>}
        </div>
        {onClose && <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 24, color: "var(--dim)", cursor: "pointer" }}>×</button>}
      </div>

      <div style={{ display: "flex", background: "var(--ink-2)", border: "1px solid var(--ink-line)", padding: "18px 8px", marginBottom: 20 }}>
        <Stat value={tastings?.length ?? "—"} label="Tastings" color={color} />
        <Stat value={avg ? avg.toFixed(1) : "—"} label="Avg score" color={color} />
        <Stat value={distinctCoffees || "—"} label="Coffees" color={color} />
      </div>

      {isMe && (
        <div style={{ display: "flex", gap: 4, border: "1px solid var(--ink-line)", padding: 4, marginBottom: 22 }}>
          {[["profile", "My taste"], ["palate", "Household taste"]].map(([id, txt]) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => setView(id)} style={{
                flex: 1, padding: "10px 4px", border: "none", cursor: "pointer",
                fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
                background: active ? "var(--stamp)" : "transparent", color: active ? "#fff" : "var(--dim)",
              }}>{txt}</button>
            );
          })}
        </div>
      )}

      {isMe && view === "palate" && <TasteProfile />}

      {(!isMe || view === "profile") && (<>
        {comparison && (
          <div style={{ marginBottom: 24 }}>
            <div style={label10}>You &amp; {person?.name}</div>
            {comparison.length === 0 ? (
              <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--dim)" }}>No coffees you've both rated yet.</div>
            ) : comparison.map((r) => {
              const delta = Math.abs(r.me - r.them);
              return (
                <div key={r.name} onClick={() => r.coffee && openCoffee(r.coffee)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--ink-line)", cursor: "pointer" }}>
                  <div style={{ flex: 1, fontFamily: BODY, fontSize: 14, color: "var(--bone)" }}>{r.name}</div>
                  <span className="tnum" style={{ fontFamily: DISPLAY, color: "var(--stamp)" }}>{r.me.toFixed(1)}</span>
                  <span style={{ color: "var(--dim-2)", fontSize: 11, fontFamily: MONO }}>vs</span>
                  <span className="tnum" style={{ fontFamily: DISPLAY, color }}>{r.them.toFixed(1)}</span>
                  <span style={{ fontSize: 10, color: delta <= 0.5 ? "var(--ok)" : delta >= 2 ? "var(--stamp)" : "var(--dim)", fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 54, textAlign: "right" }}>
                    {delta <= 0.5 ? "agree" : `Δ ${delta.toFixed(1)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <CoffeeWall items={tastedCoffees} onOpen={openCoffee} />
        <RecentTastings tastings={tastings || []} color={color} onOpen={openCoffee} />

        {topPicks.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={label10}>{isMe ? "Your" : `${person?.name}'s`} top picks</div>
            {topPicks.map((t) => (
              <div key={t.id} onClick={() => t.expand?.coffee && openCoffee(t.expand.coffee)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--ink-line)", cursor: "pointer" }}>
                <span className="tnum" style={{ fontFamily: DISPLAY, fontSize: 20, color, minWidth: 40 }}>{Number(t.score).toFixed(1)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: BODY, fontSize: 14, color: "var(--bone)", fontWeight: 700 }}>{t.expand?.coffee?.name || "a coffee"}</div>
                  {t.expand?.coffee?.roaster && <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--dim)" }}>{t.expand.coffee.roaster}</div>}
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
