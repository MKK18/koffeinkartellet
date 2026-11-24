import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAuth } from "./auth.jsx";
import { NavProvider } from "./nav.jsx";
import { Sheet, Avatar, Icon, Toast } from "./components.jsx";
import Timeline from "./Feed.jsx";
import Catalog from "./Catalog.jsx";
import Profile from "./Profile.jsx";
import CoffeeDetail from "./CoffeeDetail.jsx";
import CoffeeForm from "./CoffeeForm.jsx";
import SettingsModal from "./SettingsModal.jsx";
import AccountMenu from "./AccountMenu.jsx";
import InstallPrompt from "./InstallPrompt.jsx";
import BuyVerdict from "./BuyVerdict.jsx";
import { getCrew, countCoffees } from "./data.js";

const TABS = [
  { id: "table", label: "Table", icon: "table" },
  { id: "coffees", label: "Coffees", icon: "coffees" },
  { id: "palate", label: "Palate", icon: "palate" },
  { id: "you", label: "You", icon: "you" },
];

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export default function AppShell() {
  const { user } = useAuth();
  const [tab, setTab] = useState("table");
  const [coffeeView, setCoffeeView] = useState(null);
  const [form, setForm] = useState(null);        // { mode: 'add'|'edit', coffee }
  const [profileId, setProfileId] = useState(null);
  const [settings, setSettings] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scan, setScan] = useState(null);         // { file } | { mode: 'link' }
  const [dataVersion, setDataVersion] = useState(0);
  const [crew, setCrew] = useState(null);
  const [coffeeCount, setCoffeeCount] = useState(null);
  const [toast, setToast] = useState(null);
  const camRef = useRef();

  const bumpData = useCallback(() => setDataVersion((v) => v + 1), []);
  // A toast may carry a deferred action (e.g. a delete that waits for Undo);
  // a newer toast must not swallow it, so settle the old one first.
  const pendingRef = useRef(null);
  const showToast = useCallback((text, opts = {}) => {
    pendingRef.current?.();
    pendingRef.current = opts.onExpire || null;
    setToast({ text, key: Date.now(), ...opts });
  }, []);
  const endToast = (fire) => { if (fire) pendingRef.current?.(); pendingRef.current = null; setToast(null); };

  useEffect(() => {
    getCrew().then(setCrew).catch(() => setCrew({ members: user ? [user] : [], ids: user ? [user.id] : [] }));
    countCoffees().then(setCoffeeCount).catch(() => {});
  }, [dataVersion, user]);

  const openScan = useCallback(() => camRef.current?.click(), []);

  const nav = useMemo(() => ({
    dataVersion,
    bumpData,
    crew,
    toast: showToast,
    openCoffee: (c) => { setProfileId(null); setCoffeeView(c); },
    addCoffee: () => setForm({ mode: "add" }),
    openBuyVerdict: () => setScan({ mode: "link" }),
    openScan,
    editCoffee: (c) => { setCoffeeView(null); setForm({ mode: "edit", coffee: c }); },
    openProfile: (id) => { setCoffeeView(null); if (id === user?.id) { setTab("you"); setProfileId(null); } else setProfileId(id); },
    openSettings: () => setSettings(true),
    goTab: setTab,
  }), [dataVersion, bumpData, crew, showToast, openScan, user]);

  const members = crew?.members || (user ? [user] : []);
  const cuppers = members.length;
  const head = {
    table: { title: "The table", sub: coffeeCount == null ? "" : `${plural(cuppers, "cupper", "cuppers")} · ${plural(coffeeCount, "coffee", "coffees")}` },
    coffees: { title: "Coffees", sub: coffeeCount == null ? "" : `${plural(coffeeCount, "coffee", "coffees")} on the table` },
    palate: { title: "Palate", sub: cuppers > 1 ? "What the crew likes, and where you differ" : "What you like, so far" },
    you: { title: user?.name || "You", sub: user?.bio || "Your tastings and favourites" },
  }[tab];

  const Screen = tab === "table" ? <Timeline /> : tab === "coffees" ? <Catalog /> : tab === "palate" ? <Profile view="crew" /> : <Profile view="me" />;

  const crewButton = (
    <button type="button" className="ct-crew" onClick={() => setAccountOpen(true)} aria-label="Account, settings and invites">
      {members.slice(0, 5).map((m) => <Avatar key={m.id} user={m} size={32} />)}
    </button>
  );

  return (
    <NavProvider value={nav}>
      <div className="ct ct-shell">
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setScan({ file: f }); }} />

        {/* Desktop rail — the same four places plus Scan, on the table */}
        <nav className="ct-rail" aria-label="Main">
          <div className="ct-word">Koffeinkartellet</div>
          {TABS.map((t) => (
            <button key={t.id} type="button" className="ct-railbtn" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} />{t.label}
            </button>
          ))}
          <button type="button" className="ct-railscan" onClick={openScan}><Icon name="camera" />Scan a bag</button>
          <button type="button" className="ct-railbtn" style={{ marginTop: 6 }} onClick={() => setForm({ mode: "add" })}><Icon name="plus" />Add a coffee</button>
        </nav>

        <div className="ct-main">
          <header className="ct-head">
            <div className="ct-head-top">
              <div className="ct-word ct-word-head">Koffeinkartellet</div>
              {crewButton}
            </div>
            <h1 className="ct-title">{head.title}</h1>
            {head.sub && <p className="ct-sub">{head.sub}</p>}
          </header>

          <main className="ct-sheet" key={tab}>{Screen}</main>
        </div>

        {/* Phone tab bar — Scan sits in the thumb's reach, centred */}
        <nav className="ct-tabs" aria-label="Main">
          {TABS.slice(0, 2).map((t) => (
            <button key={t.id} type="button" className="ct-tab" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} />{t.label}
            </button>
          ))}
          <button type="button" className="ct-scan" onClick={openScan} aria-label="Scan a bag: should I buy it?">
            <Icon name="camera" /><span>Scan</span>
          </button>
          {TABS.slice(2).map((t) => (
            <button key={t.id} type="button" className="ct-tab" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} />{t.label}
            </button>
          ))}
        </nav>

        {/* Overlays */}
        {profileId && (
          <Sheet onClose={() => setProfileId(null)} title={members.find((m) => m.id === profileId)?.name || "Profile"}>
            <Profile view="person" userId={profileId} />
          </Sheet>
        )}
        {coffeeView && (
          <CoffeeDetail coffee={coffeeView} onClose={() => setCoffeeView(null)} onEdit={() => nav.editCoffee(coffeeView)} />
        )}
        {form && (
          <CoffeeForm
            coffee={form.mode === "edit" ? form.coffee : null}
            onClose={() => setForm(null)}
            onSaved={(saved) => { setForm(null); bumpData(); setCoffeeView(saved); showToast(form.mode === "edit" ? "Coffee updated" : "Coffee added to the table"); }}
            onOpenExisting={(c) => { setForm(null); setCoffeeView(c); }}
            onOpenSettings={() => { setForm(null); setSettings(true); }}
          />
        )}
        {settings && <SettingsModal onClose={() => setSettings(false)} />}
        {accountOpen && <AccountMenu onClose={() => setAccountOpen(false)} onOpenSettings={() => setSettings(true)} />}
        {scan && <BuyVerdict file={scan.file} startWithLink={scan.mode === "link"} onClose={() => setScan(null)} onRetake={openScan} />}
        {toast && (
          <Toast key={toast.key} action={toast.action} onAction={() => { toast.onAction?.(); endToast(false); }} onDone={() => endToast(true)}>
            {toast.text}
          </Toast>
        )}
        <InstallPrompt />
      </div>
    </NavProvider>
  );
}
