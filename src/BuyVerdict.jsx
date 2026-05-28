import { useState, useRef } from "react";
import { C, sans, serif, inputStyle, labelStyle, primaryBtn, ghostBtn } from "./ui.jsx";
import { Sheet, Spinner } from "./components.jsx";
import { compressImage, verdictFromImage, verdictFromUrl, fetchExternalImage } from "./lib.js";
import { palateSummary, getMyHousehold, createCoffee, coffeeImageUrl } from "./data.js";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";

const TABS = [
  { id: "photo", label: "📷 Photo" },
  { id: "link", label: "🔗 Link" },
];

const VERDICT_COLORS = {
  buy:   { bg: "#e6f0e0", border: "#a8c898", ink: "#356633", emoji: "🟢", label: "BUY" },
  maybe: { bg: "#fbeed4", border: "#d8c490", ink: "#6b5526", emoji: "🟡", label: "MAYBE" },
  skip:  { bg: "#f0dada", border: "#d1a0a0", ink: "#7a3030", emoji: "🔴", label: "SKIP" },
};

export default function BuyVerdict({ onClose }) {
  const { user } = useAuth();
  const { bumpData, openCoffee } = useNav();
  const [tab, setTab] = useState("photo");
  const [imageBlob, setImageBlob] = useState(null);
  const [preview, setPreview] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [result, setResult] = useState(null); // { coffee, verdict, confidence, reasoning }
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const loadPalate = async () => {
    const hh = await getMyHousehold().catch(() => null);
    const ids = hh?.memberIds?.length ? hh.memberIds : [user.id];
    return palateSummary({ userId: user.id, memberIds: ids });
  };

  const handlePhoto = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setErrMsg(""); setResult(null);
    try {
      const { blob, base64 } = await compressImage(file);
      setImageBlob(blob); setPreview(URL.createObjectURL(blob));
      setBusy(true);
      const palate = await loadPalate();
      const r = await verdictFromImage(base64, palate);
      setResult(r);
    } catch (err) {
      setErrMsg(err?.message === "NO_API_KEY"
        ? "Add an API key in Settings (or enable the shared one) to use this."
        : `Couldn't read that photo — ${err?.message || "try another."}`);
    } finally { setBusy(false); }
  };

  const fetchUrl = async () => {
    const link = url.trim();
    if (!link) return;
    setErrMsg(""); setResult(null); setBusy(true);
    try {
      const palate = await loadPalate();
      const r = await verdictFromUrl(link, palate);
      setResult(r);
      // Try to pull a product image so "save to catalog" has the photo.
      if (r?.coffee?.image_url) {
        try {
          const blob = await fetchExternalImage(r.coffee.image_url);
          if (blob) {
            const f = new File([blob], "from-link.jpg", { type: blob.type || "image/jpeg" });
            const { blob: cmp } = await compressImage(f);
            setImageBlob(cmp); setPreview(URL.createObjectURL(cmp));
          }
        } catch { /* non-fatal */ }
      }
    } catch (err) {
      setErrMsg(err?.message === "NO_API_KEY"
        ? "Add an API key in Settings to use this."
        : `Couldn't read that link — ${err?.message || "try another."}`);
    } finally { setBusy(false); }
  };

  const saveToCatalog = async () => {
    if (!result?.coffee) return;
    setSaving(true);
    try {
      const c = result.coffee;
      // origin and varietal can come back as arrays (new prompt) or strings
      // (legacy). Flatten to comma-separated strings for storage.
      const flat = (v) => Array.isArray(v) ? v.filter(Boolean).join(", ") : (v || "");
      const saved = await createCoffee({
        name: c.name || "", roaster: c.roaster || "", origin: flat(c.origin),
        region: c.region || "", producer: c.producer || "", varietal: flat(c.varietal),
        process: c.process || "", roastLevel: c.roastLevel || "", altitude: c.altitude || "",
        harvest: c.harvest || "", importer: c.importer || "", tags: c.tags || [], notes: c.notes || "",
      }, imageBlob);
      bumpData();
      onClose();
      openCoffee(saved);
    } catch (err) {
      setErrMsg(err?.message || "Couldn't save to catalog.");
      setSaving(false);
    }
  };

  const v = result?.verdict && VERDICT_COLORS[result.verdict] ? VERDICT_COLORS[result.verdict] : null;

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontFamily: serif, fontSize: 22, color: C.ink }}>🔮 Should I buy this?</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 26, color: C.muted, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {/* Tab selector */}
      <div style={{ display: "flex", gap: 6, background: C.tint, border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
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

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handlePhoto(e.target.files[0])} />

      {tab === "photo" && !preview && (
        <div onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); handlePhoto(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
          style={{ border: "2px dashed #d4c5b5", borderRadius: 14, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: C.tint }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
          <div style={{ fontFamily: serif, fontSize: 16, color: "#6b4226", marginBottom: 4 }}>Snap a bag</div>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.faint }}>I'll read it and tell you if it's your kind of coffee.</div>
        </div>
      )}

      {tab === "photo" && preview && (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 8 }}>
          <img src={preview} alt="bag" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, border: `1.5px solid ${C.border}` }} />
          <button onClick={() => fileRef.current?.click()} style={{ ...ghostBtn, padding: "7px 14px", fontSize: 12 }}>Replace photo</button>
        </div>
      )}

      {tab === "link" && (
        <div>
          <label style={labelStyle}>Roaster product link</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchUrl(); } }}
              placeholder="https://roaster.com/shop/that-coffee" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={fetchUrl} disabled={busy || !url.trim()} style={{ ...primaryBtn(!busy && !!url.trim()), padding: "0 18px", whiteSpace: "nowrap" }}>
              {busy ? <Spinner /> : "Check"}
            </button>
          </div>
        </div>
      )}

      {busy && (
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, color: C.muted, fontFamily: sans, fontSize: 14 }}>
          <Spinner /> Reading the bag and consulting your palate…
        </div>
      )}

      {errMsg && (
        <div style={{ marginTop: 14, background: "#f7e4dc", color: "#a05040", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: sans }}>{errMsg}</div>
      )}

      {/* The verdict card */}
      {v && !busy && (
        <div style={{ marginTop: 18, background: v.bg, border: `1.5px solid ${v.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>{v.emoji}</span>
            <span style={{ fontFamily: serif, fontWeight: 900, fontSize: 28, color: v.ink, letterSpacing: "-0.01em" }}>{v.label}</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: sans, fontSize: 11, color: v.ink, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {result.confidence || "—"} confidence
            </span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 14, color: v.ink, lineHeight: 1.5 }}>{result.reasoning}</div>

          {/* Overlap with the palate */}
          {(result.matches?.length > 0 || result.mismatches?.length > 0) && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {result.matches?.map((m, i) => (
                <div key={`m${i}`} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 13, color: v.ink }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#a8c898", color: "#fff8f0", fontSize: 11 }}>✓</span>
                  <span style={{ flex: 1 }}><strong>{m.attr}:</strong> {m.value}</span>
                  {typeof m.yourAvg === "number" && (
                    <span style={{ opacity: 0.85, fontFamily: serif, fontWeight: 700 }}>
                      {Number(m.yourAvg).toFixed(1)}<span style={{ fontSize: 10, fontFamily: sans, opacity: 0.7, marginLeft: 3 }}>({m.n || 0})</span>
                    </span>
                  )}
                </div>
              ))}
              {result.mismatches?.map((m, i) => (
                <div key={`x${i}`} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 13, color: v.ink, opacity: 0.75 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#d1a0a0", color: "#fff8f0", fontSize: 11 }}>!</span>
                  <span style={{ flex: 1 }}><strong>{m.attr}:</strong> {m.value}</span>
                  <span style={{ fontSize: 11, fontStyle: "italic" }}>{m.note}</span>
                </div>
              ))}
            </div>
          )}

          {/* Compact extracted info */}
          {result.coffee?.name && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontFamily: sans, fontSize: 12, color: v.ink, opacity: 0.85 }}>What I read on the bag</summary>
              <div style={{ marginTop: 8, fontSize: 13, fontFamily: sans, color: C.ink, lineHeight: 1.6 }}>
                {(() => {
                  const flat = (v) => Array.isArray(v) ? v.filter(Boolean).join(", ") : (v || "");
                  const origin = flat(result.coffee.origin);
                  const varietal = flat(result.coffee.varietal);
                  const region = result.coffee.region || "";
                  const facts = [varietal, result.coffee.process, result.coffee.roastLevel, result.coffee.altitude ? `${result.coffee.altitude} masl` : null].filter(Boolean);
                  return (
                    <>
                      <div><strong>{result.coffee.name}</strong>{result.coffee.roaster ? ` · ${result.coffee.roaster}` : ""}</div>
                      {(origin || region) && (
                        <div style={{ color: C.muted }}>{[origin, region].filter(Boolean).join(" · ")}</div>
                      )}
                      {facts.length > 0 && (
                        <div style={{ color: C.muted, marginTop: 2 }}>{facts.join(" · ")}</div>
                      )}
                    </>
                  );
                })()}
                {result.coffee.tags?.length > 0 && (
                  <div style={{ color: C.muted, marginTop: 4 }}>{result.coffee.tags.join(" · ")}</div>
                )}
              </div>
            </details>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid #ecddd0" }}>
        <button onClick={onClose} style={ghostBtn}>{result ? "Done" : "Cancel"}</button>
        {result?.coffee?.name && (
          <button onClick={saveToCatalog} disabled={saving} style={primaryBtn(!saving)}>
            {saving ? "Saving…" : "Save to catalog"}
          </button>
        )}
      </div>
    </Sheet>
  );
}
