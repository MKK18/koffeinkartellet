import { useState, useEffect } from "react";
import { C, sans, serif, inputStyle, labelStyle, primaryBtn, ghostBtn } from "./ui.jsx";
import { Sheet, SectionHead, Pill, Spinner } from "./components.jsx";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { listTastingsForCoffee, createTasting, updateTasting, deleteTasting, coffeeImageUrl } from "./data.js";

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 13, fontFamily: sans, color: "#3a2010", lineHeight: 1.5 }}>
      <span style={{ color: C.faint, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 64, paddingTop: 2 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_T = { score: 7, grind: "", brew_method: "", notes: "", tasted_on: today() };

export default function CoffeeDetail({ coffee, onClose, onEdit }) {
  const { user } = useAuth();
  const { openProfile, bumpData } = useNav();
  const [tastings, setTastings] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_T);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setTastings(await listTastingsForCoffee(coffee.id));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [coffee.id]);

  const scores = (tastings || []).map((t) => Number(t.score)).filter((s) => s > 0);
  const avg = scores.length ? (scores.reduce((a, x) => a + x, 0) / scores.length).toFixed(1) : null;

  // per-person averages
  const byPerson = {};
  (tastings || []).forEach((t) => {
    const u = t.expand?.user;
    if (!u) return;
    (byPerson[u.id] ||= { name: u.name, color: u.color || C.brown, scores: [] }).scores.push(Number(t.score));
  });

  const startAdd = () => { setDraft({ ...EMPTY_T }); setEditId(null); setAdding(true); };
  const startEdit = (t) => {
    setDraft({ score: t.score, grind: t.grind || "", brew_method: t.brew_method || "", notes: t.notes || "", tasted_on: (t.tasted_on || "").split(" ")[0] || today() });
    setEditId(t.id); setAdding(true);
  };
  const saveTasting = async () => {
    setBusy(true);
    try {
      const payload = { ...draft, coffee: coffee.id, grind: draft.grind === "" ? null : Number(draft.grind), score: Number(draft.score) };
      if (editId) await updateTasting(editId, payload);
      else await createTasting(payload);
      setAdding(false); setEditId(null);
      await load(); bumpData();
    } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!confirm("Remove this tasting?")) return;
    await deleteTasting(id); await load(); bumpData();
  };

  const img = coffeeImageUrl(coffee, "300x300");

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: serif, fontSize: 24, color: C.ink, lineHeight: 1.2 }}>{coffee.name}</h2>
          {coffee.roaster && <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontFamily: sans }}>{coffee.roaster}</div>}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 26, color: C.muted, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
        {img ? (
          <img src={img} alt="package" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12, flexShrink: 0, border: `1.5px solid ${C.border}` }} />
        ) : (
          <div style={{ width: 100, height: 100, background: "#f0e6da", borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 34 }}>☕</span></div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <Fact label="Origin" value={[coffee.origin, coffee.region].filter(Boolean).join(", ")} />
          <Fact label="Producer" value={coffee.producer} />
          <Fact label="Varietal" value={coffee.varietal} />
          <Fact label="Process" value={[coffee.process, coffee.roast_level].filter(Boolean).join(" · ")} />
          <Fact label="Altitude" value={coffee.altitude ? `${coffee.altitude} masl` : ""} />
          <Fact label="Harvest" value={coffee.harvest} />
        </div>
      </div>

      {coffee.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
          {coffee.tags.map((t) => <Pill key={t} green>{t}</Pill>)}
        </div>
      )}
      {coffee.bag_notes && (
        <div style={{ fontSize: 13, color: "#5a4030", fontFamily: sans, lineHeight: 1.55, fontStyle: "italic", padding: "12px 14px", background: C.tint, borderRadius: 10, borderLeft: "3px solid #d4b896", marginTop: 14 }}>{coffee.bag_notes}</div>
      )}

      <SectionHead title="Tastings" />
      {tastings === null ? (
        <div style={{ color: C.muted, fontFamily: sans, fontSize: 13, padding: 12 }}><Spinner /> Loading…</div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: C.tint, borderRadius: 14, padding: "14px 18px", border: "1.5px solid #f0e0d0", marginBottom: 14 }}>
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ fontSize: 38, fontFamily: serif, fontWeight: 700, color: avg ? C.brown : "#d4c5b5", lineHeight: 1 }}>{avg || "—"}</div>
              <div style={{ fontSize: 9, color: C.brown, opacity: 0.7, fontFamily: sans, letterSpacing: "0.1em" }}>{avg ? "AVG" : ""}</div>
            </div>
            <div style={{ flex: 1, fontFamily: sans, fontSize: 13, lineHeight: 1.6 }}>
              {tastings.length === 0 ? (
                <span style={{ color: C.muted }}>No tastings yet — brew a cup and log the first one ↓</span>
              ) : (
                <>
                  <div style={{ fontWeight: 600, color: "#3a2010" }}>{tastings.length} {tastings.length === 1 ? "tasting" : "tastings"}</div>
                  {Object.values(byPerson).map((p) => (
                    <div key={p.name} style={{ color: p.color }}>{p.name} · {(p.scores.reduce((a, x) => a + x, 0) / p.scores.length).toFixed(1)} <span style={{ color: C.faint }}>({p.scores.length})</span></div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tastings.map((t) => {
              const u = t.expand?.user || {};
              const mine = u.id === user?.id;
              return (
                <div key={t.id} style={{ background: "#fdf4ee", border: "1px solid #f0e0d0", borderLeft: `4px solid ${u.color || C.brown}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: sans }}>
                    <span onClick={() => u.id && openProfile(u.id)} style={{ color: u.color || C.brown, fontWeight: 700, fontSize: 13, cursor: u.id ? "pointer" : "default" }}>{u.name || "Someone"}</span>
                    <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 18, color: u.color || C.brown }}>{Number(t.score).toFixed(1)}</span>
                    <span style={{ fontSize: 11, color: C.faint }}>/ 10</span>
                    {t.grind && <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 10, background: C.card, color: C.muted, border: `1px solid ${C.border}` }}>Grind {t.grind}</span>}
                    {t.brew_method && <span style={{ fontSize: 11, color: C.muted }}>{t.brew_method}</span>}
                    <span style={{ flex: 1 }} />
                    {(t.tasted_on || "").split(" ")[0] && <span style={{ fontSize: 11, color: C.faint }}>{(t.tasted_on || "").split(" ")[0]}</span>}
                    {mine && <button onClick={() => startEdit(t)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>edit</button>}
                    {mine && <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "#b89880", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>}
                  </div>
                  {t.notes && <div style={{ fontSize: 12, color: "#5a4030", marginTop: 6, fontFamily: sans, whiteSpace: "pre-wrap" }}>{t.notes}</div>}
                </div>
              );
            })}
          </div>

          {adding ? (
            <div style={{ background: C.card, border: `2px solid ${user?.color || C.brown}`, borderRadius: 14, padding: 16, marginTop: 12 }}>
              <label style={labelStyle}>Score: {Number(draft.score).toFixed(1)} / 10</label>
              <input type="range" min="1" max="10" step="0.5" value={draft.score} onChange={(e) => setDraft((d) => ({ ...d, score: e.target.value }))} style={{ width: "100%", accentColor: user?.color || C.brown, marginBottom: 14 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div><label style={labelStyle}>Grind</label><input style={inputStyle} value={draft.grind} onChange={(e) => setDraft((d) => ({ ...d, grind: e.target.value }))} placeholder="e.g. 18" /></div>
                <div><label style={labelStyle}>Brew method</label><input style={inputStyle} value={draft.brew_method} onChange={(e) => setDraft((d) => ({ ...d, brew_method: e.target.value }))} placeholder="V60, Aeropress…" /></div>
              </div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={{ ...inputStyle, marginBottom: 14 }} value={draft.tasted_on} onChange={(e) => setDraft((d) => ({ ...d, tasted_on: e.target.value }))} />
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", marginBottom: 14 }} value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="What stood out…" />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { setAdding(false); setEditId(null); }} style={ghostBtn}>Cancel</button>
                <button onClick={saveTasting} disabled={busy} style={primaryBtn(!busy)}>{busy ? "Saving…" : "Save tasting"}</button>
              </div>
            </div>
          ) : (
            <button onClick={startAdd} style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, border: `1.5px dashed ${C.brown}`, background: "transparent", color: C.brown, fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>+ Add tasting</button>
          )}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid #ecddd0" }}>
        <button onClick={onEdit} style={ghostBtn}>✎ Edit coffee info</button>
      </div>
    </Sheet>
  );
}
