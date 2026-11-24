import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { Bowl, Score, PencilMark, Empty, Icon, SectionHead, Slip } from "./components.jsx";
import { listTastingsExpanded, getUser, coffeeImageUrl } from "./data.js";
import { avg, memberColor, firstName, fmtDate, tastingDate, spread } from "./marks.js";

const LO = 5, HI = 10; // the palate scale: below 5 is pinned to the left edge

// One attribute on the cupping scale, each person a dot where their average sits.
function ScaleRow({ label, marks, n }) {
  return (
    <li className="pl-row">
      <div className="pl-label"><span>{label}</span><small>{n} {n === 1 ? "cup" : "cups"}</small></div>
      <div className="pl-scale" role="img" aria-label={`${label}: ${marks.map((m) => `${m.name} ${m.value.toFixed(1)}`).join(", ")}`}>
        {[5, 6, 7, 8, 9, 10].map((t) => <i key={t} style={{ left: `${((t - LO) / (HI - LO)) * 100}%` }} />)}
        {marks.map((m) => (
          <span key={m.name} className="pl-dot" title={`${m.name} ${m.value.toFixed(1)}`}
            style={{ left: `${(Math.max(0, Math.min(1, (m.value - LO) / (HI - LO)))) * 100}%`, background: m.color }} />
        ))}
      </div>
    </li>
  );
}

function scaleRows(tastings, people, pick, limit = 6) {
  const by = {};
  tastings.forEach((t) => {
    const s = Number(t.score); const c = t.expand?.coffee;
    if (!s || !c) return;
    const vals = pick(c); const list = Array.isArray(vals) ? vals : vals ? [vals] : [];
    list.forEach((v) => { const e = (by[v] ||= { all: [], users: {} }); e.all.push(s); (e.users[t.user] ||= []).push(s); });
  });
  return Object.entries(by)
    .map(([label, e]) => ({
      label, n: e.all.length, mean: avg(e.all),
      marks: people.filter((p) => e.users[p.id]).map((p) => ({ name: firstName(p), color: memberColor(p), value: avg(e.users[p.id]) })),
    }))
    .sort((a, b) => b.n - a.n || b.mean - a.mean)
    .slice(0, limit);
}

function Legend({ people }) {
  if (people.length < 2) return null;
  return (
    <div className="pl-legend">
      {people.map((p) => <span key={p.id}><span className="mdot" style={{ background: memberColor(p) }} />{firstName(p)}</span>)}
      <span className="pl-axis">scale 5 to 10</span>
    </div>
  );
}

function Palate({ tastings, people, title, emptyBody }) {
  const sections = [
    ["By flavour", (c) => c.tags || []],
    ["By process", (c) => c.process],
    ["By origin", (c) => c.origin],
  ].map(([t, pick]) => [t, scaleRows(tastings, people, pick)]).filter(([, rows]) => rows.length);
  if (!sections.length) return emptyBody ? <p className="pl-p">{emptyBody}</p> : null;
  return (
    <>
      {title && <SectionHead title={title} />}
      <Legend people={people} />
      {sections.map(([t, rows]) => (
        <div key={t} style={{ marginTop: 16 }}>
          <h4 className="pl-h">{t}</h4>
          <ul className="pl-list">{rows.map((r) => <ScaleRow key={r.label} {...r} />)}</ul>
        </div>
      ))}
    </>
  );
}

function CoffeeLine({ coffee, right, onOpen }) {
  return (
    <li>
      <button type="button" className="pl-coffee" onClick={() => onOpen(coffee)}>
        <Bowl coffee={coffee} size={40} photo img={coffeeImageUrl(coffee, "100x100")} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="tl-name" style={{ display: "block" }}>{coffee.name}</span>
          {coffee.roaster && <span className="tl-sub">{coffee.roaster}</span>}
        </span>
        {right}
      </button>
    </li>
  );
}

// Coffees two or more people scored, by how far apart they are.
function Differences({ tastings, people, onOpen }) {
  const rows = useMemo(() => {
    const by = {};
    tastings.forEach((t) => { const c = t.expand?.coffee; if (!c || !Number(t.score)) return; const e = (by[c.id] ||= { coffee: c, users: {} }); (e.users[t.user] ||= []).push(Number(t.score)); });
    return Object.values(by)
      .map((e) => ({ ...e, avgs: Object.fromEntries(Object.entries(e.users).map(([u, a]) => [u, avg(a)])) }))
      .filter((e) => Object.keys(e.avgs).length > 1)
      .map((e) => ({ ...e, d: spread(Object.values(e.avgs)) }))
      .sort((a, b) => b.d - a.d);
  }, [tastings]);
  if (!rows.length) return <p className="pl-p">Once two of you score the same coffee, you'll see here where you agree and where you don't.</p>;
  const agree = rows.filter((r) => r.d < 0.75).length;
  return (
    <>
      <p className="pl-p">{rows.length} {rows.length === 1 ? "coffee" : "coffees"} scored by more than one of you. You agree, within half a point or so, on {agree}.</p>
      <ul className="pl-clist">
        {rows.slice(0, 5).map((r) => (
          <CoffeeLine key={r.coffee.id} coffee={r.coffee} onOpen={onOpen} right={
            <span className="pl-pair">
              {people.filter((p) => r.avgs[p.id] != null).map((p) => (
                <span key={p.id}><span className="mdot" style={{ background: memberColor(p) }} /><Score value={r.avgs[p.id]} size={22} /></span>
              ))}
              {r.d >= 1.5 ? <PencilMark style={{ fontSize: 16 }}>split</PencilMark> : r.d < 0.75 ? <span className="pl-agree">agree</span> : null}
            </span>
          } />
        ))}
      </ul>
    </>
  );
}

function Loading() {
  return <div aria-busy="true" style={{ padding: "20px var(--gut)" }}>{[0, 1, 2].map((i) => <div key={i} className="sk" style={{ height: 44, marginBottom: 12 }} />)}</div>;
}

// view: "crew" (Palate tab) | "me" (You tab) | "person" (someone else, in a sheet)
export default function Profile({ view = "me", userId }) {
  const { user: me, logout } = useAuth();
  const { openCoffee, crew, dataVersion, openScan, openSettings } = useNav();
  const [all, setAll] = useState(null);
  const [person, setPerson] = useState(view === "person" ? null : me);
  const [err, setErr] = useState(false);

  useEffect(() => {
    listTastingsExpanded().then((t) => { setAll(t); setErr(false); }).catch(() => { setAll([]); setErr(true); });
    if (view === "person" && userId) getUser(userId).then(setPerson).catch(() => {});
  }, [dataVersion, userId, view]);

  const people = crew?.members?.length ? crew.members : (me ? [me] : []);
  const ids = new Set(people.map((p) => p.id));

  if (all === null) return <Loading />;
  const pad = { padding: view === "person" ? "0 0 8px" : "8px var(--gut) 8px" };
  if (err) return <div style={pad}><Slip>Couldn't load tastings. Check your connection and reload.</Slip></div>;

  if (view === "crew") {
    const crewT = all.filter((t) => ids.has(t.user));
    if (!crewT.length) {
      return <Empty title="No palate yet" body="Score a few coffees and the crew's taste maps itself here: which flavours, processes and origins you rate highest.">
        <button type="button" className="btn btn-red" onClick={openScan}><Icon name="camera" />Scan a bag</button>
      </Empty>;
    }
    return (
      <div style={pad}>
        {people.length > 1 && <><SectionHead title="Where you differ" /><Differences tastings={crewT} people={people} onOpen={openCoffee} /></>}
        <Palate tastings={crewT} people={people} title={people.length > 1 ? "What the crew rates highest" : "What you rate highest"} />
        {people.length === 1 && <p className="pl-p" style={{ marginTop: 20 }}>When someone joins your household, their dots appear beside yours on every line.</p>}
      </div>
    );
  }

  const pid = view === "person" ? userId : me?.id;
  const theirs = all.filter((t) => t.user === pid);
  const coffeesN = new Set(theirs.map((t) => t.coffee)).size;
  const mean = avg(theirs.map((t) => Number(t.score)).filter(Boolean));
  const best = (() => {
    const by = {};
    theirs.forEach((t) => { const c = t.expand?.coffee; if (!c) return; (by[c.id] ||= { coffee: c, s: [] }).s.push(Number(t.score)); });
    return Object.values(by).map((e) => ({ ...e, a: avg(e.s) })).sort((a, b) => b.a - a.a).slice(0, 3);
  })();
  const recent = [...theirs].sort((a, b) => tastingDate(b) - tastingDate(a)).slice(0, 5);
  const name = view === "person" ? firstName(person) : "You";
  const subject = person ? [person] : [];

  let both = null;
  if (view === "person" && me) {
    const pair = all.filter((t) => t.user === pid || t.user === me.id);
    both = <><SectionHead title={`You and ${firstName(person)}`} /><Differences tastings={pair} people={[me, person].filter(Boolean)} onOpen={openCoffee} /></>;
  }

  return (
    <div style={pad}>
      {theirs.length === 0 ? (
        view === "me"
          ? <Empty title="No scores from you yet" body="Open a coffee and pencil in a score, or scan a bag to check it against the crew.">
              <button type="button" className="btn btn-red" onClick={openScan}><Icon name="camera" />Scan a bag</button>
            </Empty>
          : <p className="pl-p" style={{ paddingTop: 8 }}>{name} hasn't scored anything yet.</p>
      ) : (
        <>
          <p className="pl-lede">
            {name} {view === "me" ? "have" : "has"} scored <b>{coffeesN} {coffeesN === 1 ? "coffee" : "coffees"}</b> over {theirs.length} {theirs.length === 1 ? "tasting" : "tastings"}, averaging <Score value={mean} size={30} />.
          </p>
          {both}
          <SectionHead title="Top cups" />
          <ul className="pl-clist">{best.map((b) => <CoffeeLine key={b.coffee.id} coffee={b.coffee} onOpen={openCoffee} right={<Score value={b.a} size={28} />} />)}</ul>
          <SectionHead title="Lately" />
          <ul className="pl-clist">{recent.map((t) => t.expand?.coffee && (
            <CoffeeLine key={t.id} coffee={t.expand.coffee} onOpen={openCoffee} right={<span className="pl-recent"><Score value={t.score} size={26} /><small>{fmtDate(tastingDate(t))}</small></span>} />
          ))}</ul>
          <Palate tastings={theirs} people={subject} title={view === "me" ? "Your palate" : `${firstName(person)}'s palate`} />
        </>
      )}
      {view === "me" && (
        <div className="pl-account">
          <button type="button" className="btn btn-line" onClick={openSettings}><Icon name="settings" />Account and settings</button>
          <button type="button" className="btn btn-quiet" onClick={logout}><Icon name="out" />Sign out</button>
        </div>
      )}
    </div>
  );
}
