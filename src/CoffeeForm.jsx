import { useState, useRef, useEffect } from "react";
import { C, sans, serif, inputStyle, labelStyle, primaryBtn, ghostBtn } from "./ui.jsx";
import { Sheet, SectionHead, Spinner, CountryCombobox, FlavorPicker, ScaleSlider } from "./components.jsx";
import { PROCESSES, ROAST_LEVELS, VARIETALS, FLAVOR_TAGS, compressImage, extractBeanFromImage, extractBeanFromUrl, fetchExternalImage } from "./lib.js";
import { createCoffee, updateCoffee, searchCoffeesByName, coffeeImageUrl } from "./data.js";

const EMPTY = {
  name: "", roaster: "", origin: "", region: "", producer: "", varietal: "",
  process: "", roastLevel: "", altitude: "", harvest: "", importer: "", tags: [], notes: "",
  acidity: 0, body: 0, sweetness: 0,
};

// Stable, module-level field components (defining these inside the form would
// remount them every keystroke and drop focus).
function Field({ label, value, onChange, placeholder, type, full }) {
  return (
    <div style={full ? { gridColumn: "1/-1" } : {}}>
      <label style={labelStyle}>{label}</label>
      <input type={type || "text"} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || ""} />
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

const TABS = [
  { id: "photo", label: "📷 Photo" },
  { id: "link", label: "🔗 Link" },
  { id: "manual", label: "✎ Manual" },
];

// coffee: existing record to edit, or null to add new.
export default function CoffeeForm({ coffee, onClose, onSaved, onOpenExisting }) {
  const editing = !!coffee?.id;
  const [tab, setTab] = useState(editing ? "manual" : "photo");
  const [form, setForm] = useState(() =>
    coffee ? {
      name: coffee.name || "", roaster: coffee.roaster || "", origin: coffee.origin || "",
      region: coffee.region || "", producer: coffee.producer || "", varietal: coffee.varietal || "",
      process: coffee.process || "", roastLevel: coffee.roast_level || "", altitude: coffee.altitude || "",
      harvest: coffee.harvest || "", importer: coffee.importer || "", tags: coffee.tags || [], notes: coffee.bag_notes || "",
      acidity: coffee.acidity || 0, body: coffee.body || 0, sweetness: coffee.sweetness || 0,
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
  const [filledFrom, setFilledFrom] = useState("");   // "photo" | "link" — shown on Manual tab
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();        // Photo-tab dropzone (scans on select)
  const uploadRef = useRef();      // Manual-tab upload (no scan)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const applyExtracted = (x) => setForm((f) => ({
    ...f,
    name: x.name || f.name, roaster: x.roaster || f.roaster, origin: x.origin || f.origin,
    region: x.region || f.region, producer: x.producer || f.producer,
    varietal: VARIETALS.includes(x.varietal) ? x.varietal : f.varietal,
    process: PROCESSES.includes(x.process) ? x.process : f.process,
    roastLevel: ROAST_LEVELS.includes(x.roastLevel) ? x.roastLevel : f.roastLevel,
    altitude: x.altitude || f.altitude, harvest: x.harvest || f.harvest, importer: x.importer || f.importer,
    tags: x.tags?.filter((t) => FLAVOR_TAGS.includes(t))?.length ? x.tags.filter((t) => FLAVOR_TAGS.includes(t)) : f.tags,
    notes: x.notes || f.notes,
  }));

  // Dedupe: warn about likely matches as the name is typed (new coffees only).
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

  // scan=true: Photo-tab flow (compress + AI scan + autofill).
  // scan=false: plain attach (Manual upload, no AI).
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
          ? "Add an API key in Settings (or enable the shared one) to enable photo scanning."
          : "Couldn't read the photo — switch to Manual and fill it in.");
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
      // If the page exposed a product image, pull it down and stash as the coffee's photo.
      if (x.image_url && !imageBlob && !preview) {
        try {
          const blob = await fetchExternalImage(x.image_url);
          if (blob) {
            // Re-compress to our standard max-1024 JPEG for consistency.
            const file = new File([blob], "from-link.jpg", { type: blob.type || "image/jpeg" });
            const { blob: compressed } = await compressImage(file);
            setImageBlob(compressed);
            setPreview(URL.createObjectURL(compressed));
          }
        } catch { /* image-grab is best-effort; ignore */ }
      }
    } catch (err) {
      setUrlMsg(err?.message === "NO_API_KEY"
        ? "Add an API key in Settings (or enable the shared one) to import from a link."
        : "Couldn't read that page — try the photo, or switch to Manual.");
    } finally {
      setFetchingUrl(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Give the coffee a name."); setTab("manual"); return; }
    setSaving(true); setError("");
    try {
      const fields = { ...form, _clearImage: clearExistingImage && !imageBlob };
      const saved = editing ? await updateCoffee(coffee.id, fields, imageBlob) : await createCoffee(fields, imageBlob);
      onSaved(saved);
    } catch (err) {
      setError(err?.message || "Couldn't save. Try again."); setSaving(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontFamily: serif, fontSize: 22, color: C.ink }}>{editing ? "Edit coffee" : "Add a coffee"}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 26, color: C.muted, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {/* Tab selector */}
      <div style={{ display: "flex", gap: 6, background: C.tint, border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: 4, marginBottom: 18 }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer",
              fontFamily: sans, fontSize: 13, fontWeight: active ? 600 : 500,
              background: active ? C.card : "transparent", color: active ? C.brown : C.muted,
              boxShadow: active ? "0 1px 4px rgba(100,70,40,0.12)" : "none",
            }}>{t.label}</button>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handleImageFile(e.target.files[0])} />

      {/* ── PHOTO TAB ── */}
      {tab === "photo" && (
        preview ? (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <img src={preview} alt="package" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, border: `1.5px solid ${C.border}` }} />
            <div style={{ flex: 1, fontFamily: sans, fontSize: 13 }}>
              {scanning && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.brown }}><Spinner /> Scanning &amp; searching the web…</div>}
              {!scanning && scanMsg && <div style={{ color: "#a05040" }}>{scanMsg}</div>}
              {!scanning && !scanMsg && <div style={{ color: "#4a7a50" }}>Photo attached.</div>}
              {!scanning && <button onClick={() => fileRef.current?.click()} style={{ ...ghostBtn, marginTop: 8, padding: "7px 14px", fontSize: 12 }}>Replace photo</button>}
            </div>
          </div>
        ) : (
          <div onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            style={{ border: "2px dashed #d4c5b5", borderRadius: 14, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: C.tint }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
            <div style={{ fontFamily: serif, fontSize: 16, color: "#6b4226", marginBottom: 4 }}>Take or upload a package photo</div>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.faint }}>AI scans it, fills the details, and drops you on Manual to review</div>
          </div>
        )
      )}

      {/* ── LINK TAB ── */}
      {tab === "link" && (
        <div>
          <label style={labelStyle}>Roaster product link</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchFromUrl(); } }}
              placeholder="https://roaster.com/shop/that-coffee" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={fetchFromUrl} disabled={fetchingUrl || !url.trim()} style={{ ...primaryBtn(!fetchingUrl && !!url.trim()), padding: "0 18px", whiteSpace: "nowrap" }}>
              {fetchingUrl ? <Spinner /> : "Fetch"}
            </button>
          </div>
          {urlMsg ? (
            <div style={{ marginTop: 10, fontSize: 13, fontFamily: sans, color: "#a05040" }}>{urlMsg}</div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 12, fontFamily: sans, color: C.faint }}>Paste a roaster's product page. AI reads it, fills the details, and drops you on Manual to review.</div>
          )}
        </div>
      )}

      {/* ── MANUAL TAB ── */}
      {tab === "manual" && (
        <>
          {filledFrom && (
            <div style={{ background: "#eef3ec", border: "1px solid #d7e3d2", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontFamily: sans, fontSize: 13, color: "#3a6040" }}>
              ✓ Filled in from the {filledFrom === "photo" ? "photo" : "link"} — check &amp; adjust below.
            </div>
          )}

          <SectionHead title="Photo" />
          <input ref={uploadRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageFile(e.target.files[0], { scan: false })} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
            {preview ? (
              <img src={preview} alt="package" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, border: `1.5px solid ${C.border}` }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 12, background: C.tint, border: `1.5px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📷</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => uploadRef.current?.click()} style={{ ...ghostBtn, padding: "8px 14px", fontSize: 13 }}>{preview ? "Replace photo" : "Upload photo"}</button>
              {preview && <button onClick={removeImage} style={{ ...ghostBtn, padding: "8px 14px", fontSize: 13, color: "#b07060", borderColor: "#e0c0b0" }}>Remove</button>}
            </div>
          </div>

          <SectionHead title="Basics" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Coffee name *" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Yirgacheffe Kochere" full />
            {!editing && dupes.length > 0 && (
              <div style={{ gridColumn: "1/-1", background: "#fbeee4", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, color: "#6b4226", fontFamily: sans, marginBottom: 6 }}>Already in the catalog?</div>
                {dupes.map((d) => (
                  <button key={d.id} onClick={() => onOpenExisting?.(d)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "6px 0", cursor: "pointer", fontFamily: sans, fontSize: 13, color: C.brown }}>
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
              <label style={labelStyle}>Country</label>
              <CountryCombobox value={form.origin} onChange={(v) => set("origin", v)} placeholder="e.g. Ethiopia" style={inputStyle} />
            </div>
            <Field label="Region" value={form.region} onChange={(v) => set("region", v)} placeholder="e.g. Yirgacheffe" />
            <Field label="Producer / farm" value={form.producer} onChange={(v) => set("producer", v)} placeholder="e.g. Daye Bensa" />
            <Field label="Importer" value={form.importer} onChange={(v) => set("importer", v)} placeholder="optional" />
          </div>

          <SectionHead title="Bean details" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Varietal" value={form.varietal} onChange={(v) => set("varietal", v)} options={VARIETALS} />
            <Select label="Process" value={form.process} onChange={(v) => set("process", v)} options={PROCESSES} />
            <Select label="Roast level" value={form.roastLevel} onChange={(v) => set("roastLevel", v)} options={ROAST_LEVELS} />
            <Field label="Altitude (masl)" value={form.altitude} onChange={(v) => set("altitude", v)} placeholder="e.g. 1900–2200" />
            <Field label="Harvest" value={form.harvest} onChange={(v) => set("harvest", v)} placeholder="e.g. Nov 2024" full />
          </div>

          <SectionHead title="Flavour profile" />
          <ScaleSlider label="Acidity" value={form.acidity} onChange={(v) => set("acidity", v)} />
          <ScaleSlider label="Body" value={form.body} onChange={(v) => set("body", v)} />
          <ScaleSlider label="Sweetness" value={form.sweetness} onChange={(v) => set("sweetness", v)} />

          <SectionHead title="Flavour notes" />
          <FlavorPicker value={form.tags} onChange={(v) => set("tags", v)} />

          <SectionHead title="From the bag" />
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Roaster's tasting notes, origin story…" />
        </>
      )}

      {error && <div style={{ background: "#f7e4dc", color: "#a05040", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: sans, marginTop: 16 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #ecddd0" }}>
        {tab !== "manual" && <span style={{ flex: 1, fontFamily: sans, fontSize: 12, color: C.faint }}>or fill it in on Manual →</span>}
        <button onClick={onClose} style={ghostBtn}>Cancel</button>
        <button onClick={save} disabled={saving || scanning} style={primaryBtn(!saving && !scanning)}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add to catalog"}
        </button>
      </div>
    </Sheet>
  );
}
