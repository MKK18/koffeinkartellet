import { useEffect, useRef, useState } from "react";
import { navigate } from "./router.js";
import { FontLink } from "./ui.jsx";

/*
  DIRECTION CONTRACT — seed e6a196ca (impeccable, persuade, new-work §5)
  THESIS: koffeinkartellet as a bonded contraband tasting ledger — refuses the warm-cream / coffee-ring editorial default every coffee site ships.
  OWN-WORLD: bonded-warehouse customs manifest. Ink-black ground, aged manila panels, one customs-stamp red. Anton display, Martian Mono tallies, Archivo body. Letterpress rules; stamps as an immaculate branded system; state by mark, not hue.
  STORY: visitor sees coffees logged, scored, stamped BUY/MAYBE/SKIP by a private crew → wants in → presents an invite.
  FIRST VIEWPORT: full-bleed ink manifest; monumental LOGGED·SCORED·STAMPED; a live ledger entry stamping a 9.2; PRESENT INVITE stamp-button.
  FORM: contraband ledger — #4 of the grounded list, assigned by the roll; raised by TDR (immaculate marks), split-flap (mechanical verdict), jackfield (state-by-mark).
  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
*/

const VERDICTS = {
  BUY:   { c: "#7fae6a", s: "92% MATCH", w: "high on your washed Kenyans" },
  MAYBE: { c: "#e8a13a", s: "61% MATCH", w: "you run cool on light naturals" },
  SKIP:  { c: "#e2431d", s: "28% MATCH", w: "the Auditor has vetoed this roaster twice" },
};
const ORDER = ["BUY", "MAYBE", "SKIP"];

function SplitFlap() {
  const [v, setV] = useState("BUY");
  const [flip, setFlip] = useState(false);
  const flapRef = useRef(null);
  const idx = useRef(0);
  const timer = useRef(null);

  const to = (next) => {
    setFlip(false);
    requestAnimationFrame(() => setFlip(true));
    setTimeout(() => setV(next), 150);
    idx.current = ORDER.indexOf(next);
  };
  const advance = () => to(ORDER[(idx.current + 1) % ORDER.length]);

  useEffect(() => {
    timer.current = setInterval(advance, 2600);
    const el = flapRef.current;
    let io;
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver((es) => es.forEach((e) => {
        clearInterval(timer.current);
        if (e.isIntersecting) timer.current = setInterval(advance, 2600);
      }), { threshold: 0.2 });
      io.observe(el);
    }
    return () => { clearInterval(timer.current); io && io.disconnect(); };
  }, []);

  const st = VERDICTS[v];
  return (
    <div className="cl-lp-flapwrap">
      <div ref={flapRef} className={"cl-flap" + (flip ? " flip" : "")} aria-live="polite">
        <div className="cl-flap-txt" style={{ "--flapc": st.c }}>{v}</div>
      </div>
      <div className="cl-lp-flapmeta">KIENI AA · <b style={{ color: st.c }}>{st.s}</b><br />{st.w}</div>
      <div className="cl-lp-flapbtns">
        {ORDER.map((k) => (
          <button key={k} onClick={() => { clearInterval(timer.current); to(k); }}>{k[0] + k.slice(1).toLowerCase()}</button>
        ))}
      </div>
    </div>
  );
}

const go = (e) => { if (e) e.preventDefault(); navigate("/login"); };

export default function LandingPage() {
  return (
    <div className="cl">
      <FontLink />
      <style>{LP_CSS}</style>

      <header className="cl-masthead">
        <div className="cl-wrap">
          <div className="cl-brand">KOFFEIN<b>KARTELLET</b></div>
          <nav className="cl-mast-meta">
            <span>LEDGER <i>N° 07</i></span>
            <span>STATUS <i>BONDED</i></span>
            <span>ENTRIES <i className="tnum">1,204</i></span>
          </nav>
          <button className="cl-ghost-btn" onClick={go}>Present invite</button>
        </div>
      </header>

      <main>
        <section className="cl-lp-hero">
          <div className="cl-wrap cl-lp-herogrid">
            <div>
              <div className="cl-lp-stampline cl-stamp-in">
                <span className="cl-doc-stamp">Members only</span>
                <span>Bonded tasting ledger · est. Copenhagen</span>
              </div>
              <h1 className="cl-head cl-stamp-in">Logged.<br /><span className="l2">Scored.</span><br /><span className="l3">Stamped.</span></h1>
              <p className="cl-lp-dek">Every bag your crew brews gets entered, scored, and stamped with a verdict. Photograph a bag and it books itself in — roaster, origin, process, notes. Then the cartel argues. <b>Entry is by invitation.</b></p>
              <div className="cl-lp-cta">
                <button className="cl-stamp-btn" onClick={go}>Present invite <span className="arw">→</span></button>
                <span className="cl-lp-ctanote">No open door. Someone vouches, or you request a seat.</span>
              </div>
            </div>

            <figure className="cl-entry cl-stamp-in" style={{ margin: 0, transform: "rotate(.5deg)" }}>
              <div className="cl-entry-top"><span>ENTRY · 1,204</span><span className="tnum">14·11·26</span></div>
              <div className="cl-entry-body">
                <div className="cl-entry-score tnum">9<sup>.2</sup></div>
                <div>
                  <div className="cl-entry-name">Kieni AA</div>
                  <div className="cl-entry-sub">Tembo Coffee · Nyeri, Kenya<br />Washed · SL28 / SL34 · 1,750m</div>
                  <div className="cl-tags"><span className="cl-tag">Blackcurrant</span><span className="cl-tag">Grapefruit</span><span className="cl-tag">Cane sugar</span><span className="cl-tag">Juicy</span></div>
                </div>
              </div>
              <span className="cl-ink-stamp" style={{ position: "absolute", right: 16, bottom: 14 }}>Buy ✓</span>
            </figure>
          </div>
        </section>

        <section className="cl-wrap">
          <div className="cl-sec-head"><span className="no">A</span><span>The mechanism</span><span className="ln" /><span>03 movements</span></div>
          <h2 className="cl-sec-title">A bag books itself in.</h2>
          <div className="cl-manifest" style={{ marginTop: 34 }}>
            <Row idx="M·01" title="Scan the bag" desc="Photograph the packaging or paste a roaster link. It reads roaster, origin, region, producer, varietal, process, altitude and notes — and files the entry." io={<>IN&nbsp;&nbsp;→ photo.jpg<br />OUT → <b>14 fields, stamped</b></>} mark={<CamMark />} />
            <Row idx="M·02" title="Your crew scores it" desc="Every member rates 0–10 and tags the flavors they caught. Scores accumulate into one shared palate the household can read — and dispute." io={<>RATERS → 4 active<br />PALATE → <b>1,204 tastings</b></>} mark={<StarMark />} />
            <Row idx="M·03" title="Get the verdict — in the shop" desc={<>Standing at the roaster, scan a bag you don't own. It weighs it against your palate and stamps <b style={{ color: "var(--bone)" }}>buy</b>, <b style={{ color: "var(--bone)" }}>maybe</b>, or <b style={{ color: "var(--bone)" }}>skip</b>, with the reasons.</>} io={<>MATCH → palate × bag<br />OUT → <b style={{ color: "var(--stamp)" }}>a stamp</b></>} mark={<CheckMark />} />
          </div>

          <div className="cl-lp-verdict">
            <div>
              <div className="cl-sec-head" style={{ paddingTop: 0 }}><span className="no">B</span><span>Signature · buy verdict</span></div>
              <h2 className="cl-sec-title" style={{ fontSize: "clamp(26px,4vw,42px)" }}>The stamp that saves you 180&nbsp;kr.</h2>
              <p className="cl-sec-lede">One tap in the shop. The board turns over and lands on the only three words that matter. No stars, no paragraphs — a verdict you can act on before the barista looks up.</p>
            </div>
            <SplitFlap />
          </div>
        </section>

        <section className="cl-wrap" style={{ marginTop: "clamp(60px,9vw,120px)" }}>
          <div className="cl-sec-head"><span className="no">C</span><span>The shared palate</span><span className="ln" /><span>household · 4</span></div>
          <h2 className="cl-sec-title">Four palates, one ledger.</h2>
          <p className="cl-sec-lede">The cartel's standing averages — who runs hot, who never gives a nine.</p>
          <div style={{ marginTop: 34, borderTop: "1px solid var(--ink-line)" }}>
            <Palate dot="#e2431d" who="Kiki" meta="washed · florals · 312 entries" pct={82} avg="8.2" />
            <Palate dot="#e8a13a" who="Mads" meta="naturals · funk · 288 entries" pct={74} avg="7.4" />
            <Palate dot="#7fae6a" who="Sof" meta="anaerobic · fruit bombs · 341 entries" pct={88} avg="8.8" />
            <Palate dot="#8a7c67" who="The Auditor" meta="never impressed · 263 entries" pct={61} avg="6.1" />
          </div>
        </section>

        <section className="cl-wrap" style={{ marginTop: "clamp(60px,9vw,120px)" }}>
          <div className="cl-sec-head"><span className="no">D</span><span>Specimen · entry 1,204</span><span className="ln" /></div>
          <div className="cl-lp-specimen">
            <div className="cl-lp-spec q">
              <div className="cl-lp-speclab">Tasting note · on the record</div>
              <p className="cl-lp-quote">Blackcurrant the second it hits, then a grapefruit acidity that will not quit. Cane sugar underneath keeps it from turning shrill. The cleanest cup on the ledger this month.</p>
              <div className="cl-lp-byline">— Sof, stamped 14·11·26</div>
            </div>
            <div className="cl-lp-spec">
              <div className="cl-lp-speclab">Manifest</div>
              <dl className="cl-lp-specdata">
                <dt>Roaster</dt><dd>Tembo Coffee</dd>
                <dt>Origin</dt><dd>Nyeri, Kenya</dd>
                <dt>Process</dt><dd>Washed</dd>
                <dt>Varietal</dt><dd>SL28 / SL34</dd>
                <dt>Altitude</dt><dd className="tnum">1,750 m</dd>
                <dt>Roast</dt><dd>Light</dd>
                <dt className="full">Crew score</dt><dd className="full tnum" style={{ fontFamily: "var(--font-display)", fontSize: 44, color: "var(--stamp)", lineHeight: 1 }}>9.2 / 10</dd>
              </dl>
            </div>
          </div>
        </section>

        <section className="cl-lp-close">
          <div className="cl-wrap">
            <p className="cl-lp-big">Entry is by <em>invitation.</em></p>
            <p className="cl-lp-sub">Have a code? Present it. Otherwise, request a seat and wait to be vouched for.</p>
            <div className="cl-lp-cta" style={{ justifyContent: "center" }}>
              <button className="cl-stamp-btn" onClick={go}>Present invite <span className="arw">→</span></button>
              <button className="cl-ghost-btn" onClick={go}>Request a seat</button>
            </div>
          </div>
        </section>

        <footer className="cl-lp-foot cl-wrap">
          <span>Koffeinkartellet · Bonded Tasting Ledger N° 07</span>
          <span>Copenhagen · Invite-only · PWA</span>
          <span className="tnum">1,204 entries on file</span>
        </footer>
      </main>
    </div>
  );
}

function Row({ idx, title, desc, io, mark }) {
  return (
    <div className="cl-mrow">
      <div className="idx">{idx}</div>
      <div className="mdesc"><h3>{title}</h3><p>{desc}</p></div>
      <div className="io">{io}</div>
      <div className="mk">{mark}</div>
    </div>
  );
}
function Palate({ dot, who, meta, pct, avg }) {
  return (
    <div className="cl-prow">
      <span className="dot" style={{ background: dot }} />
      <span className="who">{who} <small>{meta}</small></span>
      <span className="cl-bar"><i style={{ width: pct + "%" }} /></span>
      <span className="avg tnum">{avg}</span>
    </div>
  );
}
const CamMark = () => (<svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#e2431d" strokeWidth="2"><rect x="8" y="12" width="36" height="28" rx="1" /><path d="M8 20h36" /><circle cx="26" cy="30" r="6" /><path d="M18 12l3-4h10l3 4" /></svg>);
const StarMark = () => (<svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#e2431d" strokeWidth="2"><path d="M26 8l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" /></svg>);
const CheckMark = () => (<svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#e2431d" strokeWidth="2"><path d="M12 26l9 9 19-19" /></svg>);

const LP_CSS = `
.cl-lp-hero{padding:clamp(40px,7vw,86px) 0 clamp(48px,7vw,92px)}
.cl-lp-herogrid{display:grid;grid-template-columns:1.15fr .85fr;gap:clamp(28px,4vw,60px);align-items:end}
@media(max-width:900px){.cl-lp-herogrid{grid-template-columns:1fr;align-items:stretch}}
.cl-lp-stampline{display:flex;align-items:center;gap:14px;font-family:var(--font-mono);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--dim);margin-bottom:26px;flex-wrap:wrap}
.cl-lp-dek{max-width:46ch;margin:26px 0 30px;color:var(--manila);font-size:clamp(16px,1.9vw,19px);line-height:1.55}
.cl-lp-dek b{color:var(--bone);font-weight:600}
.cl-lp-cta{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.cl-lp-ctanote{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim-2);max-width:20ch;line-height:1.5}
.cl-lp-verdict{margin-top:30px;background:var(--ink-2);border:1px solid var(--ink-line);padding:clamp(24px,4vw,48px);display:grid;grid-template-columns:1fr auto;gap:36px;align-items:center}
@media(max-width:820px){.cl-lp-verdict{grid-template-columns:1fr;gap:26px}}
.cl-lp-flapwrap{display:flex;flex-direction:column;align-items:center;gap:16px}
.cl-lp-flapmeta{font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);text-align:center;line-height:1.6}
.cl-lp-flapbtns{display:flex;gap:8px}
.cl-lp-flapbtns button{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);background:none;border:1px solid var(--ink-line);padding:8px 12px;cursor:pointer;transition:.15s}
.cl-lp-flapbtns button:hover{color:var(--bone);border-color:var(--dim)}
.cl-lp-specimen{margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--ink-line);border:1px solid var(--ink-line)}
@media(max-width:760px){.cl-lp-specimen{grid-template-columns:1fr}}
.cl-lp-spec{background:var(--ink);padding:clamp(22px,3vw,34px)}
.cl-lp-spec.q{background:var(--ink-2)}
.cl-lp-speclab{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin-bottom:16px}
.cl-lp-quote{font-family:var(--font-body);font-weight:500;font-style:italic;font-size:clamp(19px,2.4vw,25px);line-height:1.45;color:var(--bone);margin:0}
.cl-lp-quote::before{content:"“";color:var(--stamp)}
.cl-lp-quote::after{content:"”";color:var(--stamp)}
.cl-lp-byline{font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-top:18px}
.cl-lp-specdata{columns:2;column-gap:26px;margin:0}
.cl-lp-specdata dt{font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);margin-top:14px}
.cl-lp-specdata dd{margin:3px 0 0;font-weight:600;font-size:16px}
.cl-lp-specdata .full{column-span:all}
.cl-lp-close{padding:clamp(56px,9vw,120px) 0;text-align:center}
.cl-lp-big{font-family:var(--font-display);font-size:clamp(40px,9vw,120px);line-height:.9;text-transform:uppercase;color:var(--bone);margin:0}
.cl-lp-big em{font-style:normal;color:var(--stamp)}
.cl-lp-sub{font-family:var(--font-mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin:22px 0 34px}
.cl-lp-foot{border-top:1px solid var(--ink-line);padding:26px 0 60px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px;font-family:var(--font-mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim-2)}
`;
