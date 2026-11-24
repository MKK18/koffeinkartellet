import { useState, useEffect } from "react";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { Sheet, Avatar, Icon, Spinner } from "./components.jsx";
import { listInvites, createInvite, deleteInvite, ensureMyHousehold } from "./data.js";
import { firstName } from "./marks.js";

function AdminInvites() {
  const [invites, setInvites] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [err, setErr] = useState("");
  const load = () => listInvites().then(setInvites).catch(() => setInvites([]));
  useEffect(() => { load(); }, []);

  const mint = async (kind) => {
    setBusy(true); setErr("");
    try {
      const group = kind === "join_group" ? (await ensureMyHousehold()).group?.id : null;
      await createInvite({ kind, group });
      await load();
    } catch { setErr("Couldn't create an invite. Try again."); }
    finally { setBusy(false); }
  };
  const copy = (code) => { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(""), 1500); };
  const [confirming, setConfirming] = useState(null);
  const remove = async (id) => { setConfirming(null); await deleteInvite(id).catch(() => {}); await load(); };

  return (
    <section style={{ marginTop: 22 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>Invites</h3>
      <p className="hint" style={{ margin: "0 0 12px" }}>Make a code and send it to a friend. They use it to join.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="button" onClick={() => mint("join_group")} disabled={busy} className="btn btn-primary"><Icon name="plus" />Invite to my household</button>
        <button type="button" onClick={() => mint("new_household")} disabled={busy} className="btn btn-line">New household</button>
      </div>
      {err && <div className="slip" role="alert" style={{ marginBottom: 12 }}><Icon name="alert" /><div>{err}</div></div>}
      {invites === null ? <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--ink-2)" }}><Spinner />Loading invites…</div>
        : invites.length === 0 ? <p className="hint" style={{ margin: 0 }}>No invites yet.</p> : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {invites.map((inv) => (
              <li key={inv.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--rule-2)", flexWrap: "wrap" }}>
                <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 15, fontWeight: 700, color: "var(--table)" }}>{inv.code}</code>
                <span style={{ fontSize: 14, color: "var(--ink-2)" }}>
                  {inv.kind === "new_household" ? "New household" : "Joins your household"}{inv.used_by ? ` · used${inv.expand?.used_by ? ` by ${firstName(inv.expand.used_by)}` : ""}` : ""}
                </span>
                <span style={{ flex: 1 }} />
                {!inv.used_by && <button type="button" onClick={() => copy(inv.code)} className="btn btn-quiet">{copied === inv.code ? "Copied" : "Copy"}</button>}
                {confirming === inv.id
                  ? <><button type="button" className="btn btn-quiet" onClick={() => setConfirming(null)}>Keep</button><button type="button" className="btn btn-line" onClick={() => remove(inv.id)}>Delete code</button></>
                  : <button type="button" className="iconbtn" onClick={() => setConfirming(inv.id)} aria-label={`Delete invite ${inv.code}`}><Icon name="trash" /></button>}
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

export default function AccountMenu({ onClose, onOpenSettings }) {
  const { user, logout } = useAuth();
  const { crew } = useNav();
  const others = (crew?.members || []).filter((m) => m.id !== user?.id);
  return (
    <Sheet title="You and your crew" onClose={onClose} maxWidth={480}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 0 16px" }}>
        <Avatar user={user} size={52} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</div>
          <div style={{ fontSize: 14, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
        </div>
      </div>

      <p style={{ margin: "0 0 14px", fontSize: 15, color: "var(--ink-2)" }}>
        {others.length ? <>At the table with {others.map((o) => o.name).join(", ").replace(/, ([^,]*)$/, " and $1")}.</> : "It's just you at the table for now."}
      </p>

      <button type="button" onClick={() => { onClose(); onOpenSettings(); }} className="btn btn-line btn-block" style={{ justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}><Icon name="settings" />Account and settings</span><Icon name="arrow" />
      </button>

      {user?.is_admin && <AdminInvites />}

      <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={logout} className="btn btn-quiet"><Icon name="out" />Sign out</button>
      </div>
    </Sheet>
  );
}
