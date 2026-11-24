import { useState, useEffect, useRef, useMemo } from "react";
import { Sheet, Bowl, Ring, Score, Tick, PencilMark, Icon, Spinner, Slip, ScoreInput, SectionHead, Avatar } from "./components.jsx";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { listTastingsForCoffee, createTasting, updateTasting, deleteTasting, coffeeImageUrl, listWants, setWant, listAllTastings } from "./data.js";
import { avg, spread, SPLIT_AT, memberColor, firstName, fmtDate, tastingDate, topCoffeeId } from "./marks.js";

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_T = { score: null, grind: "", brew_method: "", notes: "", tasted_on: today() };
const BREWS = ["V60", "AeroPress", "Espresso", "Chemex", "Kalita", "French press", "Moka pot", "Cupping"];

function Facts({ coffee }) {
  const alt = coffee.altitude ? `${String(coffee.altitude).replace(/\s*m(asl)?\s*$/i, "")} m` : "";
  const rows = [
    ["Origin", [coffee.origin, coffee.region].filter(Boolean).join(", ")],
    ["Producer", coffee.producer],
    ["Varietal", coffee.varietal],
    ["Process", coffee.process],
    ["Roast", coffee.roast_level],
    ["Altitude", alt],
    ["Harvest", coffee.harvest],
    ["Importer", coffee.importer],
  ].filter(([, v]) => v);
  if (!rows.length && !coffee.tags?.length && !coffee.bag_notes) return null;
  return (
    <>
      <SectionHead title="On the bag" />
      {rows.length > 0 && (
        <dl className="facts">
          {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        </dl>
      )}
      {coffee.tags?.length > 0 && (
        <ul className="tags" aria-label="Flavour notes">{coffee.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      )}
      {coffee.bag_notes && <p className="bagnote">{coffee.bag_notes}</p>}
    </>
  );
}

function TastingForm({ draft, setDraft, onSave, onCancel, busy, editing, error }) {
  const ref = useRef();
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  return (
    <form ref={ref} className="tform" onSubmit={(e) => { e.preventDefault(); onSave(); }} style={{ scrollMarginTop: 72 }}>
      <ScoreInput id="t-score" value={draft.score} onChange={(v) => setDraft((d) => ({ ...d, score: v }))} />
      <div className="tform-grid">
        <label className="field">
          <span className="label">Brewed with</span>
          <input className="input" list="brews" value={draft.brew_method} onChange={set("brew_method")} placeholder="V60, espresso…" />
          <datalist id="brews">{BREWS.map((b) => <option key={b} value={b} />)}</datalist>
        </label>
        <label className="field">
          <span className="label">Grind</span>
          <input className="input" inputMode="decimal" value={draft.grind} onChange={set("grind")} placeholder="e.g. 18" />
        </label>
      </div>
      <label className="field">
        <span className="label">Tasted on</span>
        <input type="date" className="input" value={draft.tasted_on} onChange={set("tasted_on")} />
      </label>
      <label className="field">
        <span className="label">Note</span>
        <textarea className="input" value={draft.notes} onChange={set("notes")} placeholder="What stood out? Blackcurrant, too sour, perfect with milk…" />
      </label>
      {error && <Slip style={{ marginBottom: 12 }}>{error}</Slip>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy || draft.score == null}>{busy ? "Saving…" : editing ? "Update score" : "Pencil it in"}</button>
      </div>
    </form>
  );
}

export default function CoffeeDetail({ coffee, onClose, onEdit }) {
  const { user } = useAuth();
  const { openProfile, bumpData, toast, crew, dataVersion } = useNav();
  const [tastings, setTastings] = useState(null);
  const [hidden, setHidden] = useState(() => new Set());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_T);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState(null);
  const [wanters, setWanters] = useState([]);
  const [isTop, setIsTop] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  const load = async () => {
    try {
      const [t, w, all] = await Promise.all([listTastingsForCoffee(coffee.id), listWants(), listAllTastings()]);
      setTastings(t); setWanters(w.filter((x) => x.coffee === coffee.id).map((x) => x.user)); setIsTop(topCoffeeId(all) === coffee.id); setLoadErr(false);
    } catch { setTastings([]); setLoadErr(true); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [coffee.id, dataVersion]);

  const visible = (tastings || []).filter((t) => !hidden.has(t.id));
  const people = useMemo(() => {
    const m = new Map();
    (crew?.members || []).forEach((p) => m.set(p.id, p));
    visible.forEach((t) => { const u = t.expand?.user; if (u && !m.has(u.id)) m.set(u.id, u); });
    return [...m.values()];
  }, [crew, visible]);
  const byPerson = useMemo(() => {
    const g = {};
    visible.forEach((t) => (g[t.user] ||= []).push(t));
    Object.values(g).forEach((l) => l.sort((a, b) => tastingDate(b) - tastingDate(a)));
    return g;
  }, [visible]);
  const scores = visible.map((t) => Number(t.score)).filter(Boolean);
  const crewAvg = avg(scores);
  const latest = people.filter((p) => byPerson[p.id]).map((p) => Number(byPerson[p.id][0].score));
  const split = spread(latest) >= SPLIT_AT;
  const iWant = wanters.includes(user?.id);
  const iScored = !!byPerson[user?.id];
  const dirty = adding && (draft.score != null || draft.notes.trim() || draft.brew_method.trim());

  const startAdd = () => { setDraft({ ...EMPTY_T }); setEditId(null); setError(""); setAdding(true); };
  const startEdit = (t) => {
    setDraft({ score: Number(t.score), grind: t.grind ?? "", brew_method: t.brew_method || "", notes: t.notes || "", tasted_on: (t.tasted_on || "").split(" ")[0] || today() });
    setEditId(t.id); setError(""); setAdding(true);
  };
  const save = async () => {
    if (draft.score == null) return;
    setBusy(true); setError("");
    try {
      const payload = { ...draft, coffee: coffee.id, grind: draft.grind === "" ? null : Number(draft.grind), score: Number(draft.score) };
      const saved = editId ? await updateTasting(editId, payload) : await createTasting(payload);
      if (!editId && iWant) setWant(coffee.id, false).catch(() => {}); // cupped it: un-circle
      setAdding(false); setEditId(null); setFresh(saved.id);
      await load(); bumpData();
      toast(editId ? "Score updated" : "Pencilled in");
    } catch (err) {
      setError(err?.message ? `Couldn't save: ${err.message}` : "Couldn't save. Check your connection and try again.");
    } finally { setBusy(false); }
  };
  const remove = (t) => {
    setHidden((h) => new Set(h).add(t.id));
    toast("Tasting removed", {
      action: "Undo",
      onAction: () => setHidden((h) => { const n = new Set(h); n.delete(t.id); return n; }),
      onExpire: () => deleteTasting(t.id).then(() => bumpData()).catch(() => { setHidden((h) => { const n = new Set(h); n.delete(t.id); return n; }); toast("Couldn't remove that tasting"); }),
    });
  };
  const toggleWant = async () => {
    const next = !iWant;
    setWanters((w) => (next ? [...w, user.id] : w.filter((x) => x !== user.id)));
    try { await setWant(coffee.id, next); bumpData(); toast(next ? "Circled: want to try" : "Removed from want to try"); }
    catch { setWanters((w) => (next ? w.filter((x) => x !== user.id) : [...w, user.id])); toast("Couldn't update. Try again."); }
  };

  const img = coffeeImageUrl(coffee, "300x300");
  const meta = [coffee.roaster, [coffee.origin, coffee.region].filter(Boolean).join(", ")].filter(Boolean);

  return (
    <Sheet title={coffee.name} onClose={onClose} dirty={!!dirty} maxWidth={720}>
      <div className="cd-top">
        <Bowl coffee={coffee} size={92} photo img={img}>{isTop && <Ring />}</Bowl>
        <div style={{ minWidth: 0 }}>
          {meta.map((m, i) => <div key={i} className={i === 0 ? "cd-roaster" : "cd-meta"}>{m}</div>)}
          {[coffee.process, coffee.roast_level].filter(Boolean).length > 0 && <div className="cd-meta">{[coffee.process, coffee.roast_level && `${coffee.roast_level} roast`].filter(Boolean).join(" · ")}</div>}
          {isTop && <div style={{ marginTop: 6 }}><PencilMark style={{ fontSize: 17 }}>the crew's top cup</PencilMark></div>}
        </div>
      </div>

      {/* Crew score — the tally of the table */}
      <div className="cd-tally">
        {tastings === null ? <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--ink-2)" }}><Spinner />Loading scores…</div> : (
          <>
            <div className="cd-avg">
              <Score value={crewAvg} size={64} muted={!crewAvg} />
              <div>
                <div style={{ fontWeight: 800 }}>{crewAvg ? "Crew average" : "Not cupped yet"}</div>
                <div style={{ fontSize: 14, color: "var(--ink-2)" }}>{crewAvg ? `${scores.length} ${scores.length === 1 ? "rating" : "ratings"}` : "Be the first to score it"}</div>
                {split && <div style={{ marginTop: 4 }}><PencilMark style={{ fontSize: 17 }}>split by {spread(latest).toFixed(1)}</PencilMark></div>}
              </div>
            </div>
            {people.some((p) => byPerson[p.id]) && (
              <ul className="cd-people">
                {people.filter((p) => byPerson[p.id]).map((p) => {
                  const s = Number(byPerson[p.id][0].score);
                  return (
                    <li key={p.id}>
                      <span className="mdot" style={{ background: memberColor(p) }} />
                      <span className="cd-pn">{p.id === user?.id ? "You" : firstName(p)}</span>
                      <Tick score={s} width={84} />
                      <Score value={s} size={26} className={byPerson[p.id][0].id === fresh ? "pencil-in" : ""} />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
        {loadErr && <Slip style={{ marginTop: 12 }}>Couldn't load every score. Check your connection.</Slip>}
      </div>

      <div className="cd-actions">
        {!adding && <button type="button" className="btn btn-primary" onClick={startAdd}><Icon name="edit" />{iScored ? "Add another tasting" : "Pencil in your score"}</button>}
        <button type="button" className={`btn ${iWant ? "btn-line is-on" : "btn-line"}`} aria-pressed={iWant} onClick={toggleWant}>
          <Icon name="want" />{iWant ? "Want to try" : "Want to try"}
        </button>
      </div>
      {wanters.length > 0 && (
        <p className="cd-wanters">Circled by {people.filter((p) => wanters.includes(p.id)).map((p) => (p.id === user?.id ? "you" : firstName(p))).join(" and ") || "someone"}.</p>
      )}

      {adding && (
        <TastingForm draft={draft} setDraft={setDraft} onSave={save} busy={busy} editing={!!editId} error={error}
          onCancel={() => { setAdding(false); setEditId(null); }} />
      )}

      {tastings !== null && visible.length > 0 && (
        <>
          <SectionHead title="Score sheets" />
          <div className="sheets">
            {people.filter((p) => byPerson[p.id]).map((p) => (
              <section key={p.id} className="sheetcol" aria-label={`${p.name}'s tastings`}>
                <button type="button" className="sheetcol-h" onClick={() => openProfile(p.id)}>
                  <Avatar user={p} size={28} /><span>{p.id === user?.id ? "You" : p.name}</span>
                </button>
                <ol>
                  {byPerson[p.id].map((t) => {
                    const mine = t.user === user?.id;
                    const how = [t.brew_method, t.grind ? `grind ${t.grind}` : ""].filter(Boolean).join(", ");
                    return (
                      <li key={t.id} className="tcard">
                        <div className="tcard-top">
                          <Score value={t.score} size={30} className={t.id === fresh ? "pencil-in" : ""} />
                          <div className="tcard-when">{fmtDate(tastingDate(t))}{how && <><br />{how}</>}</div>
                          {mine && (
                            <span className="tcard-act">
                              <button type="button" className="iconbtn" onClick={() => startEdit(t)} aria-label="Edit this tasting"><Icon name="edit" /></button>
                              <button type="button" className="iconbtn" onClick={() => remove(t)} aria-label="Remove this tasting"><Icon name="trash" /></button>
                            </span>
                          )}
                        </div>
                        {t.notes && <p className="tcard-note">{t.notes}</p>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        </>
      )}

      <Facts coffee={coffee} />

      <div className="cd-foot">
        <button type="button" className="btn btn-line" onClick={onEdit}><Icon name="edit" />Edit coffee details</button>
        {coffee.created && <span>Added {fmtDate(coffee.created)}{coffee.expand?.added_by ? ` by ${firstName(coffee.expand.added_by)}` : ""}</span>}
      </div>
    </Sheet>
  );
}
