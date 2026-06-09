import { useState, useEffect } from "react";
import { C, serif, sans, FontLink } from "./ui.jsx";
import { navigate } from "./router.js";

function AppMockup() {
  const beans = [
    { name: "Daye Bensa Bombe", roaster: "DAK Coffee Roasters", origin: "Ethiopia, Sidamo", process: "Natural", score: "8.7", tags: ["Fruity", "Floral"] },
    { name: "Kieni AA", roaster: "Coffee Collective", origin: "Kenya, Nyeri", process: "Washed", score: "9.0", tags: ["Bright", "Berry"] },
    { name: "Hartmann Geisha", roaster: "La Cabra", origin: "Panama, Chiriqui", process: "Washed", score: "9.2", tags: ["Floral", "Tropical"] },
  ];

  return (
    <div style={{
      background: C.card, borderRadius: 20, border: `1px solid ${C.borderSoft}`,
      boxShadow: "0 24px 64px rgba(60,30,10,0.12), 0 2px 8px rgba(60,30,10,0.06)",
      overflow: "hidden",
    }}>
      <div style={{ background: C.ink, padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b89870", fontFamily: sans }}>
            ☕ Koffeinkollektivet
          </div>
          <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 800, color: "#fff8f0", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
            The catalog
          </div>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: sans, fontSize: 12, fontWeight: 600 }}>
          K
        </div>
      </div>
      <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {beans.map((b, i) => (
          <div key={i} style={{
            background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 14,
            padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 14, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{b.name}</div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: sans, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {b.roaster} · {b.origin}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#f0e6da", color: "#6b4226", fontFamily: sans }}>{b.process}</span>
                {b.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#e8f0e8", color: "#3a6040", fontFamily: sans }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 20, color: C.accent, flexShrink: 0, marginLeft: 12 }}>{b.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score, label, color, size = 64 }) {
  const r = size * 0.39;
  const circ = 2 * Math.PI * r;
  const pct = (score / 10) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${pct} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill={color}
          style={{ fontSize: size * 0.28, fontFamily: serif, fontWeight: 700 }}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, fontFamily: sans }}>{label}</span>
    </div>
  );
}

export default function LandingPage({ user }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (to) => (e) => { e.preventDefault(); navigate(to); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, overflowX: "hidden" }}>
      <FontLink />
      <style>{`
        @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .lp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(60,30,10,0.10) !important; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: scrolled ? "rgba(246,239,226,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.3s ease",
        borderBottom: scrolled ? `1px solid ${C.borderSoft}` : "1px solid transparent",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 18, color: C.ink, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            Koffeinkollektivet
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {user ? (
              <a href="/app" onClick={go("/app")} style={{
                padding: "9px 22px", borderRadius: 999, background: C.accent, color: "#fff",
                fontFamily: sans, fontSize: 14, fontWeight: 600, textDecoration: "none",
              }}>Open App</a>
            ) : (
              <>
                <a href="/login" onClick={go("/login")} style={{
                  color: C.muted, fontFamily: sans, fontSize: 14, textDecoration: "none", fontWeight: 500,
                }}>Sign in</a>
                <a href="/login" onClick={go("/login")} style={{
                  padding: "9px 22px", borderRadius: 999, background: C.accent, color: "#fff",
                  fontFamily: sans, fontSize: 14, fontWeight: 600, textDecoration: "none",
                }}>Get started</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "72px 24px 48px", textAlign: "center", maxWidth: 780, margin: "0 auto" }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.faint,
          fontFamily: sans, marginBottom: 20, animation: "lp-fadeUp 0.6s ease both",
        }}>
          The coffee journal for discerning households
        </div>
        <h1 style={{
          fontFamily: serif, fontSize: "clamp(34px, 6vw, 62px)", fontWeight: 900,
          color: C.ink, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 24px",
          textTransform: "uppercase", animation: "lp-fadeUp 0.6s ease 0.08s both",
        }}>
          Remember every cup.<br />Share every discovery.
        </h1>
        <p style={{
          fontSize: "clamp(16px, 2.2vw, 19px)", color: C.muted, fontFamily: sans, lineHeight: 1.6,
          maxWidth: 540, margin: "0 auto 36px",
          animation: "lp-fadeUp 0.6s ease 0.16s both",
        }}>
          A beautiful tasting journal for coffee lovers. Snap a bag, rate together,
          and build a shared map of flavors — one cup at a time.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "lp-fadeUp 0.6s ease 0.24s both" }}>
          <a href={user ? "/app" : "/login"} onClick={go(user ? "/app" : "/login")} style={{
            padding: "14px 32px", borderRadius: 999, background: C.accent, color: "#fff",
            fontFamily: sans, fontSize: 16, fontWeight: 600, textDecoration: "none",
            boxShadow: "0 4px 16px rgba(226,97,29,0.3)",
          }}>
            {user ? "Open your journal" : "Start your journal"}
          </a>
          {!user && (
            <a href="/login" onClick={go("/login")} style={{
              padding: "14px 32px", borderRadius: 999, background: "transparent",
              color: C.ink, border: `1.5px solid ${C.border}`,
              fontFamily: sans, fontSize: 16, fontWeight: 500, textDecoration: "none",
            }}>Sign in</a>
          )}
        </div>
      </section>

      {/* ── App mockup ── */}
      <section style={{
        padding: "0 24px 80px", maxWidth: 520, margin: "0 auto",
        animation: "lp-fadeUp 0.6s ease 0.32s both",
      }}>
        <AppMockup />
      </section>

      {/* ── Social proof strip ── */}
      <div style={{
        padding: "20px 24px", textAlign: "center",
        borderTop: `1px solid ${C.borderSoft}`, borderBottom: `1px solid ${C.borderSoft}`,
        background: C.tint,
      }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 32, flexWrap: "wrap", maxWidth: 700, margin: "0 auto" }}>
          <ScoreRing score={9.2} label="Top rated" color={C.accent} size={56} />
          <div style={{ width: 1, height: 36, background: C.borderSoft }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 28, color: C.ink }}>22</div>
            <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, fontFamily: sans }}>Flavor tags</div>
          </div>
          <div style={{ width: 1, height: 36, background: C.borderSoft }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 28, color: C.ink }}>51</div>
            <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, fontFamily: sans }}>Origins tracked</div>
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <section style={{ padding: "80px 24px", background: C.card }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 14 }}>
              How it works
            </div>
            <h2 style={{ fontFamily: serif, fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
              Three steps to coffee clarity
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 40 }}>
            {[
              { num: "01", icon: "📷", title: "Snap the bag", desc: "Take a photo of any coffee package. AI reads the label and fills in origin, process, varietal, and tasting notes automatically." },
              { num: "02", icon: "☕", title: "Brew & rate", desc: "Everyone in the household rates independently. Track grind settings, brew notes, and scores across multiple sessions." },
              { num: "03", icon: "🗺️", title: "Explore your taste", desc: "Watch your coffee map grow. Discover which origins, processes, and flavor profiles your household loves most." },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 14, lineHeight: 1 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontFamily: sans, fontWeight: 600, color: C.accent, letterSpacing: "0.1em", marginBottom: 8 }}>{s.num}</div>
                <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 700, color: C.ink, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, fontFamily: sans, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ padding: "80px 24px", maxWidth: 920, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint, fontFamily: sans, marginBottom: 14 }}>
            Features
          </div>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            Everything a coffee nerd needs
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {[
            { icon: "📸", title: "AI-powered scanning", desc: "Photograph any bag and watch the details fill themselves in. Powered by Claude." },
            { icon: "👥", title: "Household sharing", desc: "Everyone has their own ratings. See where you agree — and where you hilariously don't." },
            { icon: "🌍", title: "Origin map", desc: "A world map colored by your ratings. See your coffee belt preferences at a glance." },
            { icon: "📊", title: "Taste insights", desc: "Charts by origin, process, varietal, and roast level. Your preferences, quantified." },
            { icon: "🏷️", title: "Flavor tagging", desc: "22 flavor tags from Fruity to Funky. Track what lights up your palate." },
            { icon: "📱", title: "Install as an app", desc: "Works offline. Add to your home screen and open it right next to the grinder." },
          ].map((f, i) => (
            <div key={i} className="lp-card" style={{
              background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 16,
              padding: "26px 22px", transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: "0 2px 8px rgba(60,30,10,0.04)", cursor: "default",
            }}>
              <div style={{ fontSize: 28, marginBottom: 14, lineHeight: 1 }}>{f.icon}</div>
              <h3 style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: C.muted, fontFamily: sans, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For whom ── */}
      <section style={{
        padding: "64px 24px", background: C.tint,
        borderTop: `1px solid ${C.borderSoft}`, borderBottom: `1px solid ${C.borderSoft}`,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, color: C.ink, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
            Built for coffee nerds who share a kitchen
          </h2>
          <p style={{ fontSize: 15, color: C.muted, fontFamily: sans, lineHeight: 1.6, margin: "0 0 32px" }}>
            Whether you're a couple with dueling palates, housemates who split bags,
            or a family who argues about roast levels at breakfast — this is your journal.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {["Couples", "Housemates", "Families", "Coffee clubs"].map(w => (
              <span key={w} style={{
                padding: "8px 20px", borderRadius: 999, background: C.card,
                border: `1px solid ${C.borderSoft}`, fontFamily: sans, fontSize: 13,
                color: C.ink, fontWeight: 500,
              }}>{w}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "80px 24px", textAlign: "center", background: C.ink }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: serif, fontSize: "clamp(26px, 4.5vw, 44px)", fontWeight: 900,
            color: "#fff8f0", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.1,
            textTransform: "uppercase",
          }}>
            Ready to start your coffee journal?
          </h2>
          <p style={{ fontSize: 16, color: "#b89870", fontFamily: sans, marginBottom: 32, lineHeight: 1.6 }}>
            Free to use. Invite your household. Never forget a great bean again.
          </p>
          <a href={user ? "/app" : "/login"} onClick={go(user ? "/app" : "/login")} style={{
            display: "inline-block", padding: "16px 36px", borderRadius: 999,
            background: C.accent, color: "#fff",
            fontFamily: sans, fontSize: 16, fontWeight: 600, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(226,97,29,0.4)",
          }}>
            {user ? "Open your journal" : "Get started — it's free"}
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "20px 24px", textAlign: "center", background: "#1a0f08",
        fontFamily: sans, fontSize: 12, color: "#5a4030",
      }}>
        <span style={{ color: "#7a6050" }}>Koffeinkollektivet</span> · app.koffeinkollektivet.dk
      </footer>
    </div>
  );
}
