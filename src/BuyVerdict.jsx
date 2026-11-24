import { useState, useEffect, useRef } from "react";
import { Sheet, Spinner, Slip, Icon, Ring, Bowl, Score } from "./components.jsx";
import { compressImage, verdictFromImage, verdictFromUrl, fetchExternalImage } from "./lib.js";
import { palateSummary, getMyHousehold, createCoffee, listCoffees, listAllTastings, setWant, coffeeImageUrl } from "./data.js";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { avg, firstName, memberColor } from "./marks.js";

const VERDICT = {
  buy: { word: "Buy it", color: "var(--buy)", line: "Right up the crew's street." },
  maybe: { word: "Maybe", color: "var(--maybe)", line: "Could go either way for you." },
  skip: { word: "Skip it", color: "var(--skip)", line: "Not your kind of cup." },
};
const flat = (v) => (Array.isArray(v) ? v.filter(Boolean).join(", ") : v || "");
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// What the crew already thinks: this exact coffee, else this roaster.
async function crewHistory(read) {
  if (!read?.name && !read?.roaster) return { kind: "none" };
  const [coffees, tastings] = await Promise.all([listCoffees(""), listAllTastings()]);
  const scores = {};
  tastings.forEach((t) => { const s = Number(t.score); if (s) (scores[t.coffee] ||= []).push({ s, user: t.user }); });
  const n = norm(read.name), r = norm(read.roaster);
  const same = coffees.find((c) => {
    const cn = norm(c.name);
    const nameHit = n && cn && (cn === n || (cn.length > 3 && n.includes(cn)) || (n.length > 3 && cn.includes(n)));
    return nameHit && (!r || !c.roaster || norm(c.roaster) === r || norm(c.roaster).includes(r) || r.includes(norm(c.roaster)));
  });
  if (same) return { kind: "same", coffee: same, scores: scores[same.id] || [] };
  if (r) {
    const fromRoaster = coffees.filter((c) => { const cr = norm(c.roaster); return cr && (cr === r || cr.includes(r) || r.includes(cr)); });
    const rated = fromRoaster.filter((c) => scores[c.id]).map((c) => ({ coffee: c, avg: avg(scores[c.id].map((x) => x.s)), n: scores[c.id].length }))
      .sort((a, b) => b.avg - a.avg);
    if (fromRoaster.length) return { kind: "roaster", roaster: fromRoaster[0].roaster, rated, total: fromRoaster.length, overall: avg(rated.flatMap((x) => scores[x.coffee.id].map((y) => y.s))) };
  }
  return { kind: "none" };
}

function History({ h, people, onOpen }) {
  if (!h) return <div className="bv-card"><div className="sk" style={{ height: 18, width: "60%", marginBottom: 10 }} /><div className="sk" style={{ height: 14, width: "40%" }} /></div>;
  if (h.kind === "same") {
    const by = {};
    h.scores.forEach((x) => (by[x.user] ||= []).push(x.s));
    const a = avg(h.scores.map((x) => x.s));
    return (
      <div className="bv-card">
        <h3>The crew has had this one</h3>
        <button type="button" className="bv-coffee" onClick={() => onOpen(h.coffee)}>
          <Bowl coffee={h.coffee} size={48} photo img={coffeeImageUrl(h.coffee, "100x100")} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="tl-name" style={{ display: "block" }}>{h.coffee.name}</span>
            <span className="tl-sub">{h.coffee.roaster}</span>
          </span>
          {a ? <Score value={a} size={34} /> : <span className="tl-sub">No scores yet</span>}
        </button>
        {Object.keys(by).length > 0 && (
          <div className="bv-who">
            {Object.entries(by).map(([uid, arr]) => {
              const p = people.find((x) => x.id === uid);
              return <span key={uid}><span className="mdot" style={{ background: memberColor(p) }} />{p ? firstName(p) : "Someone"} <Score value={avg(arr)} size={22} /></span>;
            })}
          </div>
        )}
      </div>
    );
  }
  if (h.kind === "roaster") {
    return (
      <div className="bv-card">
        <h3>The crew on {h.roaster}</h3>
        {h.rated.length ? (
          <>
            <p className="bv-p">{h.rated.length} of their coffees scored, averaging <Score value={h.overall} size={24} />.</p>
            <ul className="bv-list">
              {h.rated.slice(0, 3).map((x) => (
                <li key={x.coffee.id}><button type="button" className="bv-coffee" onClick={() => onOpen(x.coffee)}>
                  <Bowl coffee={x.coffee} size={36} photo img={coffeeImageUrl(x.coffee, "100x100")} />
                  <span style={{ flex: 1, minWidth: 0 }} className="tl-name">{x.coffee.name}</span>
                  <Score value={x.avg} size={26} />
                </button></li>
              ))}
            </ul>
          </>
        ) : <p className="bv-p">{h.total} of their coffees are on the table, none scored yet.</p>}
      </div>
    );
  }
  return <div className="bv-card"><h3>New to the crew</h3><p className="bv-p">Nobody has logged this coffee or roaster yet, so the verdict leans on your palate overall.</p></div>;
}

export default function BuyVerdict({ file, startWithLink, onClose, onRetake }) {
  const { user } = useAuth();
  const { bumpData, openCoffee, crew, toast } = useNav();
  const [mode, setMode] = useState(startWithLink ? "link" : "photo");
  const [imageBlob, setImageBlob] = useState(null);
  const [preview, setPreview] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const people = crew?.members || (user ? [user] : []);

  const loadPalate = async () => {
    const hh = await getMyHousehold().catch(() => null);
    const ids = hh?.memberIds?.length ? hh.memberIds : [user.id];
    return palateSummary({ userId: user.id, memberIds: ids });
  };
  const after = (r) => { setResult(r); setHistory(null); crewHistory(r?.coffee).then(setHistory).catch(() => setHistory({ kind: "none" })); };

  const handlePhoto = async (f) => {
    if (!f || !f.type?.startsWith("image/")) { setErrMsg("That file isn't a photo. Try again with a picture of the bag."); return; }
    setErrMsg(""); setResult(null); setMode("photo");
    try {
      const { blob, base64 } = await compressImage(f);
      setImageBlob(blob); setPreview(URL.createObjectURL(blob));
      setBusy(true);
      after(await verdictFromImage(base64, await loadPalate()));
    } catch (err) {
      setErrMsg(err?.message === "NO_API_KEY" ? "Scanning needs an AI key. Add one in Settings, then try again."
        : err?.message?.includes("content filter") ? "The photo couldn't be read. Try a clearer, well-lit shot of the label."
          : "The photo couldn't be read. Try again, or paste the shop link instead.");
    } finally { setBusy(false); }
  };
  useEffect(() => { if (file) handlePhoto(file); /* eslint-disable-next-line */ }, [file]);

  const checkUrl = async () => {
    const link = url.trim();
    if (!link) return;
    setErrMsg(""); setResult(null); setBusy(true);
    try {
      const r = await verdictFromUrl(link, await loadPalate());
      after(r);
      if (r?.coffee?.image_url) {
        try {
          const blob = await fetchExternalImage(r.coffee.image_url);
          if (blob) { const { blob: cmp } = await compressImage(new File([blob], "from-link.jpg", { type: blob.type || "image/jpeg" })); setImageBlob(cmp); setPreview(URL.createObjectURL(cmp)); }
        } catch { /* the verdict still stands without a picture */ }
      }
    } catch (err) {
      setErrMsg(err?.message === "NO_API_KEY" ? "Checking links needs an AI key. Add one in Settings, then try again." : `That link couldn't be read${err?.message ? ` (${err.message})` : ""}. Try the product page itself.`);
    } finally { setBusy(false); }
  };

  const save = async ({ want }) => {
    if (!result?.coffee) return;
    setSaving(true);
    try {
      let coffee = history?.kind === "same" ? history.coffee : null;
      if (!coffee) {
        const c = result.coffee;
        coffee = await createCoffee({
          name: c.name || "", roaster: c.roaster || "", origin: flat(c.origin), region: c.region || "", producer: c.producer || "",
          varietal: flat(c.varietal), process: c.process || "", roastLevel: c.roastLevel || "", altitude: c.altitude || "",
          harvest: c.harvest || "", importer: c.importer || "", tags: c.tags || [], notes: c.notes || "",
        }, imageBlob);
      }
      if (want) await setWant(coffee.id, true);
      bumpData();
      onClose();
      toast(want ? "Circled: want to try" : "Added to the table");
      if (!want) openCoffee(coffee);
    } catch (err) {
      setErrMsg(err?.message ? `Couldn't save it: ${err.message}` : "Couldn't save it. Try again.");
      setSaving(false);
    }
  };

  const v = result?.verdict && VERDICT[result.verdict];
  const known = history?.kind === "same";

  return (
    <Sheet title="Should I buy it?" onClose={onClose} maxWidth={600}>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handlePhoto(f); }} />

      {mode === "photo" && !preview && !busy && (
        <div className="bv-start">
          <button type="button" className="btn btn-red btn-block" style={{ minHeight: 56 }} onClick={() => fileRef.current?.click()}><Icon name="camera" />Take a photo of the bag</button>
          <p className="hint" style={{ textAlign: "center" }}>Get the front label in frame: roaster, name and origin.</p>
          <button type="button" className="btn btn-quiet btn-block" onClick={() => setMode("link")}><Icon name="link" />Paste a shop link instead</button>
        </div>
      )}

      {mode === "link" && !result && (
        <form className="bv-link" onSubmit={(e) => { e.preventDefault(); checkUrl(); }}>
          <label className="field" style={{ marginBottom: 10 }}>
            <span className="label">Shop link</span>
            <input type="url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://roaster.com/shop/that-coffee" inputMode="url" />
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary" disabled={busy || !url.trim()}>{busy ? <><Spinner />Checking…</> : "Check it"}</button>
            <button type="button" className="btn btn-quiet" onClick={() => setMode("photo")}><Icon name="camera" />Use the camera</button>
          </div>
        </form>
      )}

      {preview && (
        <div className="bv-shot">
          <img src={preview} alt="The bag you scanned" />
          <div style={{ flex: 1, minWidth: 0 }}>
            {busy ? <div className="bv-busy"><Spinner />Reading the label and checking it against the crew…</div>
              : result?.coffee?.name ? <><div className="tl-name">{result.coffee.name}</div><div className="tl-sub">{[result.coffee.roaster, flat(result.coffee.origin)].filter(Boolean).join(" · ")}</div></>
                : null}
            {!busy && <button type="button" className="linkbtn" style={{ marginTop: 6, fontSize: 14 }} onClick={() => (onRetake ? (onClose(), onRetake()) : fileRef.current?.click())}>Take another photo</button>}
          </div>
        </div>
      )}

      {errMsg && <Slip style={{ marginTop: 14 }}>{errMsg}</Slip>}

      {result && !busy && (
        <>
          <History h={history} people={people} onOpen={(c) => { onClose(); openCoffee(c); }} />

          {v && (
            <div className="bv-verdict">
              <div className="bv-word" style={{ color: v.color }}>
                <span style={{ position: "relative", display: "inline-block", padding: "4px 16px", textDecoration: result.verdict === "skip" ? "line-through" : "none", textDecorationThickness: 3 }}>
                  {v.word}<Ring inset={-8} draw rotate={-6} />
                </span>
              </div>
              <p className="bv-line">{v.line}{result.confidence ? ` Confidence: ${result.confidence}.` : ""}</p>
              {result.reasoning && <p className="bv-p" style={{ marginTop: 10 }}>{result.reasoning}</p>}
              {(result.matches?.length > 0 || result.mismatches?.length > 0) && (
                <ul className="bv-reasons">
                  {result.matches?.map((m, i) => (
                    <li key={`m${i}`}><Icon name="check" style={{ color: "var(--buy)" }} /><span><b>{m.attr}:</b> {m.value}</span>
                      {typeof m.yourAvg === "number" && <span className="bv-r-score"><Score value={m.yourAvg} size={22} /><small>{m.n || 0} cups</small></span>}</li>
                  ))}
                  {result.mismatches?.map((m, i) => (
                    <li key={`x${i}`}><Icon name="alert" style={{ color: "var(--maybe)" }} /><span><b>{m.attr}:</b> {m.value}{m.note ? <span className="bv-note"> {m.note}</span> : null}</span></li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {result.coffee?.name && (
            <div className="bv-actions">
              <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save({ want: true })}><Icon name="want" />{saving ? "Saving…" : "Save as want to try"}</button>
              {known
                ? <button type="button" className="btn btn-line" onClick={() => { onClose(); openCoffee(history.coffee); }}>Open it</button>
                : <button type="button" className="btn btn-line" disabled={saving} onClick={() => save({ want: false })}><Icon name="plus" />Add to coffees</button>}
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
