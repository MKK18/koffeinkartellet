import { useState, useEffect } from "react";
import { useAuth } from "./auth.jsx";
import { Sheet, Avatar } from "./components.jsx";
import { listInvites, createInvite, deleteInvite, ensureMyHousehold } from "./data.js";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";

const badge = { fontSize: 9, background: "var(--stamp)", color: "#fff", padding: "2px 7px", letterSpacing: "0.12em", fontFamily: MONO, verticalAlign: "middle" };

function AdminInvites() {
  const [invites, setInvites] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const load = () => listInvites().then(setInvites).catch(() => setInvites([]));
  useEffect(() => { load(); }, []);

  const mint = async (kind) => {
    setBusy(true);
    try {
      const group = kind === "join_group" ? (await ensureMyHousehold()).group?.id : null;
      await createInvite({ kind, group });
      await load();
    } finally { setBusy(false); }
  };
  const copy = (code) => { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(""), 1500); };
  const remove = async (id) => { if (confirm("Delete this invite?")) { await deleteInvite(id); await load(); } };

  return (
    <div style={{ marginTop: 20, padding: 16, background: "var(--ink)", border: "1px solid var(--ink-line)" }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 20, textTransform: "uppercase", color: "var(--bone)", marginBottom: 5 }}>Invites <span style={badge}>ADMIN</span></div>
      <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: MONO, letterSpacing: "0.04em", marginBottom: 12 }}>Mint a code and share it. Recipients use it to sign up.</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => mint("join_group")} disabled={busy} className="cl-stamp-btn" style={{ padding: "12px 16px", fontSize: 11 }}>+ Invite to household</button>
        <button onClick={() => mint("new_household")} disabled={busy} className="cl-ghost-btn" style={{ padding: "12px 16px" }}>+ New household</button>
      </div>
      {invites === null ? <div style={{ color: "var(--dim)", fontFamily: MONO, fontSize: 12 }}>Loading…</div> : invites.length === 0 ? (
        <div style={{ color: "var(--dim-2)", fontFamily: MONO, fontSize: 12 }}>No invites yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {invites.map((inv) => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--ink-2)", border: "1px solid var(--ink-line)", padding: "8px 10px" }}>
              <code style={{ fontFamily: MONO, fontSize: 13, color: "var(--stamp)", letterSpacing: "0.08em" }}>{inv.code}</code>
              <span style={{ fontSize: 9, color: "var(--dim-2)", fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>{inv.kind === "new_household" ? "new household" : "join"}</span>
              {inv.used_by && <span style={{ fontSize: 9, color: "var(--ok)", fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>used</span>}
              <span style={{ flex: 1 }} />
              {!inv.used_by && <button onClick={() => copy(inv.code)} className="cl-ghost-btn" style={{ padding: "6px 10px", fontSize: 10 }}>{copied === inv.code ? "Copied!" : "Copy"}</button>}
              <button onClick={() => remove(inv.id)} style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountMenu({ onClose, onOpenSettings }) {
  const { user, logout } = useAuth();
  return (
    <Sheet onClose={onClose} maxWidth={460}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Avatar user={user} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, textTransform: "uppercase", color: "var(--bone)" }}>
            {user?.name}
            {user?.is_admin && <span style={{ ...badge, marginLeft: 8 }}>ADMIN</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: MONO, letterSpacing: "0.04em", marginTop: 3 }}>{user?.email}</div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 24, color: "var(--dim)", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <button onClick={() => { onClose(); onOpenSettings(); }} className="cl-ghost-btn" style={{ width: "100%", textAlign: "left", padding: "14px 14px" }}>
        Account &amp; settings →
      </button>

      {user?.is_admin && <AdminInvites />}

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--ink-line)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={logout} className="cl-ghost-btn" style={{ color: "var(--stamp)", borderColor: "var(--stamp)" }}>Sign out</button>
      </div>
    </Sheet>
  );
}
