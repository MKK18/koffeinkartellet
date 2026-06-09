import { useState, useEffect } from "react";
import { C, serif, sans, FontLink } from "./ui.jsx";
import { navigate } from "./router.js";

function AppMockup() {
  const beans = [
    { name: "Daye Bensa Bombe", roaster: "DAK Coffee Roasters", origin: "Ethiopia, Sidamo", score: "8.7" },
    { name: "Kieni AA", roaster: "Coffee Collective", origin: "Kenya, Nyeri", score: "9.0" },
    { name: "Hartmann Geisha", roaster: "La Cabra", origin: "Panama, Chiriqui", score: "9.2" },
  ];

  return (
    <div style={{
      background: C.card, borderRadius: 20,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 24px 64px rgba(60,30,10,0.10)",
      overflow: "hidden",
    }}>
      <div style={{ background: C.ink, padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7a6050", fontFamily: sans }}>
            Koffeinkollektivet
          </div>
          <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 800, color: "#fff8f0", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
            The catalog
          </div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: sans, fontSize: 11, fontWeight: 600 }}>
          K
        </div>
      </div>
      <div style={{ padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
        {beans.map((b, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            paddingBottom: i < beans.length - 1 ? 14 : 0,
            borderBottom: i < beans.length - 1 ? "1px solid #ece3d5" : "none",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 15, color: C.ink, letterSpacing: "-0.01em" }}>{b.name}</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: sans, marginTop: 3 }}>{b.roaster}</div>
              <div style={{ fontSize: 11, color: C.faint, fontFamily: sans, marginTop: 1 }}>{b.origin}</div>
            </div>
            <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 20, color: C.accent, flexShrink: 0, marginLeft: 16 }}>{b.score}</div>
          </div>
        ))}
      </div>
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
        @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: scrolled ? "rgba(246,239,226,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.3s ease",
        borderBottom: scrolled ? "1px solid #ece3d5" : "1px solid transparent",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 17, color: C.ink, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            Koffeinkollektivet
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {user ? (
              <a href="/app" onClick={go("/app")} style={{
                padding: "9px 22px", borderRadius: 999, background: C.ink, color: "#fff8f0",
                fontFamily: sans, fontSize: 14, fontWeight: 600, textDecoration: "none",
              }}>Open App</a>
            ) : (
              <>
                <a href="/login" onClick={go("/login")} style={{
                  color: C.muted, fontFamily: sans, fontSize: 14, textDecoration: "none", fontWeight: 500,
                }}>Sign in</a>
                <a href="/login" onClick={go("/login")} style={{
                  padding: "9px 22px", borderRadius: 999, background: C.ink, color: "#fff8f0",
                  fontFamily: sans, fontSize: 14, fontWeight: 600, textDecoration: "none",
                }}>Get started</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "80px 24px 56px", textAlign: "center", maxWidth: 740, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: serif, fontSize: "clamp(36px, 6.5vw, 68px)", fontWeight: 900,
          color: C.ink, lineHeight: 1.02, letterSpacing: "-0.035em", margin: "0 0 24px",
          textTransform: "uppercase", animation: "lp-fadeUp 0.6s ease both",
        }}>
          Remember<br />every cup.
        </h1>
        <p style={{
          fontSize: "clamp(16px, 2.2vw, 19px)", color: C.muted, fontFamily: sans, lineHeight: 1.6,
          maxWidth: 480, margin: "0 auto 40px",
          animation: "lp-fadeUp 0.6s ease 0.1s both",
        }}>
          A tasting journal for coffee lovers. Snap a bag, rate together, and discover
          your household's palate — one cup at a time.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "lp-fadeUp 0.6s ease 0.18s both" }}>
          <a href={user ? "/app" : "/login"} onClick={go(user ? "/app" : "/login")} style={{
            padding: "14px 36px", borderRadius: 999, background: C.ink, color: "#fff8f0",
            fontFamily: sans, fontSize: 16, fontWeight: 600, textDecoration: "none",
          }}>
            {user ? "Open your journal" : "Start your journal"}
          </a>
          {!user && (
            <a href="/login" onClick={go("/login")} style={{
              padding: "14px 36px", borderRadius: 999, background: "transparent",
              color: C.ink, border: `1.5px solid ${C.border}`,
              fontFamily: sans, fontSize: 16, fontWeight: 500, textDecoration: "none",
            }}>Sign in</a>
          )}
        </div>
      </section>

      {/* ── App mockup ── */}
      <section style={{
        padding: "0 24px 100px", maxWidth: 480, margin: "0 auto",
        animation: "lp-fadeUp 0.6s ease 0.26s both",
      }}>
        <AppMockup />
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "100px 24px", borderTop: "1px solid #ece3d5" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontFamily: serif, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-0.025em", textTransform: "uppercase" }}>
              Three steps
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 48 }}>
            {[
              { num: "1", title: "Snap the bag", desc: "Photograph any coffee package. AI reads the label and fills in origin, process, varietal, and tasting notes." },
              { num: "2", title: "Brew & rate", desc: "Everyone rates independently. Track grind settings, brew methods, and scores across multiple sessions." },
              { num: "3", title: "Discover your taste", desc: "Watch your coffee map grow. See which origins, processes, and flavors your household loves most." },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 48, color: C.borderSoft, lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: C.ink, margin: "0 0 10px", letterSpacing: "-0.01em" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, fontFamily: sans, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "100px 24px", borderTop: "1px solid #ece3d5" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontFamily: serif, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-0.025em", textTransform: "uppercase" }}>
              What's inside
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32 }}>
            {[
              { title: "AI-powered scanning", desc: "Photograph any bag and watch the details fill themselves in. Powered by Claude." },
              { title: "Household sharing", desc: "Everyone has their own ratings. See where you agree — and where you don't." },
              { title: "Origin map", desc: "A world map colored by your scores. See your coffee belt preferences at a glance." },
              { title: "Taste insights", desc: "Charts by origin, process, varietal, and roast level. Your preferences, quantified." },
              { title: "Flavor tagging", desc: "22 flavor tags from Fruity to Funky. Track what lights up your palate." },
              { title: "Works offline", desc: "Install as an app. Open it right next to the grinder, no connection needed." },
            ].map((f, i) => (
              <div key={i} style={{ padding: "4px 0" }}>
                <h3 style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, fontFamily: sans, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "100px 24px", textAlign: "center", background: C.ink }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: serif, fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 900,
            color: "#fff8f0", margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.05,
            textTransform: "uppercase",
          }}>
            Start your journal
          </h2>
          <p style={{ fontSize: 16, color: "#7a6050", fontFamily: sans, marginBottom: 36, lineHeight: 1.6 }}>
            Free to use. Invite your household.<br />Never forget a great bean again.
          </p>
          <a href={user ? "/app" : "/login"} onClick={go(user ? "/app" : "/login")} style={{
            display: "inline-block", padding: "16px 40px", borderRadius: 999,
            background: "#fff8f0", color: C.ink,
            fontFamily: sans, fontSize: 16, fontWeight: 600, textDecoration: "none",
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
        Koffeinkollektivet
      </footer>
    </div>
  );
}
