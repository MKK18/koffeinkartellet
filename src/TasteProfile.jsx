import { useState, useEffect } from "react";
import { useAuth } from "./auth.jsx";
import { getMyHousehold, listTastingsExpanded } from "./data.js";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";
const BODY = "var(--font-body)";
const label10 = { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--dim)", fontFamily: MONO, marginBottom: 12 };

function avg(arr) { return arr.length ? arr.reduce((a, x) => a + x, 0) / arr.length : null; }

function accumulate(tastings, memberIds, meId, pick) {
  const mine = {}, house = {};
  tastings.forEach((t) => {
    const s = Number(t.score);
    if (!s) return;
    const c = t.expand?.coffee;
    if (!c) return;
    const vals = pick(c);
    const list = Array.isArray(vals) ? vals : (vals ? [vals] : []);
    list.forEach((v) => {
      if (memberIds.includes(t.user)) (house[v] ||= []).push(s);
      if (t.user === meId) (mine[v] ||= []).push(s);
    });
  });
  return { mine, house };
}

function Comparison({ title, mineColor, rows }) {
  if (!rows.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={label10}>{title}</div>
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
            <span style={{ fontSize: 14, color: "var(--bone)", fontFamily: BODY }}>{r.label}</span>
            <span style={{ fontFamily: MONO, fontSize: 12 }}>
              <b className="tnum" style={{ color: mineColor, fontFamily: DISPLAY, fontSize: 16 }}>{r.me != null ? r.me.toFixed(1) : "—"}</b>
              <span style={{ color: "var(--dim-2)" }}> vs </span>
              <b className="tnum" style={{ color: "var(--manila)", fontFamily: DISPLAY, fontSize: 16 }}>{r.house != null ? r.house.toFixed(1) : "—"}</b>
              {r.delta != null && (
                <span className="tnum" style={{ marginLeft: 8, color: Math.abs(r.delta) < 0.4 ? "var(--dim-2)" : r.delta > 0 ? "var(--ok)" : "var(--stamp)" }}>
                  {r.delta > 0 ? "+" : ""}{r.delta.toFixed(1)}
                </span>
              )}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ height: 5, background: "var(--ink-line)" }}><div style={{ height: 5, background: mineColor, width: `${((r.me || 0) / 10) * 100}%` }} /></div>
            <div style={{ height: 5, background: "var(--ink-line)" }}><div style={{ height: 5, background: "var(--manila)", width: `${((r.house || 0) / 10) * 100}%`, opacity: 0.6 }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TasteProfile() {
  const { user } = useAuth();
  const [household, setHousehold] = useState(undefined);
  const [tastings, setTastings] = useState(null);

  useEffect(() => {
    getMyHousehold().then(setHousehold).catch(() => setHousehold(null));
    listTastingsExpanded().then(setTastings).catch(() => setTastings([]));
  }, []);

  if (household === undefined || tastings === null) {
    return <div style={{ padding: 24, textAlign: "center", color: "var(--dim)", fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>Loading your palate…</div>;
  }

  const meId = user?.id;
  const memberIds = household?.memberIds || [meId];
  const others = (household?.members || []).filter((m) => m.id !== meId);
  const myColor = user?.color || "var(--stamp)";

  const rowsFor = (pick) => {
    const { mine, house } = accumulate(tastings, memberIds, meId, pick);
    const labels = new Set([...Object.keys(mine), ...Object.keys(house)]);
    return [...labels].map((label) => {
      const me = avg(mine[label] || []);
      const ho = avg(house[label] || []);
      return { label, me, house: ho, delta: me != null && ho != null ? me - ho : null };
    })
      .filter((r) => r.me != null)
      .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
      .slice(0, 8);
  };

  const tagRows = rowsFor((c) => c.tags || []);
  const processRows = rowsFor((c) => c.process);
  const originRows = rowsFor((c) => c.origin);

  const myTastingCount = tastings.filter((t) => t.user === meId).length;

  if (myTastingCount === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: MONO }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 24, color: "var(--bone)", textTransform: "uppercase", marginBottom: 8 }}>No palate on file</div>
        <div style={{ fontSize: 12, color: "var(--dim)", letterSpacing: "0.04em", lineHeight: 1.6 }}>Rate a few coffees and your taste profile builds itself here.</div>
      </div>
    );
  }

  const topDiff = tagRows.filter((r) => r.delta != null).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  return (
    <div>
      <div style={{ background: "var(--ink-2)", border: "1px solid var(--ink-line)", padding: "16px 18px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ width: 14, height: 14, background: myColor, display: "inline-block" }} />
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--bone)" }}>You</span>
          <span style={{ color: "var(--dim-2)", fontSize: 11, fontFamily: MONO }}>vs</span>
          <span style={{ width: 14, height: 14, background: "var(--manila)", display: "inline-block", opacity: 0.6 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--manila)" }}>{household?.group?.name || "Household"}{others.length ? ` (${memberIds.length})` : ""}</span>
        </div>
        {others.length === 0 ? (
          <div style={{ fontFamily: BODY, fontSize: 13, color: "var(--dim)", lineHeight: 1.5 }}>
            You're the only one in your household so far — invite someone (avatar → Invites) and this becomes a real palate face-off.
          </div>
        ) : topDiff && Math.abs(topDiff.delta) >= 0.4 ? (
          <div style={{ fontFamily: BODY, fontSize: 13, color: "var(--bone)", lineHeight: 1.5 }}>
            Biggest difference: you rate <b style={{ color: myColor }}>{topDiff.label}</b> coffees <b>{topDiff.delta > 0 ? "higher" : "lower"}</b> than the household ({topDiff.delta > 0 ? "+" : ""}{topDiff.delta.toFixed(1)}).
          </div>
        ) : (
          <div style={{ fontFamily: BODY, fontSize: 13, color: "var(--dim)" }}>Your palate tracks closely with the household's.</div>
        )}
      </div>

      <Comparison title="By flavour" mineColor={myColor} rows={tagRows} />
      <Comparison title="By process" mineColor={myColor} rows={processRows} />
      <Comparison title="By origin" mineColor={myColor} rows={originRows} />

      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dim-2)", textAlign: "center", marginTop: 8 }}>
        Top bar = your average · bottom bar = household average
      </div>
    </div>
  );
}
