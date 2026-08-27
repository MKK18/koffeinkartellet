import { useState, useRef } from "react";
import { Sheet, Spinner } from "./components.jsx";
import { compressImage, verdictFromImage, verdictFromUrl, fetchExternalImage } from "./lib.js";
import { palateSummary, getMyHousehold, createCoffee } from "./data.js";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";

const MONO = "var(--font-mono)";
const DISPLAY = "var(--font-display)";
const BODY = "var(--font-body)";

const TABS = [{ id: "photo", label: "Photo" }, { id: "link", label: "Link" }];
const VERDICT = {
  buy:   { c: "var(--ok)", label: "BUY" },
  maybe: { c: "var(--amber)", label: "MAYBE" },
  skip:  { c: "var(--stamp)", label: "SKIP" },
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
  const [result, setResult] = useState(null);
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
        ? "Add an API key in Settings to use this."
        : err?.message?.includes("content filter")
          ? "The AI couldn't read that photo — try a clearer, well-lit shot of the bag."
          : "Couldn't read that photo — try again or use a different image.");
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

  const v = result?.verdict && VERDICT[result.verdict] ? VERDICT[result.verdict] : null;

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 26, fontWeight: 400, textTransform: "uppercase", color: "var(--bone)" }}>Should I buy this?</h2>
        <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 24, color: "var(--dim)", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {/* Tab selector */}
      <div style={{ display: "flex", gap: 4, border: "1px solid var(--ink-line)", padding: 4, marginBottom: 18 }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px 4px", border: "none", cursor: "pointer",
              fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
              background: active ? "var(--stamp)" : "transparent", color: active ? "#fff" : "var(--dim)",
            }}>{t.label}</button>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handlePhoto(e.target.files[0])} />

      {tab === "photo" && !preview && (
        <div onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); handlePhoto(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
          style={{ border: "1px dashed var(--ink-line)", padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "var(--ink)" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--stamp)" strokeWidth="1.4" style={{ marginBottom: 12 }}><rect x="3" y="6" width="18" height="14" rx="1" /><path d="M3 10h18" /><circle cx="12" cy="14" r="3.2" /><path d="M8 6l1.5-2h5L16 6" /></svg>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, textTransform: "uppercase", color: "var(--bone)", marginBottom: 6 }}>Snap a bag</div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: "var(--dim)" }}>I'll read it and check it against your palate.</div>
        </div>
      )}

      {tab === "photo" && preview && (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 8 }}>
          <img src={preview} alt="bag" style={{ width: 96, height: 96, objectFit: "cover", border: "1px solid var(--ink-line)" }} />
          <button onClick={() => fileRef.current?.click()} className="cl-ghost-btn" style={{ padding: "9px 14px" }}>Replace photo</button>
        </div>
      )}

      {tab === "link" && (
        <div>
          <span className="cl-label">Roaster product link</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchUrl(); } }}
              placeholder="https://roaster.com/shop/that-coffee" className="cl-input" style={{ flex: 1 }} />
            <button onClick={fetchUrl} disabled={busy || !url.trim()} className="cl-stamp-btn" style={{ padding: "0 18px", whiteSpace: "nowrap" }}>
              {busy ? <Spinner /> : "Check"}
            </button>
          </div>
        </div>
      )}

      {busy && (
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, color: "var(--dim)", fontFamily: MONO, fontSize: 12, letterSpacing: "0.06em" }}>
          <Spinner /> Reading the bag and consulting your palate…
        </div>
      )}

      {errMsg && (
        <div style={{ marginTop: 14, background: "rgba(226,67,29,.12)", border: "1px solid var(--stamp)", color: "#f0b7a6", padding: "10px 12px", fontSize: 12, fontFamily: MONO }}>{errMsg}</div>
      )}

      {/* The verdict — stamped board */}
      {v && !busy && (
        <div style={{ marginTop: 18, background: "var(--ink)", border: "1px solid var(--ink-line)", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, borderBottom: "1px solid var(--ink-line)", paddingBottom: 14 }}>
            <span className="tnum" style={{ fontFamily: DISPLAY, fontSize: 52, lineHeight: 0.8, color: v.c }}>{v.label}</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "right" }}>
              {result.confidence || "—"}<br />confidence
            </span>
          </div>
          <div style={{ fontFamily: BODY, fontSize: 15, color: "var(--manila)", lineHeight: 1.55 }}>{result.reasoning}</div>

          {(result.matches?.length > 0 || result.mismatches?.length > 0) && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {result.matches?.map((m, i) => (
                <div key={`m${i}`} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 12, color: "var(--manila)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, border: "1px solid var(--ok)", color: "var(--ok)", fontSize: 11 }}>✓</span>
                  <span style={{ flex: 1, letterSpacing: "0.04em", textTransform: "uppercase" }}><b style={{ color: "var(--bone)" }}>{m.attr}:</b> {m.value}</span>
                  {typeof m.yourAvg === "number" && (
                    <span className="tnum" style={{ fontFamily: DISPLAY, color: "var(--ok)" }}>{Number(m.yourAvg).toFixed(1)}<span style={{ fontSize: 9, fontFamily: MONO, color: "var(--dim)", marginLeft: 3 }}>({m.n || 0})</span></span>
                  )}
                </div>
              ))}
              {result.mismatches?.map((m, i) => (
                <div key={`x${i}`} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 12, color: "var(--dim)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, border: "1px solid var(--stamp)", color: "var(--stamp)", fontSize: 11 }}>!</span>
                  <span style={{ flex: 1, letterSpacing: "0.04em", textTransform: "uppercase" }}><b style={{ color: "var(--manila)" }}>{m.attr}:</b> {m.value}</span>
                  <span style={{ fontSize: 10, fontStyle: "italic", fontFamily: BODY }}>{m.note}</span>
                </div>
              ))}
            </div>
          )}

          {result.coffee?.name && (
            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer", fontFamily: MONO, fontSize: 11, color: "var(--dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>What I read on the bag</summary>
              <div style={{ marginTop: 10, fontSize: 13, fontFamily: BODY, color: "var(--manila)", lineHeight: 1.6 }}>
                {(() => {
                  const flat = (val) => Array.isArray(val) ? val.filter(Boolean).join(", ") : (val || "");
                  const origin = flat(result.coffee.origin);
                  const varietal = flat(result.coffee.varietal);
                  const region = result.coffee.region || "";
                  const facts = [varietal, result.coffee.process, result.coffee.roastLevel, result.coffee.altitude ? `${result.coffee.altitude} masl` : null].filter(Boolean);
                  return (
                    <>
                      <div><b style={{ color: "var(--bone)" }}>{result.coffee.name}</b>{result.coffee.roaster ? ` · ${result.coffee.roaster}` : ""}</div>
                      {(origin || region) && <div style={{ color: "var(--dim)" }}>{[origin, region].filter(Boolean).join(" · ")}</div>}
                      {facts.length > 0 && <div style={{ color: "var(--dim)", marginTop: 2 }}>{facts.join(" · ")}</div>}
                    </>
                  );
                })()}
                {result.coffee.tags?.length > 0 && <div style={{ color: "var(--dim)", marginTop: 4 }}>{result.coffee.tags.join(" · ")}</div>}
              </div>
            </details>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--ink-line)" }}>
        <button onClick={onClose} className="cl-ghost-btn">{result ? "Done" : "Cancel"}</button>
        {result?.coffee?.name && (
          <button onClick={saveToCatalog} disabled={saving} className="cl-stamp-btn">{saving ? "Saving…" : "Save to catalog"}</button>
        )}
      </div>
    </Sheet>
  );
}
