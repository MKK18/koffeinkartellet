import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "./useMediaQuery.js";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { Avatar, Bowl, Ring, PencilMark, Score, Empty, Icon, Slip } from "./components.jsx";
import { listTastingsExpanded, coffeeImageUrl } from "./data.js";
import { timelineEntries, topCoffeeId, spread, SPLIT_AT, memberColor, firstName, fmtDate, tastingDate } from "./marks.js";

const FRESH_MS = 90 * 1000;
const PAGE = 6; // headings shown before "Show older"

// Who sits at the table: the household, or — before there is one — everyone
// whose scores are visible, me first.
function usePeople(crew, tastings, me) {
  return useMemo(() => {
    if (crew?.members?.length > 1) return crew.members;
    const seen = new Map();
    if (me) seen.set(me.id, me);
    (tastings || []).forEach((t) => { const u = t.expand?.user; if (u && !seen.has(u.id)) seen.set(u.id, u); });
    return [...seen.values()];
  }, [crew, tastings, me]);
}

function SkeletonRows() {
  return (
    <div aria-busy="true" aria-label="Loading the table" style={{ padding: "18px var(--gut)" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22 }}>
          <div className="sk" style={{ width: 54, height: 54, borderRadius: "50%" }} />
          <div style={{ flex: 1 }}>
            <div className="sk" style={{ height: 16, width: "55%", marginBottom: 8 }} />
            <div className="sk" style={{ height: 12, width: "35%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function noteFor(entry, uid) {
  return entry.notes.find((n) => n.user === uid)?.text || "";
}

// Short enough to sit beside a score; cut at a word with a visible ellipsis.
export function clip(text, max = 64) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 12)).replace(/[\s,.;:–-]+$/, "")}…`;
}

// Two cuppers: me on the left, them on the right, the coffee on the line.
function Lane({ side, person, entry, fresh, history, clipAt }) {
  const s = entry.scores[person.id];
  const note = noteFor(entry, person.id);
  const color = memberColor(person);
  if (s == null) {
    // Not in this span: show their earlier score muted, or nothing if they only scored it later.
    const mine = history?.[entry.coffee.id]?.[person.id] || [];
    const before = mine.find((x) => x.date < entry.latest);
    if (before) {
      return <div className={`tl2-side ${side}`}><span className="tl-earlier"><Score value={before.score} size={24} muted /><small>{fmtDate(before.date)}</small></span></div>;
    }
    if (mine.length) return <div className={`tl2-side ${side}`} />;
    return <div className={`tl2-side ${side}`}><span className="tl-none">Not yet</span></div>;
  }
  const bar = Math.max(10, ((s - 4) / 6) * 100);
  return (
    <div className={`tl2-side ${side}`}>
      <span>
        <Score value={s} size={34} className={fresh ? "pencil-in" : ""} />
        {entry.counts[person.id] > 1 && <span className="tl-x">×{entry.counts[person.id]}</span>}
      </span>
      <span className="tl2-bar" style={{ width: `min(${bar}%, ${bar * 1.6}px)`, background: color }} />
      {note && <span className="tl-q">“{clip(note, clipAt)}{"\u2060"}”</span>}
    </div>
  );
}

function Pair({ entry, people, top, onOpen, history }) {
  const clipAt = useMediaQuery("(min-width: 640px)") ? 120 : 40;
  const [a, b] = people;
  const c = entry.coffee;
  const sa = entry.scores[a.id], sb = entry.scores[b.id];
  const split = sa != null && sb != null && Math.abs(sa - sb) >= SPLIT_AT;
  const fresh = Date.now() - entry.latest.getTime() < FRESH_MS;
  const label = `${c.name}${c.roaster ? ` by ${c.roaster}` : ""}. ${firstName(a)} ${sa != null ? sa.toFixed(1) : "not scored"}, ${firstName(b)} ${sb != null ? sb.toFixed(1) : "not scored"}${split ? ". You split on this one" : ""}${top ? ". Top cup" : ""}`;
  return (
    <button type="button" className="tl2-row" onClick={() => onOpen(c)} aria-label={label}>
      <Lane side="l" person={a} entry={entry} fresh={fresh} history={history} clipAt={clipAt} />
      <div className="tl2-mid">
        <Bowl coffee={c} size={54} photo img={coffeeImageUrl(c, "100x100")}>{top && <Ring />}</Bowl>
        {split && <span className="tl2-split"><PencilMark>split</PencilMark></span>}
        <span className="tl-name">{c.name}</span>
        {c.roaster && <span className="tl-sub">{c.roaster}</span>}
      </div>
      <Lane side="r" person={b} entry={entry} fresh={fresh} history={history} clipAt={clipAt} />
    </button>
  );
}

// One cupper, or three and more: a spine down the left, scores in a row.
function Line({ entry, people, top, onOpen }) {
  const c = entry.coffee;
  const scored = people.filter((p) => entry.scores[p.id] != null);
  const values = scored.map((p) => entry.scores[p.id]);
  const split = spread(values) >= SPLIT_AT;
  const fresh = Date.now() - entry.latest.getTime() < FRESH_MS;
  const note = entry.notes[0];
  const noteBy = note && people.find((p) => p.id === note.user);
  const label = `${c.name}${c.roaster ? ` by ${c.roaster}` : ""}. ${scored.map((p) => `${firstName(p)} ${entry.scores[p.id].toFixed(1)}`).join(", ")}${split ? ". The crew split on this one" : ""}${top ? ". Top cup" : ""}`;
  const meta = [c.roaster, c.origin].filter(Boolean).join(" · ");
  return (
    <button type="button" className="tl1-row" onClick={() => onOpen(c)} aria-label={label}>
      <Bowl coffee={c} size={56} photo img={coffeeImageUrl(c, "100x100")}>{top && <Ring />}</Bowl>
      <div className="tl1-body">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span className="tl-name">{c.name}</span>
          {split && <PencilMark>split</PencilMark>}
        </div>
        {meta && <div className="tl-sub">{meta}</div>}
        <div className="tl1-scores">
          {scored.map((p) => (
            <span key={p.id} className="tl1-s">
              <small><span className="mdot" style={{ background: memberColor(p) }} />{firstName(p)}</small>
              <span><Score value={entry.scores[p.id]} size={28} className={fresh ? "pencil-in" : ""} />{entry.counts[p.id] > 1 && <span className="tl-x">×{entry.counts[p.id]}</span>}</span>
            </span>
          ))}
        </div>
        {note && <div className="tl-q" style={{ maxWidth: "46ch" }}>{noteBy && people.length > 1 ? `${firstName(noteBy)}: ` : ""}“{clip(note.text, 110)}”</div>}
      </div>
    </button>
  );
}

export default function Timeline() {
  const { user } = useAuth();
  const { openCoffee, openProfile, openScan, addCoffee, dataVersion, crew } = useNav();
  const [tastings, setTastings] = useState(null);
  const [error, setError] = useState(false);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    listTastingsExpanded().then((t) => { setTastings(t); setError(false); }).catch(() => { setTastings([]); setError(true); });
  }, [dataVersion]);

  const people = usePeople(crew, tastings, user);
  const ids = useMemo(() => new Set(people.map((p) => p.id)), [people]);
  const mine = useMemo(() => (tastings || []).filter((t) => ids.has(t.user)), [tastings, ids]);
  const groups = useMemo(() => timelineEntries(mine), [mine]);
  const top = useMemo(() => topCoffeeId(mine), [mine]);
  // Every member's scores per coffee, newest first, for "scored earlier" lanes.
  const history = useMemo(() => {
    const h = {};
    mine.forEach((t) => { ((h[t.coffee] ||= {})[t.user] ||= []).push({ date: tastingDate(t), score: Number(t.score) }); });
    Object.values(h).forEach((byU) => Object.values(byU).forEach((l) => l.sort((x, y) => y.date - x.date)));
    return h;
  }, [mine]);

  if (tastings === null) return <SkeletonRows />;
  if (error) return <div style={{ padding: "24px var(--gut)" }}><Slip>Couldn't load the table. Check your connection and reload the page.</Slip></div>;
  if (!groups.length) {
    return (
      <Empty title="Nothing on the table yet" body={people.length > 1 ? "Scan a bag in a café or add one you're brewing, then pencil in a score. The crew's scores land here, side by side." : "Scan a bag in a café or add one you're brewing, then pencil in a score."}>
        <button type="button" className="btn btn-red" onClick={openScan}><Icon name="camera" />Scan a bag</button>
        <button type="button" className="btn btn-line" onClick={addCoffee}><Icon name="plus" />Add a coffee</button>
      </Empty>
    );
  }

  const two = people.length === 2;
  const visible = groups.slice(0, shown);

  return (
    <div className={`tl ${two ? "tl2" : "tl1"}`}>
      {two && (
        <div className="tl2-lanes">
          {people.map((p) => (
            <button key={p.id} type="button" className="tl2-who" onClick={() => openProfile(p.id)}>
              {p === people[1] && firstName(p)}
              <Avatar user={p} size={26} />
              {p === people[0] && (p.id === user?.id ? "You" : firstName(p))}
            </button>
          ))}
        </div>
      )}
      {visible.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h2 className="tl-wk"><span>{g.label}</span></h2>
          {g.entries.map((e) => (two
            ? <Pair key={e.coffee.id} entry={e} people={people} top={e.coffee.id === top} onOpen={openCoffee} history={history} />
            : <Line key={e.coffee.id} entry={e} people={people} top={e.coffee.id === top} onOpen={openCoffee} />))}
        </section>
      ))}
      {groups.length > shown && (
        <div className="tl-more"><button type="button" className="btn btn-line" onClick={() => setShown((n) => n + PAGE)}>Show older</button></div>
      )}
      {people.length === 1 && (
        <p style={{ margin: "20px var(--gut) 0", fontSize: 15, color: "var(--ink-2)" }}>
          It's just you at the table for now. When someone joins your household, their scores sit beside yours.
        </p>
      )}
    </div>
  );
}

