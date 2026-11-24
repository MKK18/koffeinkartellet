import { navigate } from "./router.js";
import { Ring, PencilMark } from "./components.jsx";
import { bowlTint } from "./marks.js";

// The front door for friends who got the link: what this is, a look at the
// real table, and the way in. Sample entries are illustrative and labelled.
const SAMPLE = [
  { name: "Kieni AA", roaster: "Coffee Collective", roast: "Light", a: 9.0, b: 9.2, qa: "So much cassis", qb: "Like a young Chianti", top: true },
  { name: "Guji Hambela", roaster: "La Cabra", roast: "Light", a: 8.4, b: 6.6, qa: "Blueberry jam", qb: "Too funky for me" },
  { name: "Cajamarca", roaster: "Fuglen", roast: "Medium-Dark", a: 6.8, b: null, qa: "Fine with milk" },
];
const A = "#2e6b52", B = "#3f5fc4";

function Side({ side, v, q, color }) {
  if (v == null) return <div className={`tl2-side ${side}`}><span className="tl-none">Not yet</span></div>;
  return (
    <div className={`tl2-side ${side}`}>
      <span className="hand" style={{ fontSize: 34 }}>{v.toFixed(1)}</span>
      <span className="tl2-bar" style={{ width: `min(${Math.max(10, ((v - 4) / 6) * 100)}%, ${Math.max(10, ((v - 4) / 6) * 100) * 1.6}px)`, background: color }} />
      {q && <span className="tl-q">“{q}{"\u2060"}”</span>}
    </div>
  );
}

function SampleTable() {
  return (
    <figure className="lp-sheet" aria-label="A sample of the table: two people's scores side by side">
      <div className="tl tl2">
        <div className="tl2-lanes" aria-hidden="true">
          <span className="tl2-who"><span className="mdot" style={{ background: A, width: 14, height: 14 }} />Ida</span>
          <span className="tl2-who">Jonas<span className="mdot" style={{ background: B, width: 14, height: 14 }} /></span>
        </div>
        <h3 className="tl-wk"><span>This week</span></h3>
        {SAMPLE.map((s) => {
          const [c1, c2] = bowlTint(s.roast);
          return (
            <div key={s.name} className="tl2-row" style={{ cursor: "default" }}>
              <Side side="l" v={s.a} q={s.qa} color={A} />
              <div className="tl2-mid">
                <span className="bowl" style={{ width: 54, height: 54, display: "inline-block", "--b": c1, "--b2": c2 }} aria-hidden="true">{s.top && <Ring />}</span>
                {s.b != null && Math.abs(s.a - s.b) >= 1.5 && <span className="tl2-split"><PencilMark>split</PencilMark></span>}
                <span className="tl-name">{s.name}</span>
                <span className="tl-sub">{s.roaster}</span>
              </div>
              <Side side="r" v={s.b} q={s.qb} color={B} />
            </div>
          );
        })}
      </div>
      <figcaption className="lp-cap">Sample entries. Yours will be your crew's own.</figcaption>
    </figure>
  );
}

export default function LandingPage() {
  const go = (path) => (e) => { e.preventDefault(); navigate(path); };
  return (
    <div className="ct lp">
      <header className="lp-top">
        <span className="ct-word">Koffeinkartellet</span>
        <a href="/login" className="lp-signin" onClick={go("/login")}>Sign in</a>
      </header>

      <main className="lp-main">
        <section className="lp-copy">
          <h1>A coffee journal for a few friends.</h1>
          <p className="lp-lede">We log the coffees we brew, pencil in our scores side by side, and settle arguments about natural Ethiopians with actual numbers.</p>
          <div className="lp-cta">
            <a href="/login?invite" className="btn lp-btn-main" onClick={go("/login?invite")}>I have an invite</a>
          </div>
        </section>
        <div className="lp-table"><SampleTable /></div>
        <section className="lp-more" aria-label="What it does">
          <dl className="lp-points">
            <div><dt>Score it together</dt><dd>Everyone's score sits next to everyone else's, so you see at a glance where you agree and where you split.</dd></div>
            <div><dt>Check a bag in the café</dt><dd>Snap the label. You see what the crew thought of that roaster, then whether it suits your palate.</dd></div>
            <div><dt>Private by default</dt><dd>Only people with an invite get in. No public reviews, no feed of strangers.</dd></div>
          </dl>
        </section>
      </main>

      <footer className="lp-foot">No invite? Ask whoever sent you the link.</footer>
    </div>
  );
}
