import { useState, useEffect } from "react";
import { C, sans, serif, ghostBtn, primaryBtn } from "./ui.jsx";
import { useAuth } from "./auth.jsx";
import { Sheet, Avatar } from "./components.jsx";
import { listInvites, createInvite, deleteInvite, ensureMyHousehold } from "./data.js";

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
    <div style={{ marginTop: 20, padding: 16, background: C.tint, borderRadius: 14, border: `1px solid ${C.borderSoft}` }}>
      <div style={{ fontFamily: serif, fontSize: 17, color: C.ink, marginBottom: 4 }}>Invites <span style={{ fontSize: 11, background: C.brown, color: "#fff8f0", padding: "2px 7px", borderRadius: 8, letterSpacing: "0.06em", verticalAlign: "middle" }}>ADMIN</span></div>
      <div style={{ fontSize: 12, color: C.muted, fontFamily: sans, marginBottom: 12 }}>Mint a code and share it. Recipients use it to sign up.</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => mint("join_group")} disabled={busy} style={primaryBtn(!busy)}>+ Invite to my household</button>
        <button onClick={() => mint("new_household")} disabled={busy} style={ghostBtn}>+ New household invite</button>
      </div>
      {invites === null ? <div style={{ color: C.muted, fontFamily: sans, fontSize: 13 }}>Loading…</div> : invites.length === 0 ? (
        <div style={{ color: C.faint, fontFamily: sans, fontSize: 13 }}>No invites yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {invites.map((inv) => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px" }}>
              <code style={{ fontFamily: "monospace", fontSize: 14, color: C.ink, letterSpacing: "0.04em" }}>{inv.code}</code>
              <span style={{ fontSize: 10, color: C.faint, fontFamily: sans }}>{inv.kind === "new_household" ? "new household" : "join"}</span>
              {inv.used_by && <span style={{ fontSize: 10, color: "#4a7a50", fontFamily: sans }}>used</span>}
              <span style={{ flex: 1 }} />
              {!inv.used_by && <button onClick={() => copy(inv.code)} style={{ ...ghostBtn, padding: "5px 10px", fontSize: 12 }}>{copied === inv.code ? "Copied!" : "Copy"}</button>}
              <button onClick={() => remove(inv.id)} style={{ background: "none", border: "none", color: "#b89880", cursor: "pointer", fontSize: 16 }}>×</button>
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
          <div style={{ fontFamily: serif, fontSize: 20, color: C.ink, fontWeight: 700 }}>
            {user?.name}
            {user?.is_admin && <span style={{ fontSize: 10, background: C.brown, color: "#fff8f0", padding: "2px 7px", borderRadius: 8, letterSpacing: "0.06em", marginLeft: 8, verticalAlign: "middle" }}>ADMIN</span>}
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: sans }}>{user?.email}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 26, color: C.muted, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <button onClick={() => { onClose(); onOpenSettings(); }} style={{ ...ghostBtn, width: "100%", textAlign: "left", padding: "12px 14px" }}>
        ⚙ Account &amp; settings
      </button>

      {user?.is_admin && <AdminInvites />}

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #ecddd0", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={logout} style={{ ...ghostBtn, color: "#b07060", borderColor: "#e0c0b0" }}>Sign out</button>
      </div>
    </Sheet>
  );
}
