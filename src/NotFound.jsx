import { FontLink } from "./ui.jsx";
import { navigate } from "./router.js";

// 404 — a page the ledger has no record of. Kept in the Contraband Ledger world:
// a stamped VOID over a monumental code, one way back.
export default function NotFound({ loggedIn }) {
  return (
    <div className="cl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <FontLink />
      <div style={{ position: "relative", textAlign: "center", maxWidth: 460 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 18 }}>
          Koffeinkartellet · Bonded Ledger
        </div>

        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(96px,26vw,200px)", lineHeight: 0.82, color: "var(--bone)", letterSpacing: "-0.02em" }}>
            4<span style={{ color: "var(--stamp)" }}>0</span>4
          </div>
          {/* stamped over the code */}
          <span style={{
            position: "absolute", top: "52%", left: "50%",
            transform: "translate(-50%,-50%) rotate(-11deg)",
            border: "3px solid var(--stamp-deep)", color: "var(--stamp-deep)",
            fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "clamp(18px,4vw,26px)",
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 16px",
            borderRadius: 4, opacity: 0.92, background: "rgba(16,13,10,0.55)", whiteSpace: "nowrap",
          }}>Not on file</span>
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--manila)", lineHeight: 1.55, margin: "22px auto 0", maxWidth: "34ch" }}>
          No entry at this address. Either it was never logged, or it's been struck from the ledger.
        </p>

        <button
          onClick={() => navigate(loggedIn ? "/app" : "/")}
          className="cl-stamp-btn"
          style={{ marginTop: 30 }}
        >
          Back to the ledger <span className="arw">→</span>
        </button>
      </div>
    </div>
  );
}
