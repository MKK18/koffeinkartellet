import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { Bowl, Ring, Score, PencilMark, Empty, Icon, Slip } from "./components.jsx";
import { listCoffees, listAllTastings, listWants, coffeeImageUrl } from "./data.js";
import { avg, memberColor, firstName, topCoffeeId } from "./marks.js";

const VIEWS = [
  { id: "all", label: "All" },
  { id: "want", label: "Want to try" },
  { id: "top", label: "Top rated" },
  { id: "new", label: "Not cupped yet" },
];

function Row({ coffee, stats, wants, people, top, onOpen }) {
  const meta = [coffee.roaster, coffee.origin, coffee.process].filter(Boolean).join(" · ");
  const wanters = people.filter((p) => wants.has(p.id));
  const label = `${coffee.name}${meta ? `, ${meta}` : ""}. ${stats ? `Crew average ${stats.avg.toFixed(1)} from ${stats.n} ${stats.n === 1 ? "rating" : "ratings"}` : "Not cupped yet"}${wanters.length ? `. Want to try: ${wanters.map(firstName).join(", ")}` : ""}`;
  return (
    <li>
      <button type="button" className="cf-row" onClick={() => onOpen(coffee)} aria-label={label}>
        <Bowl coffee={coffee} size={52} photo img={coffeeImageUrl(coffee, "100x100")}>{top && <Ring />}</Bowl>
        <span className="cf-body">
          <span className="cf-name">{coffee.name}</span>
          {meta && <span className="cf-meta">{meta}</span>}
          <span className="cf-marks">
            {stats && people.filter((p) => stats.by[p.id]).map((p) => (
              <span key={p.id} className="cf-m"><span className="mdot" style={{ background: memberColor(p) }} />{firstName(p)} <Score value={stats.by[p.id]} size={20} /></span>
            ))}
            {wanters.length > 0 && <PencilMark style={{ fontSize: 17 }}>{wanters.length === 1 && people.length > 1 ? `${firstName(wanters[0])} wants it` : "want to try"}</PencilMark>}
          </span>
        </span>
        <span className="cf-avg">
          {stats ? <><Score value={stats.avg} size={34} /><small>{stats.n} {stats.n === 1 ? "rating" : "ratings"}</small></> : <small style={{ marginTop: 0 }}>Not cupped</small>}
        </span>
      </button>
    </li>
  );
}

export default function Catalog() {
  const { user } = useAuth();
  const { openCoffee, openBuyVerdict, addCoffee, openScan, dataVersion, crew } = useNav();
  const [coffees, setCoffees] = useState(null);
  const [tastings, setTastings] = useState([]);
  const [wants, setWants] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      Promise.all([listCoffees(search), listAllTastings(), listWants()])
        .then(([c, t2, w]) => { setCoffees(c); setTastings(t2); setWants(w); setError(false); })
        .catch(() => { setCoffees([]); setError(true); });
    }, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [search, dataVersion]);

  const people = crew?.members?.length ? crew.members : (user ? [user] : []);
  const stats = useMemo(() => {
    const by = {};
    tastings.forEach((t) => { const s = Number(t.score); if (!s) return; const e = (by[t.coffee] ||= { all: [], users: {} }); e.all.push(s); (e.users[t.user] ||= []).push(s); });
    const out = {};
    Object.entries(by).forEach(([id, e]) => { out[id] = { avg: avg(e.all), n: e.all.length, by: Object.fromEntries(Object.entries(e.users).map(([u, a]) => [u, avg(a)])) }; });
    return out;
  }, [tastings]);
  const wantMap = useMemo(() => {
    const m = {};
    wants.forEach((w) => { (m[w.coffee] ||= new Set()).add(w.user); });
    return m;
  }, [wants]);
  const top = useMemo(() => topCoffeeId(tastings), [tastings]);
  const myWants = wants.filter((w) => w.user === user?.id).length;

  const list = useMemo(() => {
    if (!coffees) return null;
    let l = coffees;
    if (view === "want") l = l.filter((c) => wantMap[c.id]?.size);
    if (view === "new") l = l.filter((c) => !stats[c.id]);
    if (view === "top") l = [...l].filter((c) => stats[c.id]).sort((a, b) => stats[b.id].avg - stats[a.id].avg || stats[b.id].n - stats[a.id].n);
    return l;
  }, [coffees, view, stats, wantMap]);

  const empty = {
    want: { title: "Nothing circled yet", body: "Scan a bag in a café and save it as want to try, or open a coffee and tap Want to try." },
    top: { title: "No scores yet", body: "Once the crew pencils in scores, the best cups rise to the top here." },
    new: { title: "Everything's been cupped", body: "Every coffee on the table has at least one score." },
  };

  return (
    <div className="cf">
      <div className="cf-tools">
        <label className="cf-search">
          <Icon name="search" />
          <span className="sr-only">Search coffees</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, roaster, origin" />
        </label>
        <button type="button" className="btn btn-primary cf-add" onClick={addCoffee} aria-label="Add a coffee"><Icon name="plus" /><span>Add</span></button>
      </div>
      <div className="chips" role="group" aria-label="Show">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" className="chip" aria-pressed={view === v.id} onClick={() => setView(v.id)}>
            {v.label}{v.id === "want" && myWants > 0 ? ` · ${myWants}` : ""}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: "16px var(--gut) 0" }}><Slip>Couldn't load the coffees. Check your connection and reload.</Slip></div>}

      {list === null ? (
        <div aria-busy="true" style={{ padding: "18px var(--gut)" }}>
          {[0, 1, 2, 3].map((i) => <div key={i} className="sk" style={{ height: 64, marginBottom: 12 }} />)}
        </div>
      ) : list.length === 0 ? (
        search ? (
          <Empty title="No matches" body={`Nothing on the table matches “${search}”.`}>
            <button type="button" className="btn btn-line" onClick={() => setSearch("")}>Clear search</button>
          </Empty>
        ) : view !== "all" ? (
          <Empty {...empty[view]}><button type="button" className="btn btn-line" onClick={() => setView("all")}>Show all coffees</button></Empty>
        ) : (
          <Empty title="No coffees yet" body="Add the bag you're brewing, or scan one in a café to see if it's worth buying.">
            <button type="button" className="btn btn-primary" onClick={addCoffee}><Icon name="plus" />Add a coffee</button>
            <button type="button" className="btn btn-line" onClick={openScan}><Icon name="camera" />Scan a bag</button>
          </Empty>
        )
      ) : (
        <ul className="cf-list">
          {list.map((c) => (
            <Row key={c.id} coffee={c} stats={stats[c.id]} wants={wantMap[c.id] || new Set()} people={people} top={c.id === top} onOpen={openCoffee} />
          ))}
        </ul>
      )}

      <p className="cf-foot">
        Looking at a bag online? <button type="button" className="linkbtn" onClick={openBuyVerdict}>Check a shop link against your palate</button>
      </p>
    </div>
  );
}
