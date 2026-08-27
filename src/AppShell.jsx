import { useState, useCallback, useMemo } from "react";
import { FontLink } from "./ui.jsx";
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
  { id: "catalog", label: "Catalog" },
  { id: "feed", label: "Feed" },
  { id: "taste", label: "Taste" },
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
  const title = tab === "catalog" ? "The catalog" : tab === "feed" ? "The feed" : "Your palate";

  return (
    <NavProvider value={nav}>
      <div className="cl" style={{ minHeight: "100vh", paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>
        <FontLink />

        {/* Masthead — ink, letterpress hairline */}
        <div style={{ background: "rgba(16,13,10,.9)", backdropFilter: "blur(6px)", padding: "14px 18px", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid var(--ink-line)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, color: "var(--bone)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1 }}>{title}</h1>
            </div>
            <Avatar user={user} size={38} onClick={() => setAccountOpen(true)} />
          </div>
        </div>

        {/* Active screen */}
        <div key={tab}>{Screen}</div>

        {/* Floating add — a stamp, not a round FAB */}
        {tab !== "taste" && (
          <button onClick={() => nav.addCoffee()} aria-label="Add coffee" style={{
            position: "fixed", right: 18, bottom: "calc(84px + env(safe-area-inset-bottom))", zIndex: 30,
            width: 58, height: 58, border: "none", background: "var(--stamp)", color: "#fff",
            fontFamily: "var(--font-display)", fontSize: 34, lineHeight: 1, cursor: "pointer",
            boxShadow: "0 14px 30px -12px rgba(0,0,0,.85)", transform: "rotate(-2deg)",
          }}>+</button>
        )}

        {/* Bottom tab bar — mono small caps, stamp underline on active */}
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          background: "rgba(16,13,10,.92)", backdropFilter: "blur(8px)", borderTop: "1px solid var(--ink-line)",
          paddingBottom: "env(safe-area-inset-bottom)", display: "flex", justifyContent: "space-around",
        }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                padding: "16px 4px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                fontFamily: "var(--font-mono)",
              }}>
                <span style={{
                  fontSize: 11, fontWeight: active ? 600 : 500,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: active ? "var(--bone)" : "var(--dim-2)",
                }}>{t.label}</span>
                <span style={{ width: 18, height: 2, background: active ? "var(--stamp)" : "transparent" }} />
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
