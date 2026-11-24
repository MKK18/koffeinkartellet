import { useState, useRef, useEffect } from "react";
import { Sheet, SectionHead, Spinner, Combobox, MultiCombobox, FlavorPicker, Icon, Slip } from "./components.jsx";
import { PROCESSES, ROAST_LEVELS, VARIETALS, FLAVOR_TAGS, COFFEE_COUNTRIES, compressImage, extractBeanFromImage, extractBeanFromUrl, fetchExternalImage, scrapePageImage } from "./lib.js";
import { createCoffee, updateCoffee, deleteCoffee, searchCoffeesByName, coffeeImageUrl } from "./data.js";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";

const EMPTY = {
  name: "", roaster: "", origin: [], region: "", producer: "", varietal: [],
  process: "", roastLevel: "", altitude: "", harvest: "", importer: "", tags: [], notes: "",
};

const toArr = (v) => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  return [];
};

function Field({ label, value, onChange, placeholder, type, full, id, hint, inputMode }) {
  return (
    <div className="field" style={full ? { gridColumn: "1/-1" } : undefined}>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type={type || "text"} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || ""} inputMode={inputMode} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

const TABS = [
  { id: "photo", label: "Photo", icon: "camera" },
  { id: "link", label: "Shop link", icon: "link" },
  { id: "manual", label: "Type it in", icon: "edit" },
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
  const initial = useRef(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  if (initial.current === null) initial.current = JSON.stringify(form);
  const dirty = !!imageBlob || JSON.stringify(form) !== initial.current;

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
    if (!confirmDel) { setConfirmDel(true); return; }
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

  const canSave = !!form.name.trim() && !saving && !scanning && !deleting;

  return (
    <Sheet title={editing ? "Edit coffee" : "Add a coffee"} onClose={onClose} dirty={dirty && !saving} maxWidth={640}>
      <div className="seg" role="tablist" aria-label="How to add it">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}><Icon name={t.icon} />{t.label}</button>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { handleImageFile(e.target.files[0]); e.target.value = ""; }} />

      {tab === "photo" && (
        preview ? (
          <div className="bv-shot">
            <img src={preview} alt="The bag" />
            <div style={{ flex: 1, minWidth: 0 }}>
              {scanning && <div className="bv-busy"><Spinner />Reading the label and looking it up…</div>}
              {!scanning && scanMsg && <Slip>{scanMsg}</Slip>}
              {!scanning && !scanMsg && <div style={{ fontWeight: 700, color: "var(--buy)", display: "flex", gap: 6, alignItems: "center" }}><Icon name="check" size={18} />Photo added</div>}
              {!scanning && <button type="button" onClick={() => fileRef.current?.click()} className="linkbtn" style={{ marginTop: 6, fontSize: 14 }}>Use a different photo</button>}
            </div>
          </div>
        ) : (
          <div className="dropzone" onDrop={(e) => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); }} onDragOver={(e) => e.preventDefault()}>
            <button type="button" className="btn btn-red" style={{ minHeight: 54 }} onClick={() => fileRef.current?.click()}><Icon name="camera" />Take or choose a photo</button>
            <p className="hint" style={{ textAlign: "center", margin: "10px auto 0", maxWidth: "34ch" }}>We read the label and fill in the details. You check them on the next step.</p>
          </div>
        )
      )}

      {tab === "link" && (
        <form onSubmit={(e) => { e.preventDefault(); fetchFromUrl(); }}>
          <label className="field" style={{ marginBottom: 10 }}>
            <span className="label">Roaster's product page</span>
            <input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://roaster.com/shop/that-coffee" className="input" />
          </label>
          <button type="submit" disabled={fetchingUrl || !url.trim()} className="btn btn-primary">{fetchingUrl ? <><Spinner />Reading the page…</> : "Fill in from link"}</button>
          {urlMsg ? <Slip style={{ marginTop: 12 }}>{urlMsg}</Slip> : <p className="hint">We read the page and fill in the details for you to check.</p>}
        </form>
      )}

      {tab === "manual" && (
        <>
          {filledFrom && (
            <p role="status" style={{ margin: "0 0 6px", padding: "10px 12px", borderRadius: 10, background: "var(--buy-tint)", color: "var(--buy)", fontWeight: 600, fontSize: 15, display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="check" size={18} />Filled in from the {filledFrom === "photo" ? "photo" : "link"}. Check it over.
            </p>
          )}

          <SectionHead title="The coffee" />
          <div className="form-grid">
            <Field id="f-name" label="Name" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Kieni AA" full />
            {!editing && dupes.length > 0 && (
              <div style={{ gridColumn: "1/-1", marginTop: -6, marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: "var(--tint)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)", marginBottom: 4 }}>Already on the table?</div>
                {dupes.map((d) => (
                  <button key={d.id} type="button" onClick={() => onOpenExisting?.(d)} className="linkbtn" style={{ display: "block", padding: "4px 0", fontSize: 15 }}>
                    {d.name}{d.roaster ? `, ${d.roaster}` : ""}
                  </button>
                ))}
              </div>
            )}
            <Field id="f-roaster" label="Roaster" value={form.roaster} onChange={(v) => set("roaster", v)} placeholder="e.g. Coffee Collective" full />
          </div>
          <div className="field">
            <span className="label">Photo</span>
            <input ref={uploadRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { handleImageFile(e.target.files[0], { scan: false }); e.target.value = ""; }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {preview ? <img src={preview} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "1.5px solid var(--rule)" }} />
                : <span className="bowl" aria-hidden="true" style={{ width: 56, height: 56, display: "inline-block" }} />}
              <button type="button" onClick={() => uploadRef.current?.click()} className="btn btn-line"><Icon name="image" />{preview ? "Change photo" : "Add a photo"}</button>
              {preview && <button type="button" onClick={removeImage} className="btn btn-quiet">Remove</button>}
            </div>
          </div>

          <SectionHead title="Where it's from" />
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="f-origin">Country</label>
              <MultiCombobox id="f-origin" values={form.origin} onChange={(v) => set("origin", v)} options={COFFEE_COUNTRIES} placeholder="e.g. Ethiopia" />
            </div>
            <Field id="f-region" label="Region" value={form.region} onChange={(v) => set("region", v)} placeholder="e.g. Yirgacheffe" />
            <Field id="f-producer" label="Producer or farm" value={form.producer} onChange={(v) => set("producer", v)} placeholder="e.g. Daye Bensa" />
            <Field id="f-importer" label="Importer" value={form.importer} onChange={(v) => set("importer", v)} placeholder="Optional" />
          </div>

          <SectionHead title="The beans" />
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="f-var">Varietal</label>
              <MultiCombobox id="f-var" values={form.varietal} onChange={(v) => set("varietal", v)} options={VARIETALS} placeholder="e.g. Gesha" />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-proc">Process</label>
              <Combobox id="f-proc" value={form.process} onChange={(v) => set("process", v)} options={PROCESSES} placeholder="e.g. Washed" />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-roast">Roast</label>
              <Combobox id="f-roast" value={form.roastLevel} onChange={(v) => set("roastLevel", v)} options={ROAST_LEVELS} placeholder="Light, medium, dark" />
            </div>
            <Field id="f-alt" label="Altitude (metres)" value={form.altitude} onChange={(v) => set("altitude", v)} placeholder="e.g. 1900–2200" inputMode="numeric" />
            <Field id="f-harvest" label="Harvest" value={form.harvest} onChange={(v) => set("harvest", v)} placeholder="e.g. Nov 2025" full />
          </div>

          <SectionHead title="Flavour notes on the bag" />
          <FlavorPicker value={form.tags} onChange={(v) => set("tags", v)} />

          <div className="field" style={{ marginTop: 8 }}>
            <label className="label" htmlFor="f-notes">From the bag</label>
            <textarea id="f-notes" className="input" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="The roaster's tasting notes or story" />
          </div>
        </>
      )}

      {error && <Slip style={{ marginTop: 16 }}>{error}</Slip>}

      {confirmDel && (
        <div className="slip" role="alertdialog" aria-label="Delete this coffee?" style={{ marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
          <Icon name="alert" />
          <span style={{ flex: "1 1 220px" }}>Delete {coffee?.name}? Every tasting of it goes too, for the whole crew. This can't be undone.</span>
          <button type="button" className="btn btn-quiet" onClick={() => setConfirmDel(false)}>Keep it</button>
          <button type="button" className="btn btn-ink" onClick={remove} disabled={deleting}>{deleting ? "Deleting…" : "Delete for everyone"}</button>
        </div>
      )}

      <div className="form-foot">
        {canDelete && !confirmDel && (
          <button type="button" onClick={remove} disabled={deleting} className="btn btn-quiet" style={{ marginRight: "auto", color: "var(--red-deep)" }}>
            <Icon name="trash" />{deleting ? "Deleting…" : "Delete coffee"}
          </button>
        )}
        {tab !== "manual" && !form.name.trim() && <span className="hint" style={{ flex: "1 1 100%", margin: 0 }}>No photo or link? <button type="button" className="linkbtn" onClick={() => setTab("manual")}>Type it in instead</button></span>}
        <button type="button" onClick={onClose} className="btn btn-quiet">Cancel</button>
        <button type="button" onClick={save} disabled={!canSave} className="btn btn-primary">
          {saving ? "Saving…" : editing ? "Save changes" : "Add to coffees"}
        </button>
      </div>
    </Sheet>
  );
}
