import { useState, useRef, useEffect } from "react";
import { Sheet, SectionHead, Spinner, Combobox, MultiCombobox, FlavorPicker } from "./components.jsx";
import { PROCESSES, ROAST_LEVELS, VARIETALS, FLAVOR_TAGS, COFFEE_COUNTRIES, compressImage, extractBeanFromImage, extractBeanFromUrl, fetchExternalImage, scrapePageImage } from "./lib.js";
import { createCoffee, updateCoffee, deleteCoffee, searchCoffeesByName, coffeeImageUrl } from "./data.js";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";

// Dark input style object — passed to the comboboxes (which take a `style` prop);
// mirrors the .cl-input class used elsewhere.
const INPUT = { width: "100%", background: "var(--ink-2)", border: "1px solid var(--ink-line)", color: "var(--bone)", fontFamily: MONO, fontSize: 14, padding: "14px 15px", outline: "none", boxSizing: "border-box" };

const Cam = ({ s = 30 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="var(--stamp)" strokeWidth="1.4"><rect x="3" y="6" width="18" height="14" rx="1" /><path d="M3 10h18" /><circle cx="12" cy="14" r="3.2" /><path d="M8 6l1.5-2h5L16 6" /></svg>);

const EMPTY = {
  name: "", roaster: "", origin: [], region: "", producer: "", varietal: [],
  process: "", roastLevel: "", altitude: "", harvest: "", importer: "", tags: [], notes: "",
};

const toArr = (v) => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  return [];
};

function Field({ label, value, onChange, placeholder, type, full }) {
  return (
    <div style={full ? { gridColumn: "1/-1" } : {}}>
      <span className="cl-label">{label}</span>
      <input type={type || "text"} className="cl-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || ""} />
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <div>
      <span className="cl-label">{label}</span>
      <select className="cl-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

const TABS = [
  { id: "photo", label: "Photo" },
  { id: "link", label: "Link" },
  { id: "manual", label: "Manual" },
];

export default function CoffeeForm({ coffee, onClose, onSaved, onOpenExisting }) {
  const editing = !!coffee?.id;
  const { user } = useAuth();
  const { bumpData } = useNav();
  const canDelete = editing && (user?.is_admin || coffee?.added_by === user?.id);
  const [tab, setTab] = useState(editing ? "manual" : "photo");
  const [form, setForm] = useState(() =>
    coffee ? {
      name: coffee.name || "", roaster: coffee.roaster || "", origin: toArr(coffee.origin),
      region: coffee.region || "", producer: coffee.producer || "", varietal: toArr(coffee.varietal),
      process: coffee.process || "", roastLevel: coffee.roast_level || "", altitude: coffee.altitude || "",
      harvest: coffee.harvest || "", importer: coffee.importer || "", tags: coffee.tags || [], notes: coffee.bag_notes || "",
    } : { ...EMPTY }
  );
  const [imageBlob, setImageBlob] = useState(null);
  const [preview, setPreview] = useState(editing ? coffeeImageUrl(coffee, "300x300") : "");
  const [dupes, setDupes] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [url, setUrl] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlMsg, setUrlMsg] = useState("");
  const [filledFrom, setFilledFrom] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const uploadRef = useRef();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const applyExtracted = (x) => setForm((f) => {
    const origins = toArr(x.origin);
    const varietals = toArr(x.varietal);
    return {
      ...f,
      name: x.name || f.name, roaster: x.roaster || f.roaster,
      origin: origins.length ? origins : f.origin,
      region: x.region || f.region, producer: x.producer || f.producer,
      varietal: varietals.length ? varietals : f.varietal,
      process: x.process || f.process,
      roastLevel: x.roastLevel || f.roastLevel,
      altitude: x.altitude || f.altitude, harvest: x.harvest || f.harvest, importer: x.importer || f.importer,
      tags: x.tags?.filter((t) => FLAVOR_TAGS.includes(t))?.length ? x.tags.filter((t) => FLAVOR_TAGS.includes(t)) : f.tags,
      notes: x.notes || f.notes,
    };
  });

  useEffect(() => {
    if (editing) return;
    const name = form.name.trim();
    if (name.length < 2) { setDupes([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try { const found = await searchCoffeesByName(name); if (!cancelled) setDupes(found); } catch { /* ignore */ }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [form.name, editing]);

  const handleImageFile = async (file, { scan = true } = {}) => {
    if (!file || !file.type.startsWith("image/")) return;
    setError(""); setScanMsg("");
    try {
      const { blob, base64 } = await compressImage(file);
      setImageBlob(blob);
      setPreview(URL.createObjectURL(blob));
      if (!scan) return;
      setScanning(true);
      try {
        const x = await extractBeanFromImage(base64);
        applyExtracted(x);
        setFilledFrom("photo");
        setTab("manual");
      } catch (err) {
        setScanMsg(err?.message === "NO_API_KEY"
          ? "Add an API key in Settings to enable photo scanning."
          : err?.message?.includes("content filter")
            ? "The AI couldn't read that photo — try a clearer, well-lit shot of the bag."
            : "Couldn't read the photo — try again or switch to Manual.");
      } finally {
        setScanning(false);
      }
    } catch {
      setError("That image couldn't be processed.");
    }
  };

  const [clearExistingImage, setClearExistingImage] = useState(false);
  const removeImage = () => {
    setImageBlob(null); setPreview("");
    if (editing && coffee?.image) setClearExistingImage(true);
  };

  const fetchFromUrl = async () => {
    const link = url.trim();
    if (!link) return;
    setFetchingUrl(true); setUrlMsg(""); setError("");
    try {
      const x = await extractBeanFromUrl(link);
      applyExtracted(x);
      setFilledFrom("link");
      setTab("manual");
      if (!imageBlob && !preview) {
        const tryImage = async (candidate) => {
          if (!candidate) return null;
          return await fetchExternalImage(candidate);
        };
        try {
          let blob = await tryImage(x.image_url);
          if (!blob) {
            const scraped = await scrapePageImage(link);
            if (scraped && scraped !== x.image_url) blob = await tryImage(scraped);
          }
          if (blob) {
            const file = new File([blob], "from-link.jpg", { type: blob.type || "image/jpeg" });
            const { blob: compressed } = await compressImage(file);
            setImageBlob(compressed);
            setPreview(URL.createObjectURL(compressed));
          }
        } catch { /* image-grab non-fatal */ }
      }
    } catch (err) {
      setUrlMsg(err?.message === "NO_API_KEY"
        ? "Add an API key in Settings to import from a link."
        : "Couldn't read that page — try the photo, or switch to Manual.");
    } finally {
      setFetchingUrl(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm(`Delete "${coffee.name}"? This removes it and all its tastings from everyone's catalog.`)) return;
    setDeleting(true); setError("");
    try {
      await deleteCoffee(coffee.id);
      bumpData();
      onClose();
    } catch (err) {
      setError(err?.message?.includes("403") ? "You don't have permission to delete this coffee." : (err?.message || "Couldn't delete."));
      setDeleting(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Give the coffee a name."); setTab("manual"); return; }
    setSaving(true); setError("");
    try {
      const fields = {
        ...form,
        origin: Array.isArray(form.origin) ? form.origin.join(", ") : form.origin,
        varietal: Array.isArray(form.varietal) ? form.varietal.join(", ") : form.varietal,
        _clearImage: clearExistingImage && !imageBlob,
      };
      const saved = editing ? await updateCoffee(coffee.id, fields, imageBlob) : await createCoffee(fields, imageBlob);
      onSaved(saved);
    } catch (err) {
      setError(err?.message || "Couldn't save. Try again."); setSaving(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 26, fontWeight: 400, textTransform: "uppercase", color: "var(--bone)" }}>{editing ? "Edit coffee" : "Add a coffee"}</h2>
        <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 24, color: "var(--dim)", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: "flex", gap: 4, border: "1px solid var(--ink-line)", padding: 4, marginBottom: 18 }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 4px", border: "none", cursor: "pointer", fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", background: active ? "var(--stamp)" : "transparent", color: active ? "#fff" : "var(--dim)" }}>{t.label}</button>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handleImageFile(e.target.files[0])} />

      {tab === "photo" && (
        preview ? (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <img src={preview} alt="package" style={{ width: 96, height: 96, objectFit: "cover", border: "1px solid var(--ink-line)" }} />
            <div style={{ flex: 1, fontFamily: MONO, fontSize: 12, letterSpacing: "0.03em" }}>
              {scanning && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--stamp)" }}><Spinner /> Scanning &amp; searching the web…</div>}
              {!scanning && scanMsg && <div style={{ color: "#f0b7a6" }}>{scanMsg}</div>}
              {!scanning && !scanMsg && <div style={{ color: "var(--ok)" }}>Photo attached.</div>}
              {!scanning && <button onClick={() => fileRef.current?.click()} className="cl-ghost-btn" style={{ marginTop: 10, padding: "8px 14px" }}>Replace photo</button>}
            </div>
          </div>
        ) : (
          <div onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            style={{ border: "1px dashed var(--ink-line)", padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "var(--ink)" }}>
            <div style={{ marginBottom: 12 }}><Cam /></div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, textTransform: "uppercase", color: "var(--bone)", marginBottom: 6 }}>Take or upload a package photo</div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.04em", color: "var(--dim)" }}>AI scans it, fills the details, drops you on Manual to review.</div>
          </div>
        )
      )}

      {tab === "link" && (
        <div>
          <span className="cl-label">Roaster product link</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchFromUrl(); } }}
              placeholder="https://roaster.com/shop/that-coffee" className="cl-input" style={{ flex: 1 }} />
            <button onClick={fetchFromUrl} disabled={fetchingUrl || !url.trim()} className="cl-stamp-btn" style={{ padding: "0 18px", whiteSpace: "nowrap" }}>
              {fetchingUrl ? <Spinner /> : "Fetch"}
            </button>
          </div>
          {urlMsg ? (
            <div style={{ marginTop: 10, fontSize: 12, fontFamily: MONO, color: "#f0b7a6" }}>{urlMsg}</div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 11, fontFamily: MONO, letterSpacing: "0.03em", color: "var(--dim)" }}>Paste a roaster's product page. AI reads it, fills the details, drops you on Manual to review.</div>
          )}
        </div>
      )}

      {tab === "manual" && (
        <>
          {filledFrom && (
            <div style={{ background: "rgba(127,174,106,.12)", border: "1px solid var(--ok)", padding: "10px 12px", marginBottom: 14, fontFamily: MONO, fontSize: 11, letterSpacing: "0.04em", color: "var(--ok)" }}>
              ✓ Filled in from the {filledFrom === "photo" ? "photo" : "link"} — check &amp; adjust below.
            </div>
          )}

          <SectionHead title="Photo" />
          <input ref={uploadRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageFile(e.target.files[0], { scan: false })} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
            {preview ? (
              <img src={preview} alt="package" style={{ width: 72, height: 72, objectFit: "cover", border: "1px solid var(--ink-line)" }} />
            ) : (
              <div style={{ width: 72, height: 72, background: "var(--ink)", border: "1px dashed var(--ink-line)", display: "flex", alignItems: "center", justifyContent: "center" }}><Cam s={24} /></div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => uploadRef.current?.click()} className="cl-ghost-btn" style={{ padding: "9px 14px" }}>{preview ? "Replace photo" : "Upload photo"}</button>
              {preview && <button onClick={removeImage} className="cl-ghost-btn" style={{ padding: "9px 14px", color: "var(--stamp)", borderColor: "var(--stamp)" }}>Remove</button>}
            </div>
          </div>

          <SectionHead title="Basics" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Coffee name *" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Yirgacheffe Kochere" full />
            {!editing && dupes.length > 0 && (
              <div style={{ gridColumn: "1/-1", background: "var(--ink)", border: "1px solid var(--ink-line)", padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Already in the catalog?</div>
                {dupes.map((d) => (
                  <button key={d.id} onClick={() => onOpenExisting?.(d)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "6px 0", cursor: "pointer", fontFamily: MONO, fontSize: 12, color: "var(--stamp)" }}>
                    ↳ {d.name}{d.roaster ? ` · ${d.roaster}` : ""}
                  </button>
                ))}
              </div>
            )}
            <Field label="Roaster" value={form.roaster} onChange={(v) => set("roaster", v)} placeholder="e.g. DAK Coffee Roasters" full />
          </div>

          <SectionHead title="Origin & provenance" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span className="cl-label">Country</span>
              <MultiCombobox values={form.origin} onChange={(v) => set("origin", v)} options={COFFEE_COUNTRIES} placeholder="e.g. Ethiopia (add more for blends)" style={INPUT} />
            </div>
            <Field label="Region" value={form.region} onChange={(v) => set("region", v)} placeholder="e.g. Yirgacheffe" />
            <Field label="Producer / farm" value={form.producer} onChange={(v) => set("producer", v)} placeholder="e.g. Daye Bensa" />
            <Field label="Importer" value={form.importer} onChange={(v) => set("importer", v)} placeholder="optional" />
          </div>

          <SectionHead title="Bean details" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span className="cl-label">Varietal</span>
              <MultiCombobox values={form.varietal} onChange={(v) => set("varietal", v)} options={VARIETALS} placeholder="e.g. Gesha, Udaini, Pink Bourbon" style={INPUT} />
            </div>
            <div>
              <span className="cl-label">Process</span>
              <Combobox value={form.process} onChange={(v) => set("process", v)} options={PROCESSES} placeholder="e.g. Lactic Anaerobic" style={INPUT} />
            </div>
            <div>
              <span className="cl-label">Roast level</span>
              <Combobox value={form.roastLevel} onChange={(v) => set("roastLevel", v)} options={ROAST_LEVELS} placeholder="Light / Medium / Dark" style={INPUT} />
            </div>
            <Field label="Altitude (masl)" value={form.altitude} onChange={(v) => set("altitude", v)} placeholder="e.g. 1900–2200" />
            <Field label="Harvest" value={form.harvest} onChange={(v) => set("harvest", v)} placeholder="e.g. Nov 2024" full />
          </div>

          <SectionHead title="Flavour notes" />
          <FlavorPicker value={form.tags} onChange={(v) => set("tags", v)} />

          <SectionHead title="From the bag" />
          <textarea className="cl-input" style={{ minHeight: 70, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Roaster's tasting notes, origin story…" />
        </>
      )}

      {error && <div style={{ background: "rgba(226,67,29,.12)", border: "1px solid var(--stamp)", color: "#f0b7a6", padding: "10px 12px", fontSize: 12, fontFamily: MONO, marginTop: 16 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--ink-line)" }}>
        {canDelete && (
          <button onClick={remove} disabled={deleting} className="cl-ghost-btn" style={{ color: "var(--stamp)", borderColor: "var(--stamp)", marginRight: "auto" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
        {tab !== "manual" && !canDelete && <span style={{ flex: 1, fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dim-2)" }}>or fill it in on Manual →</span>}
        <button onClick={onClose} className="cl-ghost-btn">Cancel</button>
        <button onClick={save} disabled={saving || scanning || deleting} className="cl-stamp-btn">
          {saving ? "Saving…" : editing ? "Save changes" : "Add to catalog"}
        </button>
      </div>
    </Sheet>
  );
}
