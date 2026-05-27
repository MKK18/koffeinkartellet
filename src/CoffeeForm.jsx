import { useState, useRef, useEffect } from "react";
import { C, sans, serif, inputStyle, labelStyle, primaryBtn, ghostBtn } from "./ui.jsx";
import { Sheet, SectionHead, Tag, Spinner, CountryCombobox } from "./components.jsx";
import { PROCESSES, ROAST_LEVELS, VARIETALS, FLAVOR_TAGS, compressImage, extractBeanFromImage, extractBeanFromUrl } from "./lib.js";
import { createCoffee, updateCoffee, searchCoffeesByName, coffeeImageUrl } from "./data.js";

const EMPTY = {
  name: "", roaster: "", origin: "", region: "", producer: "", varietal: "",
  process: "", roastLevel: "", altitude: "", harvest: "", importer: "", tags: [], notes: "",
};

// coffee: existing record to edit, or null to add new.
export default function CoffeeForm({ coffee, onClose, onSaved, onOpenExisting, onOpenSettings }) {
  const editing = !!coffee?.id;
  const [form, setForm] = useState(() =>
    coffee ? {
      name: coffee.name || "", roaster: coffee.roaster || "", origin: coffee.origin || "",
      region: coffee.region || "", producer: coffee.producer || "", varietal: coffee.varietal || "",
      process: coffee.process || "", roastLevel: coffee.roast_level || "", altitude: coffee.altitude || "",
      harvest: coffee.harvest || "", importer: coffee.importer || "", tags: coffee.tags || [], notes: coffee.bag_notes || "",
    } : { ...EMPTY }
  );
  const [imageBlob, setImageBlob] = useState(null);
  const [preview, setPreview] = useState(editing ? coffeeImageUrl(coffee, "300x300") : "");
  const [base64, setBase64] = useState("");
  const [dupes, setDupes] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [url, setUrl] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlMsg, setUrlMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTag = (t) => set("tags", form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t]);

  // Merge AI-extracted fields into the form (only filling blanks-friendly keys).
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

  const fetchFromUrl = async () => {
    const link = url.trim();
    if (!link) return;
    setFetchingUrl(true); setUrlMsg(""); setError("");
    try {
      const x = await extractBeanFromUrl(link);
      applyExtracted(x);
      setUrlMsg("✓ Filled in from the link — check and adjust below");
    } catch (err) {
      setUrlMsg(err?.message === "NO_API_KEY"
        ? "Add your Anthropic API key in Settings to import from a link."
        : "Couldn't read that page — try the photo instead, or fill in manually.");
    } finally {
      setFetchingUrl(false);
    }
  };

  // Search-before-add: warn about likely duplicates as they type the name.
  useEffect(() => {
    if (editing) return;
    const name = form.name.trim();
    if (name.length < 2) { setDupes([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const found = await searchCoffeesByName(name);
        if (!cancelled) setDupes(found);
      } catch { /* ignore */ }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [form.name, editing]);

  const handleImageFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setError(""); setScanMsg("");
    try {
      const { blob, base64: b64 } = await compressImage(file);
      setImageBlob(blob);
      setBase64(b64);
      setPreview(URL.createObjectURL(blob));
      // auto-scan
      setScanning(true);
      try {
        const x = await extractBeanFromImage(b64);
        applyExtracted(x);
        setScanMsg("✓ Filled in from the photo — check and adjust below");
      } catch (err) {
        setScanMsg(err?.message === "NO_API_KEY"
          ? "Add your Anthropic API key in Settings to enable photo scanning."
          : "Couldn't read the photo — fill in manually.");
      } finally {
        setScanning(false);
      }
    } catch {
      setError("That image couldn't be processed.");
    }
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Give the coffee a name."); return; }
    setSaving(true); setError("");
    try {
      const saved = editing
        ? await updateCoffee(coffee.id, form, imageBlob)
        : await createCoffee(form, imageBlob);
      onSaved(saved);
    } catch (err) {
      setError(err?.message || "Couldn't save. Try again.");
      setSaving(false);
    }
  };

  const F = ({ label, k, placeholder, type, full }) => (
    <div style={full ? { gridColumn: "1/-1" } : {}}>
      <label style={labelStyle}>{label}</label>
      <input type={type || "text"} style={inputStyle} value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder || ""} />
    </div>
  );
  const Sel = ({ label, k, options }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select style={inputStyle} value={form[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontFamily: serif, fontSize: 22, color: C.ink }}>{editing ? "Edit coffee" : "Add a coffee"}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 26, color: C.muted, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <SectionHead title="Package photo" />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handleImageFile(e.target.files[0])} />
      {preview ? (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <img src={preview} alt="package" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, border: `1.5px solid ${C.border}` }} />
          <div style={{ flex: 1, fontFamily: sans, fontSize: 13 }}>
            {scanning && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.brown }}><Spinner /> Scanning & searching the web…</div>}
            {!scanning && scanMsg && <div style={{ color: scanMsg.startsWith("✓") ? "#4a7a50" : "#a05040" }}>{scanMsg}</div>}
            {!scanning && (
              <button onClick={() => fileRef.current?.click()} style={{ ...ghostBtn, marginTop: 8, padding: "7px 14px", fontSize: 12 }}>Replace photo</button>
            )}
          </div>
        </div>
      ) : (
        <div onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
          style={{ border: "2px dashed #d4c5b5", borderRadius: 14, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: C.tint }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
          <div style={{ fontFamily: serif, fontSize: 15, color: "#6b4226", marginBottom: 4 }}>Take or upload a package photo</div>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.faint }}>AI will scan it and fill in the details</div>
        </div>
      )}

      <SectionHead title="Or paste a link" />
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchFromUrl(); } }}
          placeholder="https://roaster.com/shop/that-coffee"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={fetchFromUrl} disabled={fetchingUrl || !url.trim()} style={{ ...primaryBtn(!fetchingUrl && !!url.trim()), padding: "0 16px", whiteSpace: "nowrap" }}>
          {fetchingUrl ? <Spinner /> : "Fetch"}
        </button>
      </div>
      {urlMsg && (
        <div style={{ marginTop: 8, fontSize: 13, fontFamily: sans, color: urlMsg.startsWith("✓") ? "#4a7a50" : "#a05040" }}>{urlMsg}</div>
      )}

      <SectionHead title="Basics" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <F label="Coffee name *" k="name" placeholder="e.g. Yirgacheffe Kochere" full />
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
        <F label="Roaster" k="roaster" placeholder="e.g. DAK Coffee Roasters" full />
      </div>

      <SectionHead title="Origin & provenance" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Country</label>
          <CountryCombobox value={form.origin} onChange={(v) => set("origin", v)} placeholder="e.g. Ethiopia" style={inputStyle} />
        </div>
        <F label="Region" k="region" placeholder="e.g. Yirgacheffe" />
        <F label="Producer / farm" k="producer" placeholder="e.g. Daye Bensa" />
        <F label="Importer" k="importer" placeholder="optional" />
      </div>

      <SectionHead title="Bean details" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Sel label="Varietal" k="varietal" options={VARIETALS} />
        <Sel label="Process" k="process" options={PROCESSES} />
        <Sel label="Roast level" k="roastLevel" options={ROAST_LEVELS} />
        <F label="Altitude (masl)" k="altitude" placeholder="e.g. 1900–2200" />
        <F label="Harvest" k="harvest" placeholder="e.g. Nov 2024" full />
      </div>

      <SectionHead title="Flavour tags" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {FLAVOR_TAGS.map((t) => <Tag key={t} label={t} active={form.tags.includes(t)} onClick={() => toggleTag(t)} />)}
      </div>

      <SectionHead title="From the bag" />
      <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Roaster's tasting notes, origin story…" />

      {error && <div style={{ background: "#f7e4dc", color: "#a05040", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: sans, marginTop: 16 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid #ecddd0" }}>
        <button onClick={onClose} style={ghostBtn}>Cancel</button>
        <button onClick={save} disabled={saving || scanning} style={primaryBtn(!saving && !scanning)}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add to catalog"}
        </button>
      </div>
    </Sheet>
  );
}
