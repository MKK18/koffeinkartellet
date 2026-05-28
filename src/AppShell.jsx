import { useState, useCallback, useMemo } from "react";
import { C, sans, serif, FontLink } from "./ui.jsx";
import { useAuth } from "./auth.jsx";
import { NavProvider } from "./nav.jsx";
import { Sheet, Avatar } from "./components.jsx";
import Catalog from "./Catalog.jsx";
import Feed from "./Feed.jsx";
import Profile from "./Profile.jsx";
import CoffeeDetail from "./CoffeeDetail.jsx";
import CoffeeForm from "./CoffeeForm.jsx";
import SettingsModal from "./SettingsModal.jsx";
import AccountMenu from "./AccountMenu.jsx";
import InstallPrompt from "./InstallPrompt.jsx";
import BuyVerdict from "./BuyVerdict.jsx";

const TABS = [
  { id: "catalog", label: "Catalog", icon: "☕" },
  { id: "feed", label: "Feed", icon: "📋" },
  { id: "taste", label: "Taste", icon: "👅" },
];

export default function AppShell() {
  const { user } = useAuth();
  const [tab, setTab] = useState("catalog");
  const [coffeeView, setCoffeeView] = useState(null);
  const [form, setForm] = useState(null);        // { mode: 'add'|'edit', coffee }
  const [profileId, setProfileId] = useState(null);
  const [settings, setSettings] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const bumpData = useCallback(() => setDataVersion((v) => v + 1), []);

  const nav = useMemo(() => ({
    dataVersion,
    bumpData,
    openCoffee: (c) => { setProfileId(null); setCoffeeView(c); },
    addCoffee: () => setForm({ mode: "add" }),
    openBuyVerdict: () => setVerdictOpen(true),
    editCoffee: (c) => { setCoffeeView(null); setForm({ mode: "edit", coffee: c }); },
    openProfile: (id) => { setCoffeeView(null); setProfileId(id); },
    openSettings: () => setSettings(true),
  }), [dataVersion, bumpData]);

  const Screen = tab === "catalog" ? <Catalog /> : tab === "feed" ? <Feed /> : <Profile />;
  const title = tab === "catalog" ? "The catalog" : tab === "feed" ? "Feed" : "Taste";

  return (
    <NavProvider value={nav}>
      <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>
        <FontLink />

        {/* Header — light, airy (Coffi-inspired) */}
        <div style={{ background: C.bg, padding: "18px 18px 14px", position: "sticky", top: 0, zIndex: 10, borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint, fontFamily: sans }}>☕ Koffeinkartellet</div>
              <h1 style={{ margin: "2px 0 0", fontFamily: serif, fontSize: 24, color: C.ink, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{title}</h1>
            </div>
            <Avatar user={user} size={36} onClick={() => setAccountOpen(true)} />
          </div>
        </div>

        {/* Active screen */}
        <div key={tab}>{Screen}</div>

        {/* Floating add button (hidden on the Taste tab) */}
        {tab !== "taste" && (
          <button onClick={() => nav.addCoffee()} aria-label="Add coffee" style={{
            position: "fixed", right: 18, bottom: "calc(84px + env(safe-area-inset-bottom))", zIndex: 30,
            width: 58, height: 58, borderRadius: "50%", border: "none", background: C.brown, color: "#fff8f0",
            fontSize: 30, lineHeight: 1, cursor: "pointer", boxShadow: "0 6px 20px rgba(80,40,10,0.35)",
          }}>+</button>
        )}

        {/* Bottom tab bar (mobile-first) */}
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          background: C.card, borderTop: `1px solid ${C.border}`,
          paddingBottom: "env(safe-area-inset-bottom)",
          display: "flex", justifyContent: "space-around",
        }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                padding: "10px 4px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                color: active ? C.brown : C.faint, fontFamily: sans,
              }}>
                <span style={{ fontSize: 20, opacity: active ? 1 : 0.6 }}>{t.icon}</span>
                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Overlays */}
        {profileId && (
          <Sheet onClose={() => setProfileId(null)}>
            <Profile userId={profileId} onClose={() => setProfileId(null)} />
          </Sheet>
        )}
        {coffeeView && (
          <CoffeeDetail
            coffee={coffeeView}
            onClose={() => setCoffeeView(null)}
            onEdit={() => nav.editCoffee(coffeeView)}
          />
        )}
        {form && (
          <CoffeeForm
            coffee={form.mode === "edit" ? form.coffee : null}
            onClose={() => setForm(null)}
            onSaved={(saved) => { setForm(null); bumpData(); setCoffeeView(saved); }}
            onOpenExisting={(c) => { setForm(null); setCoffeeView(c); }}
            onOpenSettings={() => { setForm(null); setSettings(true); }}
          />
        )}
        {settings && <SettingsModal onClose={() => setSettings(false)} />}
        {accountOpen && <AccountMenu onClose={() => setAccountOpen(false)} onOpenSettings={() => setSettings(true)} />}
        {verdictOpen && <BuyVerdict onClose={() => setVerdictOpen(false)} />}
        <InstallPrompt />
      </div>
    </NavProvider>
  );
}
