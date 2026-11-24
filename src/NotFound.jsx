import { navigate } from "./router.js";

// 404 on the table: an empty bowl and one way back.
export default function NotFound({ loggedIn }) {
  return (
    <div className="ct auth">
      <div className="auth-col" style={{ textAlign: "center" }}>
        <div className="auth-card" style={{ padding: "40px 28px 32px" }}>
          <span className="bowl" aria-hidden="true" style={{ width: 96, height: 96, display: "inline-block", "--b": "var(--tint)", "--b2": "var(--rule-2)" }} />
          <h1 style={{ marginTop: 18 }}>Nothing at this address</h1>
          <p className="auth-lede" style={{ marginInline: "auto", maxWidth: "32ch" }}>The link may be old, or the page was moved. Head back to the table.</p>
          <button type="button" onClick={() => navigate(loggedIn ? "/app" : "/")} className="btn btn-primary" style={{ marginTop: 8 }}>
            {loggedIn ? "Back to the table" : "Back to the start"}
          </button>
        </div>
      </div>
    </div>
  );
}
