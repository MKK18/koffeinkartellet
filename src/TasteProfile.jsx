import { useState, useEffect } from "react";
import { C, sans, serif } from "./ui.jsx";
import { useAuth } from "./auth.jsx";
import { getMyHousehold, listTastingsExpanded } from "./data.js";

function avg(arr) { return arr.length ? arr.reduce((a, x) => a + x, 0) / arr.length : null; }

// Build {dimensionValue: [scores]} for mine and household, from tastings whose
// coffee carries that dimension. `pick` returns a string or array of strings.
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
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 12 }}>{title}</div>
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <span style={{ fontSize: 14, color: C.ink, fontFamily: sans }}>{r.label}</span>
            <span style={{ fontFamily: sans, fontSize: 12 }}>
              <strong style={{ color: mineColor, fontFamily: serif, fontSize: 15 }}>{r.me != null ? r.me.toFixed(1) : "—"}</strong>
              <span style={{ color: C.faint }}> vs </span>
              <strong style={{ color: C.muted, fontFamily: serif, fontSize: 15 }}>{r.house != null ? r.house.toFixed(1) : "—"}</strong>
              {r.delta != null && (
                <span style={{ marginLeft: 8, color: Math.abs(r.delta) < 0.4 ? C.faint : r.delta > 0 ? "#4a7a50" : "#b07060" }}>
                  {r.delta > 0 ? "+" : ""}{r.delta.toFixed(1)}
                </span>
              )}
            </span>
          </div>
          {/* two thin bars: yours over household's */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ height: 5, borderRadius: 3, background: C.borderSoft }}>
              <div style={{ height: 5, borderRadius: 3, background: mineColor, width: `${((r.me || 0) / 10) * 100}%` }} />
            </div>
            <div style={{ height: 5, borderRadius: 3, background: C.borderSoft }}>
              <div style={{ height: 5, borderRadius: 3, background: C.muted, width: `${((r.house || 0) / 10) * 100}%`, opacity: 0.6 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TasteProfile() {
  const { user } = useAuth();
  const [household, setHousehold] = useState(undefined); // undefined=loading, null=none
  const [tastings, setTastings] = useState(null);

  useEffect(() => {
    getMyHousehold().then(setHousehold).catch(() => setHousehold(null));
    listTastingsExpanded().then(setTastings).catch(() => setTastings([]));
  }, []);

  if (household === undefined || tastings === null) {
    return <div style={{ padding: 24, textAlign: "center", color: C.muted, fontFamily: sans }}>Loading your palate…</div>;
  }

  const meId = user?.id;
  const memberIds = household?.memberIds || [meId];
  const others = (household?.members || []).filter((m) => m.id !== meId);
  const myColor = user?.color || C.brown;

  // Build comparison rows for a dimension, sorted by biggest divergence first.
  const rowsFor = (pick) => {
    const { mine, house } = accumulate(tastings, memberIds, meId, pick);
    const labels = new Set([...Object.keys(mine), ...Object.keys(house)]);
    return [...labels].map((label) => {
      const me = avg(mine[label] || []);
      const ho = avg(house[label] || []);
      return { label, me, house: ho, delta: me != null && ho != null ? me - ho : null };
    })
      .filter((r) => r.me != null) // only things you've actually rated
      .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
      .slice(0, 8);
  };

  const tagRows = rowsFor((c) => c.tags || []);
  const processRows = rowsFor((c) => c.process);
  const originRows = rowsFor((c) => c.origin);

  const myTastingCount = tastings.filter((t) => t.user === meId).length;

  if (myTastingCount === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted, fontFamily: sans }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>👅</div>
        <div style={{ fontFamily: serif, fontSize: 20, color: C.muted, marginBottom: 6 }}>No palate yet</div>
        <div style={{ fontSize: 14 }}>Rate a few coffees and your taste profile will build itself here.</div>
      </div>
    );
  }

  // Headline insight: where you most diverge from the household on flavour.
  const topDiff = tagRows.filter((r) => r.delta != null).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  return (
    <div>
      <div style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 14, padding: "16px 18px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: myColor, display: "inline-block" }} />
          <span style={{ fontFamily: sans, fontSize: 13, color: C.ink }}><strong>You</strong></span>
          <span style={{ color: C.faint, fontSize: 12 }}>vs</span>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.muted, display: "inline-block", opacity: 0.6 }} />
          <span style={{ fontFamily: sans, fontSize: 13, color: C.muted }}>{household?.group?.name || "Household"}{others.length ? ` (${memberIds.length})` : ""}</span>
        </div>
        {others.length === 0 ? (
          <div style={{ fontFamily: sans, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
            You're the only one in your household so far — invite someone (You → Invites) and this becomes a real palate face-off. For now it's just your own taste.
          </div>
        ) : topDiff && Math.abs(topDiff.delta) >= 0.4 ? (
          <div style={{ fontFamily: sans, fontSize: 13, color: C.ink, lineHeight: 1.5 }}>
            Biggest difference: you rate <strong style={{ color: myColor }}>{topDiff.label}</strong> coffees{" "}
            <strong>{topDiff.delta > 0 ? "higher" : "lower"}</strong> than the household ({topDiff.delta > 0 ? "+" : ""}{topDiff.delta.toFixed(1)}).
          </div>
        ) : (
          <div style={{ fontFamily: sans, fontSize: 13, color: C.muted }}>Your palate tracks closely with the household's.</div>
        )}
      </div>

      <Comparison title="By flavour" mineColor={myColor} rows={tagRows} />
      <Comparison title="By process" mineColor={myColor} rows={processRows} />
      <Comparison title="By origin" mineColor={myColor} rows={originRows} />

      <div style={{ fontFamily: sans, fontSize: 11, color: C.faint, textAlign: "center", marginTop: 8 }}>
        Top bar = your average score · bottom bar = household average
      </div>
    </div>
  );
}
