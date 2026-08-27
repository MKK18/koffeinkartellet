import { useState, useEffect } from "react";
import { Sheet, SectionHead, Spinner, SHEET_PAD_X_WIDE, SHEET_PAD_X_NARROW } from "./components.jsx";
import { useIsWide } from "./useMediaQuery.js";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { listTastingsForCoffee, createTasting, updateTasting, deleteTasting, coffeeImageUrl } from "./data.js";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";
const BODY = "var(--font-body)";

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dim)", fontFamily: MONO, lineHeight: 1.3 }}>{label}</span>
      <span style={{ fontSize: 15, fontFamily: BODY, color: "var(--bone)", lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_T = { score: 7, grind: "", brew_method: "", notes: "", tasted_on: today() };

export default function CoffeeDetail({ coffee, onClose, onEdit }) {
  const { user } = useAuth();
  const { openProfile, bumpData } = useNav();
  const wide = useIsWide();
  const padX = wide ? SHEET_PAD_X_WIDE : SHEET_PAD_X_NARROW;
  const [tastings, setTastings] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_T);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setTastings(await listTastingsForCoffee(coffee.id));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [coffee.id]);

  const scores = (tastings || []).map((t) => Number(t.score)).filter((s) => s > 0);
  const avg = scores.length ? (scores.reduce((a, x) => a + x, 0) / scores.length).toFixed(1) : null;

  const byPerson = {};
  (tastings || []).forEach((t) => {
    const u = t.expand?.user;
    if (!u) return;
    (byPerson[u.id] ||= { name: u.name, color: u.color || "var(--stamp)", scores: [] }).scores.push(Number(t.score));
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

  const img = coffeeImageUrl(coffee, "600x600");
  const personList = Object.values(byPerson);

  return (
    <Sheet onClose={onClose}>
      <button onClick={onClose} aria-label="Close" style={{
        position: "absolute", top: 14, right: 14, zIndex: 3, width: 36, height: 36,
        background: "rgba(16,13,10,0.7)", border: "1px solid var(--ink-line)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, color: "var(--manila)", cursor: "pointer", lineHeight: 1,
        backdropFilter: "blur(8px)",
      }}>&times;</button>

      {/* Hero — bleeds to sheet edges, fades into the ink panel */}
      <div style={{ margin: `${wide ? -28 : -20}px -${padX}px 0`, overflow: "hidden" }}>
        {img ? (
          <div style={{ position: "relative", width: "100%", height: 210, background: "var(--ink)" }}>
            <img src={img} alt={coffee.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 96, background: "linear-gradient(to top, var(--ink-2) 0%, rgba(24,19,16,0.55) 55%, transparent 100%)" }} />
          </div>
        ) : (
          <div style={{ width: "100%", height: 120, background: "var(--ink)", borderBottom: "1px solid var(--ink-line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--dim-2)" strokeWidth="1.3"><path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 10h2a2 2 0 0 1 0 4h-2" /></svg>
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{ marginTop: img ? 14 : 20, position: "relative", zIndex: 1 }}>
        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 30, fontWeight: 400, color: "var(--bone)", lineHeight: 1.02, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{coffee.name}</h2>
        {coffee.roaster && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 7, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>{coffee.roaster}</div>}
      </div>

      {/* Score block — the ledger's stamped verdict */}
      {tastings !== null && (
        <div style={{ margin: "22px 0", background: "var(--ink)", border: "1px solid var(--ink-line)", padding: "24px 22px" }}>
          <div className="tnum" style={{ fontFamily: DISPLAY, fontSize: 64, color: avg ? "var(--stamp)" : "var(--dim-2)", lineHeight: 0.85 }}>{avg || "—"}</div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dim)", marginTop: 10 }}>
            {avg ? `Average ✱ ${scores.length} ${scores.length === 1 ? "tasting" : "tastings"}` : "No tastings on file"}
          </div>
          {personList.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", marginTop: 16 }}>
              {personList.map((p) => {
                const pAvg = (p.scores.reduce((a, x) => a + x, 0) / p.scores.length).toFixed(1);
                return (
                  <div key={p.name} style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: p.color, fontWeight: 600 }}>{p.name}</span>
                    <span className="tnum" style={{ fontFamily: DISPLAY, fontSize: 18, color: "var(--bone)" }}>{pAvg}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--dim-2)" }}>({p.scores.length})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      {(() => {
        const facts = [
          { label: "Origin", value: [coffee.origin, coffee.region].filter(Boolean).join(", ") },
          { label: "Producer", value: coffee.producer },
          { label: "Varietal", value: coffee.varietal },
          { label: "Process", value: [coffee.process, coffee.roast_level].filter(Boolean).join("  ✱  ") },
          { label: "Altitude", value: coffee.altitude ? `${coffee.altitude} masl` : "" },
          { label: "Harvest", value: coffee.harvest },
        ].filter((f) => f.value);
        if (facts.length === 0) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {facts.map((f, i) => (
              <div key={f.label} style={{ padding: "14px 0", borderTop: i === 0 ? "1px solid var(--ink-line)" : "none", borderBottom: "1px solid var(--ink-line)" }}>
                <Fact label={f.label} value={f.value} />
              </div>
            ))}
          </div>
        );
      })()}

      {/* Flavor tags */}
      {coffee.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
          {coffee.tags.map((t) => (
            <span key={t} style={{ fontSize: 10, padding: "5px 11px", fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--manila)", border: "1px solid var(--ink-line)" }}>{t}</span>
          ))}
        </div>
      )}

      {/* Bag notes — quote, no accent border */}
      {coffee.bag_notes && (
        <div style={{ margin: "24px 0", fontFamily: BODY, fontStyle: "italic", fontSize: 17, color: "var(--manila)", lineHeight: 1.55 }}>
          <span style={{ color: "var(--stamp)" }}>“</span>{coffee.bag_notes}<span style={{ color: "var(--stamp)" }}>”</span>
        </div>
      )}

      <SectionHead title="Tastings" />

      {tastings === null ? (
        <div style={{ color: "var(--dim)", fontFamily: MONO, fontSize: 12, padding: 16, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase" }}><Spinner /> Loading…</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tastings.map((t, idx) => {
              const u = t.expand?.user || {};
              const mine = u.id === user?.id;
              const userColor = u.color || "var(--stamp)";
              return (
                <div key={t.id} style={{ padding: "16px 0", borderBottom: idx < tastings.length - 1 ? "1px solid var(--ink-line)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span className="tnum" style={{ fontFamily: DISPLAY, fontSize: 22, color: "var(--stamp)", lineHeight: 1 }}>{Number(t.score).toFixed(1)}</span>
                    <span onClick={() => u.id && openProfile(u.id)} style={{ color: userColor, fontSize: 10, fontWeight: 600, fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase", cursor: u.id ? "pointer" : "default" }}>{u.name || "Someone"}</span>
                    <span style={{ flex: 1 }} />
                    {(t.tasted_on || "").split(" ")[0] && <span style={{ fontSize: 10, color: "var(--dim-2)", fontFamily: MONO, letterSpacing: "0.06em" }}>{(t.tasted_on || "").split(" ")[0]}</span>}
                  </div>
                  {(t.grind || t.brew_method) && (
                    <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: MONO, marginTop: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {[t.grind ? `Grind ${t.grind}` : null, t.brew_method].filter(Boolean).join("  ✱  ")}
                    </div>
                  )}
                  {t.notes && (
                    <div style={{ fontSize: 16, color: "var(--bone)", marginTop: 9, fontFamily: BODY, fontStyle: "italic", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      <span style={{ color: "var(--stamp)" }}>“</span>{t.notes}<span style={{ color: "var(--stamp)" }}>”</span>
                    </div>
                  )}
                  {mine && (
                    <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => startEdit(t)} style={{ background: "none", border: "none", padding: 0, color: "var(--dim)", cursor: "pointer", fontSize: 10, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>edit</button>
                      <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", padding: 0, color: "var(--dim)", cursor: "pointer", fontSize: 15, lineHeight: 1 }}>&times;</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {adding ? (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--ink-line)" }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <span className="cl-label" style={{ marginBottom: 0 }}>Score</span>
                  <span className="tnum" style={{ fontFamily: DISPLAY, fontSize: 30, color: "var(--stamp)", lineHeight: 1 }}>{Number(draft.score).toFixed(1)}<span style={{ fontFamily: MONO, fontSize: 12, color: "var(--dim)", marginLeft: 5 }}>/ 10</span></span>
                </div>
                <input type="range" min="1" max="10" step="0.5" value={draft.score} onChange={(e) => setDraft((d) => ({ ...d, score: e.target.value }))} style={{ width: "100%", accentColor: "var(--stamp)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <label className="cl-field" style={{ margin: 0 }}><span className="cl-label">Grind</span><input className="cl-input" value={draft.grind} onChange={(e) => setDraft((d) => ({ ...d, grind: e.target.value }))} placeholder="e.g. 18" /></label>
                <label className="cl-field" style={{ margin: 0 }}><span className="cl-label">Brew method</span><input className="cl-input" value={draft.brew_method} onChange={(e) => setDraft((d) => ({ ...d, brew_method: e.target.value }))} placeholder="V60, Aeropress…" /></label>
              </div>
              <label className="cl-field"><span className="cl-label">Date</span><input type="date" className="cl-input" value={draft.tasted_on} onChange={(e) => setDraft((d) => ({ ...d, tasted_on: e.target.value }))} /></label>
              <label className="cl-field"><span className="cl-label">Notes</span><textarea className="cl-input" style={{ minHeight: 70, resize: "vertical" }} value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="What stood out…" /></label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button onClick={() => { setAdding(false); setEditId(null); }} className="cl-ghost-btn">Cancel</button>
                <button onClick={saveTasting} disabled={busy} className="cl-stamp-btn">{busy ? "Saving…" : editId ? "Update tasting" : "Save tasting"}</button>
              </div>
            </div>
          ) : (
            <button onClick={startAdd} style={{ marginTop: 14, padding: 15, border: "1px dashed var(--ink-line)", background: "transparent", color: "var(--stamp)", fontFamily: MONO, fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", width: "100%" }}>+ Add tasting</button>
          )}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--ink-line)" }}>
        <button onClick={onEdit} className="cl-ghost-btn">Edit coffee info</button>
      </div>
    </Sheet>
  );
}
