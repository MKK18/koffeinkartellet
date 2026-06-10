import { useState, useEffect, useRef } from "react";
import { C, serif, sans } from "./ui.jsx";
import { useIsWide } from "./useMediaQuery.js";
import { navigate } from "./router.js";

// Editorial accent serif, landing page only.
const fraunces = "'Fraunces', Georgia, serif";

const TICKER = [
  ["Ethiopia", "strawberry jam", "9.0"],
  ["Kenya", "blackcurrant", "8.7"],
  ["Panama Gesha", "jasmine", "9.5"],
  ["Colombia", "boozy mango", "8.0"],
  ["Yirgacheffe", "bergamot", "9.2"],
  ["Huila", "lychee", "8.5"],
  ["Nyeri", "winey", "9.0"],
  ["Sidamo", "white grape", "8.7"],
];

function Ticker() {
  const row = TICKER.map(([origin, note, score], i) => (
    <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: 14, paddingRight: 14 }}>
      <span style={{ fontFamily: serif, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>{origin}</span>
      <span style={{ fontFamily: fraunces, fontStyle: "italic", fontWeight: 400, opacity: 0.85 }}>{note}</span>
      <span style={{ fontFamily: serif, fontWeight: 800, color: C.accent }}>{score}</span>
      <span style={{ opacity: 0.35 }}>✱</span>
    </span>
  ));
  return (
    <div style={{ overflow: "hidden", borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, padding: "13px 0", background: C.bg }}>
      <div style={{ display: "inline-flex", whiteSpace: "nowrap", animation: "lp-marquee 36s linear infinite", fontSize: 15, color: C.ink }}>
        <span style={{ display: "inline-flex" }}>{row}</span>
        <span style={{ display: "inline-flex" }} aria-hidden="true">{row}</span>
      </div>
    </div>
  );
}

// An actual coffee-ring stain: turbulence-displaced strokes (the wobble a real
// cup leaves), uneven double ring, a couple of stray droplets.
function Stain({ size = 320, color = "139,94,60", alpha = 1, seed = 2, strength = 1, style }) {
  const id = `lp-stain-${seed}-${Math.round(size)}`;
  const a = (base) => Math.min(1, base * strength);
  return (
    <svg
      viewBox="0 0 200 200" width={size} height={size} aria-hidden="true"
      style={{ display: "block", pointerEvents: "none", overflow: "visible", ...style }}
    >
      <defs>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="3" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="17" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} opacity={alpha} transform="rotate(-8 100 100) scale(1 0.97)">
        <circle cx="100" cy="100" r="78" fill="none" stroke={`rgba(${color},${a(0.14)})`} strokeWidth="9" />
        <circle cx="101" cy="99" r="70" fill="none" stroke={`rgba(${color},${a(0.09)})`} strokeWidth="3" />
        <circle cx="99" cy="101" r="85" fill="none" stroke={`rgba(${color},${a(0.06)})`} strokeWidth="1.6" />
        <circle cx="160" cy="58" r="5" fill={`rgba(${color},${a(0.09)})`} />
        <circle cx="40" cy="142" r="3.4" fill={`rgba(${color},${a(0.07)})`} />
        <circle cx="172" cy="118" r="2.2" fill={`rgba(${color},${a(0.08)})`} />
      </g>
    </svg>
  );
}

// Scroll-triggered reveal: fades + rises once its top clears the viewport edge.
// Plain scroll check rather than IntersectionObserver — instant jumps (anchors,
// fast flicks) can skip right past an observer without ever intersecting.
function Reveal({ children, delay = 0, as = "div", y = 26, style }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => {
      const el = ref.current;
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        setOn(true);
        window.removeEventListener("scroll", check);
        window.removeEventListener("resize", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  const Tag = as;
  return (
    <Tag ref={ref} style={{
      display: as === "span" ? "inline-block" : undefined,
      opacity: on ? 1 : 0,
      transform: on ? "none" : `translateY(${y}px)`,
      transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      ...style,
    }}>{children}</Tag>
  );
}

function PhoneMockup() {
  const beans = [
    { name: "Daye Bensa Bombe", roaster: "DAK Coffee Roasters", origin: "Ethiopia, Sidamo", score: "8.7" },
    { name: "Kieni AA", roaster: "Coffee Collective", origin: "Kenya, Nyeri", score: "9.0" },
    { name: "Hartmann Geisha", roaster: "La Cabra", origin: "Panama, Chiriqui", score: "9.2" },
  ];
  return (
    <div style={{
      position: "relative", width: 270, margin: "0 auto",
      background: "#1a1a1a", borderRadius: 44, padding: 12,
      boxShadow: "0 8px 30px rgba(0,0,0,0.14), 0 30px 60px rgba(42,26,16,0.18)",
      transform: "rotate(-3deg)",
    }}>
      <div style={{
        position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
        width: 86, height: 24, background: "#1a1a1a", borderRadius: 20, zIndex: 10,
      }} />
      <div style={{ borderRadius: 34, overflow: "hidden", background: C.card }}>
        <div style={{ height: 46, background: C.ink }} />
        <div style={{ background: C.ink, padding: "0 18px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7a6050", fontFamily: sans }}>
              Koffeinkollektivet
            </div>
            <div style={{ fontFamily: serif, fontSize: 14, fontWeight: 800, color: "#fff8f0", textTransform: "uppercase" }}>
              The catalog
            </div>
          </div>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: sans, fontSize: 10, fontWeight: 600 }}>
            K
          </div>
        </div>
        <div style={{ padding: "12px 14px 6px" }}>
          <div style={{ background: "#ece3d5", borderRadius: 10, padding: "8px 12px", fontFamily: sans, fontSize: 11, color: C.faint }}>
            Search coffees, roasters, origins...
          </div>
        </div>
        <div style={{ padding: "8px 14px 18px" }}>
          {beans.map((b, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "12px 0",
              borderBottom: i < beans.length - 1 ? "1px solid #ece3d5" : "none",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, color: C.ink }}>{b.name}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: sans, marginTop: 2 }}>{b.roaster}</div>
                <div style={{ fontSize: 9, color: C.faint, fontFamily: sans, marginTop: 1 }}>{b.origin}</div>
              </div>
              <div style={{ fontFamily: fraunces, fontStyle: "italic", fontWeight: 600, fontSize: 18, color: C.accent, flexShrink: 0, marginLeft: 12 }}>{b.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FLAVOR_SPECIMEN = [
  { w: "Jasmine", f: "fraunces", size: 44, color: "ink" },
  { w: "FUNKY", f: "archivo", size: 52, color: "accent" },
  { w: "blackcurrant", f: "fraunces", size: 34, color: "muted" },
  { w: "STONE FRUIT", f: "archivo", size: 28, color: "ink" },
  { w: "Bergamot", f: "fraunces", size: 56, color: "ink" },
  { w: "WINEY", f: "archivo", size: 36, color: "muted" },
  { w: "lychee", f: "fraunces", size: 30, color: "accent" },
  { w: "CARAMEL", f: "archivo", size: 44, color: "ink" },
  { w: "Rose", f: "fraunces", size: 38, color: "muted" },
  { w: "JUICY", f: "archivo", size: 58, color: "ink" },
  { w: "tomato?", f: "fraunces", size: 26, color: "faint" },
  { w: "CLEAN", f: "archivo", size: 30, color: "muted" },
  { w: "Earl Grey", f: "fraunces", size: 46, color: "accent" },
  { w: "TROPICAL", f: "archivo", size: 34, color: "ink" },
];

// Masked line: type rises out of an overflow-hidden strip on load.
function RiseLine({ children, delay = 0, style }) {
  return (
    <span style={{ display: "block", overflow: "hidden" }}>
      <span style={{
        display: "block",
        animation: `lp-rise 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
        ...style,
      }}>{children}</span>
    </span>
  );
}

export default function LandingPage({ user }) {
  const wide = useIsWide();
  const [scrolled, setScrolled] = useState(false);
  const [cups, setCups] = useState([]);
  const ringFar = useRef(null);
  const ringNear = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (to) => (e) => { e.preventDefault(); navigate(to); };
  const colorOf = (k) => k === "accent" ? C.accent : k === "muted" ? C.muted : k === "faint" ? C.faint : C.ink;

  // Mouse parallax on the hero stains — refs only, no re-render per move.
  const onHeroMove = (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    if (ringFar.current) ringFar.current.style.transform = `translate3d(${x * 28}px, ${y * 20}px, 0)`;
    if (ringNear.current) ringNear.current.style.transform = `translate3d(${x * -16}px, ${y * -11}px, 0)`;
  };

  // Set a cup down: click anywhere non-interactive in the hero → a stain blooms.
  const setCupDown = (e) => {
    if (e.target.closest("a, button, input")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCups((prev) => [
      ...prev.slice(-7),
      {
        id: Date.now() + Math.random(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        seed: 10 + Math.floor(Math.random() * 90),
      },
    ]);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, overflowX: "hidden", color: C.ink }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lp-rise { from { transform: translateY(112%); } to { transform: translateY(0); } }
        @keyframes lp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lp-stain {
          0% { opacity: 0; transform: scale(0.45); }
          55% { opacity: 1; }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes lp-dry { to { opacity: 0.5; } }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: scrolled ? "rgba(246,239,226,0.94)" : C.bg,
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: `1px solid ${C.ink}`,
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 16, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
            Koffeinkollektivet
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {user ? (
              <a href="/app" onClick={go("/app")} style={{
                padding: "8px 20px", borderRadius: 999, background: C.ink, color: "#fff8f0",
                fontFamily: sans, fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>Open app</a>
            ) : (
              <>
                <a href="/login" onClick={go("/login")} style={{
                  color: C.ink, fontFamily: sans, fontSize: 13, fontWeight: 500,
                  textDecoration: "none", borderBottom: `1px solid ${C.ink}`, paddingBottom: 1,
                }}>Sign in</a>
                <a href="/login" onClick={go("/login")} style={{
                  padding: "8px 20px", borderRadius: 999, background: C.ink, color: "#fff8f0",
                  fontFamily: sans, fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}>Get started</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header
        onMouseMove={onHeroMove}
        onClick={setCupDown}
        style={{ position: "relative", padding: "0 24px", cursor: "pointer" }}
      >
        {/* Parallax stains */}
        <div ref={ringFar} style={{
          position: "absolute", top: wide ? 50 : 30, right: wide ? "3%" : "-22%",
          transition: "transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)", willChange: "transform",
        }}>
          <Stain size={wide ? 500 : 300} seed={7} />
        </div>
        <div ref={ringNear} style={{
          position: "absolute", bottom: 30, left: wide ? "5%" : "-14%",
          transition: "transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)", willChange: "transform",
        }}>
          <Stain size={wide ? 280 : 180} seed={23} alpha={0.8} />
        </div>

        {/* Cups the visitor has set down */}
        {cups.map((cup) => (
          <div key={cup.id} style={{
            position: "absolute", left: cup.x, top: cup.y,
            transform: "translate(-50%, -50%)", pointerEvents: "none",
          }}>
            {/* bloom in, then "dry" back toward ambient */}
            <div style={{
              animation: "lp-stain 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both, lp-dry 6s ease 1.5s forwards",
            }}>
              <Stain size={130 + (cup.seed % 70)} seed={cup.seed} strength={2.4} />
            </div>
          </div>
        ))}

        <div style={{ maxWidth: 1240, margin: "0 auto", padding: wide ? "84px 0 72px" : "56px 0 48px", position: "relative" }}>
          {/* Editorial meta line */}
          <div style={{
            display: "flex", justifyContent: "space-between", fontFamily: sans,
            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted,
            marginBottom: wide ? 48 : 32, animation: "lp-fadeUp 0.7s ease 0.45s both",
          }}>
            <span>A shared tasting journal</span>
            {wide && <span>For coffee households</span>}
            <span>Est. one great cup ago</span>
          </div>

          <h1 style={{
            margin: 0, textTransform: "uppercase",
            fontFamily: serif, fontWeight: 900, color: C.ink,
            fontSize: wide ? "clamp(80px, 11vw, 150px)" : "clamp(56px, 16vw, 80px)",
            lineHeight: 0.88, letterSpacing: "-0.04em",
          }}>
            <RiseLine delay={80}>Every cup,</RiseLine>
          </h1>
          <div style={{
            fontFamily: fraunces, fontStyle: "italic", fontWeight: 400, color: C.accent,
            fontSize: wide ? "clamp(80px, 10.5vw, 144px)" : "clamp(52px, 15vw, 76px)",
            lineHeight: 1.04, letterSpacing: "-0.02em", textTransform: "none",
          }}>
            <RiseLine delay={220} style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}>remembered.</RiseLine>
          </div>

          <div style={{
            display: "flex", alignItems: wide ? "flex-end" : "flex-start",
            flexDirection: wide ? "row" : "column",
            justifyContent: "space-between", gap: 28,
            marginTop: wide ? 64 : 40, animation: "lp-fadeUp 0.7s ease 0.55s both",
          }}>
            <div>
              <p style={{
                margin: 0, maxWidth: 380, fontFamily: sans, fontSize: 16,
                lineHeight: 1.65, color: C.muted,
              }}>
                Snap the bag, brew, and rate together. Koffeinkollektivet is the tasting
                journal your household keeps coming back to — one cup at a time.
              </p>
              <div style={{
                marginTop: 14, fontFamily: fraunces, fontStyle: "italic",
                fontSize: 13.5, color: C.faint,
              }}>
                Go on — set your cup down anywhere.
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href={user ? "/app" : "/login"} onClick={go(user ? "/app" : "/login")} style={{
                padding: "15px 34px", borderRadius: 999, background: C.accent, color: "#fff8f0",
                fontFamily: sans, fontSize: 15, fontWeight: 600, textDecoration: "none",
                boxShadow: "0 10px 28px rgba(226,97,29,0.32)",
              }}>
                {user ? "Open your journal" : "Start your journal"}
              </a>
              {!user && (
                <a href="/login" onClick={go("/login")} style={{
                  padding: "15px 30px", borderRadius: 999, background: "transparent",
                  border: `1px solid ${C.ink}`, color: C.ink,
                  fontFamily: sans, fontSize: 15, fontWeight: 500, textDecoration: "none",
                }}>Sign in</a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Tasting-notes ticker ── */}
      <Ticker />

      {/* ── How it works: editorial index ── */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: wide ? "96px 24px" : "64px 24px" }}>
        <Reveal>
          <div style={{
            fontFamily: sans, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: C.muted, marginBottom: 28,
          }}>How it works</div>
        </Reveal>

        {[
          { n: "01", t: "Snap the bag", d: "Photograph any coffee. AI reads the label — origin, process, varietal, tasting notes — and files it in your shared catalog." },
          { n: "02", t: "Brew & rate", d: "Everyone scores independently. Grind setting, brew method, honest notes. No peeking at each other's numbers first." },
          { n: "03", t: "Know your palate", d: "Origins, processes and flavors stack into a taste profile. Next time you're staring at a shelf, you'll know exactly what to buy." },
        ].map((s, i, arr) => (
          <Reveal key={s.n} delay={i * 110}>
            <div style={{
              display: wide ? "grid" : "block",
              gridTemplateColumns: "110px 1fr 1.1fr",
              gap: 24, alignItems: "baseline",
              padding: wide ? "34px 0" : "26px 0",
              borderTop: `1px solid ${C.ink}`,
              borderBottom: i === arr.length - 1 ? `1px solid ${C.ink}` : "none",
            }}>
              <div style={{ fontFamily: fraunces, fontStyle: "italic", fontSize: wide ? 30 : 22, color: C.accent, marginBottom: wide ? 0 : 6 }}>
                {s.n}
              </div>
              <h3 style={{
                margin: 0, fontFamily: serif, fontWeight: 900, textTransform: "uppercase",
                fontSize: wide ? "clamp(28px, 3.2vw, 44px)" : 28, letterSpacing: "-0.02em", lineHeight: 1,
                marginBottom: wide ? 0 : 10,
              }}>{s.t}</h3>
              <p style={{ margin: 0, fontFamily: sans, fontSize: 15, lineHeight: 1.65, color: C.muted }}>
                {s.d}
              </p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ── The score moment (espresso block) ── */}
      <section style={{ background: C.ink, color: "#fff8f0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-15%", right: "-8%" }}>
          <Stain size={wide ? 560 : 320} seed={41} color="255,248,240" alpha={0.55} />
        </div>
        <div style={{
          maxWidth: 1240, margin: "0 auto", padding: wide ? "110px 24px" : "72px 24px",
          display: wide ? "grid" : "block", gridTemplateColumns: "auto 1fr", gap: 72, alignItems: "center",
        }}>
          <Reveal y={34}>
            <div style={{ lineHeight: 0.8, marginBottom: wide ? 0 : 32 }}>
              <span style={{
                fontFamily: fraunces, fontWeight: 600, fontStyle: "italic",
                fontSize: wide ? "clamp(160px, 18vw, 260px)" : "clamp(120px, 32vw, 170px)",
                color: C.accent, letterSpacing: "-0.04em",
              }}>9.5</span>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <p style={{
              margin: 0, fontFamily: fraunces, fontStyle: "italic", fontWeight: 400,
              fontSize: wide ? "clamp(24px, 2.6vw, 36px)" : 22, lineHeight: 1.35, color: "#fff8f0",
            }}>
              "Possibly the best cup of the year. Jasmine front, peach middle,
              sweetness that won't leave."
            </p>
            <div style={{
              marginTop: 22, fontFamily: sans, fontSize: 12, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "#b89870",
            }}>
              Madsy — on Hartmann Geisha, La Cabra
            </div>
            <div style={{ marginTop: 6, fontFamily: sans, fontSize: 12, color: "#7a6050" }}>
              Logged from the kitchen counter. Settled an argument.
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Catalog in your pocket ── */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: wide ? "110px 24px" : "72px 24px", position: "relative" }}>
        <div style={{
          display: wide ? "grid" : "block", gridTemplateColumns: "1fr auto", gap: 80, alignItems: "center",
        }}>
          <Reveal>
            <div style={{ marginBottom: wide ? 0 : 48 }}>
              <h2 style={{
                margin: "0 0 20px", fontFamily: serif, fontWeight: 900, textTransform: "uppercase",
                fontSize: wide ? "clamp(40px, 5vw, 64px)" : 36, lineHeight: 0.95, letterSpacing: "-0.03em",
              }}>
                The whole catalog,{" "}
                <span style={{ fontFamily: fraunces, fontStyle: "italic", fontWeight: 400, textTransform: "none", color: C.accent }}>
                  in your pocket.
                </span>
              </h2>
              <p style={{ margin: "0 0 28px", maxWidth: 420, fontFamily: sans, fontSize: 15, lineHeight: 1.65, color: C.muted }}>
                Every bag you've brewed, every score, every note — searchable at the shelf.
                Install it as an app and it lives next to the grinder.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  "AI reads the bag so you don't type",
                  "Separate scores for every taster",
                  "A verdict before you buy the next bag",
                ].map((x) => (
                  <div key={x} style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: sans, fontSize: 15, color: C.ink }}>
                    <span style={{ width: 22, height: 1, background: C.accent, flexShrink: 0 }} />
                    {x}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={160} y={40}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "-10%", left: "-25%" }}>
                <Stain size={340} seed={67} />
              </div>
              <PhoneMockup />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Flavor specimen ── */}
      <section style={{ borderTop: `1px solid ${C.ink}`, padding: wide ? "96px 24px 110px" : "64px 24px 72px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Reveal>
            <div style={{
              fontFamily: sans, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              color: C.muted, marginBottom: 12,
            }}>The vocabulary</div>
            <p style={{ margin: "0 0 48px", fontFamily: sans, fontSize: 15, color: C.muted, maxWidth: 420, lineHeight: 1.6 }}>
              22 flavor tags and counting. Whatever you taste, there's a word for it —
              and a chart that remembers you tasted it.
            </p>
          </Reveal>
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "baseline",
            columnGap: wide ? 38 : 22, rowGap: wide ? 18 : 10, maxWidth: 1000,
          }}>
            {FLAVOR_SPECIMEN.map(({ w, f, size, color }, i) => (
              <Reveal key={w} as="span" delay={i * 45} y={18}>
                <span style={{
                  fontFamily: f === "fraunces" ? fraunces : serif,
                  fontStyle: f === "fraunces" ? "italic" : "normal",
                  fontWeight: f === "fraunces" ? 400 : 900,
                  textTransform: f === "fraunces" ? "none" : "uppercase",
                  fontSize: wide ? size : Math.round(size * 0.7),
                  letterSpacing: f === "fraunces" ? "-0.01em" : "-0.02em",
                  color: colorOf(color), lineHeight: 1,
                }}>{w}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA (burnt orange block) ── */}
      <section style={{ background: C.accent, color: "#fff8f0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: "-30%", right: "-6%" }}>
          <Stain size={wide ? 500 : 280} seed={83} color="42,26,16" alpha={0.7} />
        </div>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: wide ? "110px 24px" : "72px 24px", position: "relative" }}>
          <Reveal>
            <h2 style={{
              margin: "0 0 12px", fontFamily: serif, fontWeight: 900, textTransform: "uppercase",
              fontSize: wide ? "clamp(56px, 8vw, 110px)" : "clamp(40px, 11vw, 56px)",
              lineHeight: 0.9, letterSpacing: "-0.04em", color: "#fff8f0",
            }}>
              Brew.<br />Rate.<br />
              <span style={{ fontFamily: fraunces, fontStyle: "italic", fontWeight: 400, textTransform: "none", letterSpacing: "-0.02em" }}>
                Remember.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 40, flexWrap: "wrap" }}>
              <a href={user ? "/app" : "/login"} onClick={go(user ? "/app" : "/login")} style={{
                padding: "16px 40px", borderRadius: 999, background: C.ink, color: "#fff8f0",
                fontFamily: sans, fontSize: 16, fontWeight: 600, textDecoration: "none",
              }}>
                {user ? "Open your journal" : "Get started — it's free"}
              </a>
              <span style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,248,240,0.8)" }}>
                Free for your household. Invite-only, like a good dinner party.
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: C.ink, color: "#7a6050", padding: "26px 24px",
        fontFamily: sans, fontSize: 12,
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontFamily: serif, fontWeight: 800, textTransform: "uppercase", color: "#b89870" }}>
            Koffeinkollektivet
          </span>
          <span style={{ fontFamily: fraunces, fontStyle: "italic" }}>every cup, remembered.</span>
        </div>
      </footer>
    </div>
  );
}
