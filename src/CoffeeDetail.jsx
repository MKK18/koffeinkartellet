import { useState, useEffect } from "react";
import { C, sans, serif, fraunces, inputStyle, labelStyle, primaryBtn, ghostBtn } from "./ui.jsx";
import { Sheet, SectionHead, Pill, Spinner, SHEET_PAD_X_WIDE, SHEET_PAD_X_NARROW } from "./components.jsx";
import { useIsWide } from "./useMediaQuery.js";
import { TAG_EMOJI } from "./lib.js";
import { useAuth } from "./auth.jsx";
import { useNav } from "./nav.jsx";
import { listTastingsForCoffee, createTasting, updateTasting, deleteTasting, coffeeImageUrl } from "./data.js";

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{
        fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
        color: C.faint, fontFamily: sans, lineHeight: 1.3,
      }}>{label}</span>
      <span style={{
        fontSize: 14, fontFamily: sans, color: C.ink, lineHeight: 1.4,
      }}>{value}</span>
    </div>
  );
}

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_T = { score: 7, grind: "", brew_method: "", notes: "", tasted_on: today() };

export default function CoffeeDetail({ coffee, onClose, onEdit }) {
  const { user } = useAuth();
  const { openProfile, bumpData } = useNav();
  const wide = useIsWide();
  const padX = wide ? SHEET_PAD_X_WIDE : SHEET_PAD_X_NARROW;
  const [tastings, setTastings] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_T);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setTastings(await listTastingsForCoffee(coffee.id));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [coffee.id]);

  const scores = (tastings || []).map((t) => Number(t.score)).filter((s) => s > 0);
  const avg = scores.length ? (scores.reduce((a, x) => a + x, 0) / scores.length).toFixed(1) : null;

  // per-person averages
  const byPerson = {};
  (tastings || []).forEach((t) => {
    const u = t.expand?.user;
    if (!u) return;
    (byPerson[u.id] ||= { name: u.name, color: u.color || C.brown, scores: [] }).scores.push(Number(t.score));
  });

  const startAdd = () => { setDraft({ ...EMPTY_T }); setEditId(null); setAdding(true); };
  const startEdit = (t) => {
    setDraft({ score: t.score, grind: t.grind || "", brew_method: t.brew_method || "", notes: t.notes || "", tasted_on: (t.tasted_on || "").split(" ")[0] || today() });
    setEditId(t.id); setAdding(true);
  };
  const saveTasting = async () => {
    setBusy(true);
    try {
      const payload = { ...draft, coffee: coffee.id, grind: draft.grind === "" ? null : Number(draft.grind), score: Number(draft.score) };
      if (editId) await updateTasting(editId, payload);
      else await createTasting(payload);
      setAdding(false); setEditId(null);
      await load(); bumpData();
    } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!confirm("Remove this tasting?")) return;
    await deleteTasting(id); await load(); bumpData();
  };

  const img = coffeeImageUrl(coffee, "600x600");
  const personList = Object.values(byPerson);

  return (
    <Sheet onClose={onClose}>
      {/* ---- Close button (absolute, top-right) ---- */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16, zIndex: 3,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,250,242,0.85)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: C.muted, cursor: "pointer", lineHeight: 1,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}
      >&times;</button>

      {/* ---- Hero image ---- */}
      <div style={{
        // bleed to sheet edges — must match the sheet's actual padding so the
        // image doesn't overshoot and trigger a horizontal scrollbar
        margin: `${wide ? -28 : -20}px -${padX}px 0`,
        borderRadius: "20px 20px 0 0", overflow: "hidden",
      }}>
        {img ? (
          <div style={{ position: "relative", width: "100%", height: 200, background: C.tint }}>
            <img
              src={img} alt={coffee.name}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
              background: "linear-gradient(to top, rgba(255,250,242,1) 0%, rgba(255,250,242,0.6) 50%, transparent 100%)",
            }} />
          </div>
        ) : (
          <div style={{
            width: "100%", height: 120,
            background: "#ece3d5",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 56, opacity: 0.25, filter: "grayscale(0.3)" }}>☕</span>
          </div>
        )}
      </div>

      {/* ---- Title section ---- */}
      <div style={{ marginTop: img ? -4 : 20, position: "relative", zIndex: 1 }}>
        <h2 style={{
          margin: 0, fontFamily: serif, fontSize: 26, fontWeight: 700,
          color: C.ink, lineHeight: 1.15, letterSpacing: "-0.01em",
        }}>{coffee.name}</h2>
        {coffee.roaster && (
          <div style={{
            fontSize: 14, color: C.muted, marginTop: 5, fontFamily: sans,
          }}>{coffee.roaster}</div>
        )}
      </div>

      {/* ---- Score moment (espresso block) ---- */}
      {tastings !== null && (
        <div style={{
          margin: "22px 0", background: C.ink, borderRadius: 18,
          padding: "26px 24px", position: "relative", overflow: "hidden",
        }}>
          {/* faint ring stain */}
          <div aria-hidden="true" style={{
            position: "absolute", top: "-40%", right: "-12%", width: 220, height: 220,
            borderRadius: "50%", border: "12px solid rgba(255,248,240,0.05)",
          }} />
          <div style={{
            fontFamily: fraunces, fontStyle: "italic", fontWeight: 600,
            fontSize: 64, color: avg ? C.accent : "#5a4030", lineHeight: 0.9,
            letterSpacing: "-0.03em",
          }}>{avg || "—"}</div>
          <div style={{
            fontFamily: sans, fontSize: 10.5, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "#b89870", marginTop: 10,
          }}>
            {avg
              ? `Average  ✱  ${scores.length} ${scores.length === 1 ? "tasting" : "tastings"}`
              : "No tastings yet"}
          </div>

          {/* Per-person breakdown */}
          {personList.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", marginTop: 16 }}>
              {personList.map((p) => {
                const pAvg = (p.scores.reduce((a, x) => a + x, 0) / p.scores.length).toFixed(1);
                return (
                  <div key={p.name} style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                    <span style={{
                      fontFamily: sans, fontSize: 10.5, letterSpacing: "0.12em",
                      textTransform: "uppercase", color: p.color, fontWeight: 700,
                    }}>{p.name}</span>
                    <span style={{
                      fontFamily: fraunces, fontStyle: "italic", fontWeight: 600,
                      fontSize: 17, color: "#fff8f0",
                    }}>{pAvg}</span>
                    <span style={{ fontFamily: sans, fontSize: 10, color: "#7a6050" }}>({p.scores.length})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---- Metadata ---- */}
      {(() => {
        const facts = [
          { label: "Origin", value: [coffee.origin, coffee.region].filter(Boolean).join(", ") },
          { label: "Producer", value: coffee.producer },
          { label: "Varietal", value: coffee.varietal },
          { label: "Process", value: [coffee.process, coffee.roast_level].filter(Boolean).join("  ✱  ") },
          { label: "Altitude", value: coffee.altitude ? `${coffee.altitude} masl` : "" },
          { label: "Harvest", value: coffee.harvest },
        ].filter((f) => f.value);
        if (facts.length === 0) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {facts.map((f, i) => (
              <div key={f.label} style={{
                padding: "14px 0",
                borderTop: i === 0 ? `1px solid ${C.border}` : "none",
                borderBottom: `1px solid ${C.border}`,
              }}>
                <Fact label={f.label} value={f.value} />
              </div>
            ))}
          </div>
        );
      })()}

      {/* ---- Flavor tags ---- */}
      {coffee.tags?.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20,
        }}>
          {coffee.tags.map((t) => (
            <span key={t} style={{
              fontSize: 12, padding: "4px 12px", borderRadius: 999,
              fontFamily: sans, color: C.muted,
              border: `1px solid ${C.border}`, background: "transparent",
              lineHeight: 1.5,
            }}>{TAG_EMOJI[t] ? `${TAG_EMOJI[t]} ${t}` : t}</span>
          ))}
        </div>
      )}

      {/* ---- Bag notes ---- */}
      {coffee.bag_notes && (
        <div style={{
          margin: "24px 0",
          borderLeft: `2px solid ${C.accent}`,
          paddingLeft: 16,
          fontFamily: fraunces, fontStyle: "italic", fontSize: 17,
          color: "#5a4030", lineHeight: 1.55, letterSpacing: "-0.005em",
        }}>
          “{coffee.bag_notes}”
        </div>
      )}

      {/* ---- Tastings section ---- */}
      <SectionHead title="Tastings" />

      {tastings === null ? (
        <div style={{
          color: C.muted, fontFamily: sans, fontSize: 13,
          padding: 16, textAlign: "center",
        }}>
          <Spinner /> Loading...
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tastings.map((t, idx) => {
              const u = t.expand?.user || {};
              const mine = u.id === user?.id;
              const userColor = u.color || C.brown;
              return (
                <div key={t.id} style={{
                  padding: "16px 0",
                  borderBottom: idx < tastings.length - 1 ? `1px solid #ece3d5` : "none",
                }}>
                  {/* Top line: italic score + name + date */}
                  <div style={{
                    display: "flex", alignItems: "baseline", gap: 8,
                    fontFamily: sans,
                  }}>
                    <span style={{
                      fontFamily: fraunces, fontStyle: "italic", fontWeight: 600,
                      fontSize: 21, color: C.accent, lineHeight: 1, letterSpacing: "-0.02em",
                    }}>{Number(t.score).toFixed(1)}</span>
                    <span
                      onClick={() => u.id && openProfile(u.id)}
                      style={{
                        color: userColor, fontSize: 10.5, fontWeight: 700,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        cursor: u.id ? "pointer" : "default",
                      }}
                    >{u.name || "Someone"}</span>

                    <span style={{ flex: 1 }} />

                    {(t.tasted_on || "").split(" ")[0] && (
                      <span style={{
                        fontSize: 10.5, color: C.faint, fontFamily: sans, letterSpacing: "0.06em",
                      }}>{(t.tasted_on || "").split(" ")[0]}</span>
                    )}
                  </div>

                  {/* Grind / brew method */}
                  {(t.grind || t.brew_method) && (
                    <div style={{
                      fontSize: 10, color: C.muted, fontFamily: sans, marginTop: 7,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                    }}>
                      {[t.grind ? `Grind ${t.grind}` : null, t.brew_method].filter(Boolean).join("  ✱  ")}
                    </div>
                  )}

                  {/* Notes */}
                  {t.notes && (
                    <div style={{
                      fontSize: 15.5, color: C.ink, marginTop: 9,
                      fontFamily: fraunces, fontStyle: "italic",
                      lineHeight: 1.5, whiteSpace: "pre-wrap", letterSpacing: "-0.005em",
                    }}>“{t.notes}”</div>
                  )}

                  {/* Edit / delete (own tastings only) */}
                  {mine && (
                    <div style={{
                      display: "flex", gap: 12, marginTop: 8,
                      justifyContent: "flex-end",
                    }}>
                      <button
                        onClick={() => startEdit(t)}
                        style={{
                          background: "none", border: "none", padding: 0,
                          color: C.faint, cursor: "pointer", fontSize: 12,
                          fontFamily: sans,
                        }}
                      >edit</button>
                      <button
                        onClick={() => remove(t.id)}
                        style={{
                          background: "none", border: "none", padding: 0,
                          color: C.faint, cursor: "pointer", fontSize: 15,
                          lineHeight: 1,
                        }}
                      >&times;</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ---- Add / edit tasting form ---- */}
          {adding ? (
            <div style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
            }}>
              {/* Score slider */}
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", marginBottom: 10,
                }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Score</label>
                  <span style={{
                    fontFamily: fraunces, fontStyle: "italic", fontSize: 30, fontWeight: 600,
                    color: C.accent, lineHeight: 1, letterSpacing: "-0.02em",
                  }}>{Number(draft.score).toFixed(1)}<span style={{
                    fontFamily: sans, fontStyle: "normal", fontSize: 13, color: C.faint, fontWeight: 400, marginLeft: 4,
                  }}>/ 10</span></span>
                </div>
                <input
                  type="range" min="1" max="10" step="0.5"
                  value={draft.score}
                  onChange={(e) => setDraft((d) => ({ ...d, score: e.target.value }))}
                  style={{ width: "100%", accentColor: C.accent }}
                />
              </div>

              {/* Grind + Brew side by side */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 12, marginBottom: 14,
              }}>
                <div>
                  <label style={labelStyle}>Grind</label>
                  <input
                    style={inputStyle}
                    value={draft.grind}
                    onChange={(e) => setDraft((d) => ({ ...d, grind: e.target.value }))}
                    placeholder="e.g. 18"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Brew method</label>
                  <input
                    style={inputStyle}
                    value={draft.brew_method}
                    onChange={(e) => setDraft((d) => ({ ...d, brew_method: e.target.value }))}
                    placeholder="V60, Aeropress..."
                  />
                </div>
              </div>

              {/* Date */}
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                style={{ ...inputStyle, marginBottom: 14 }}
                value={draft.tasted_on}
                onChange={(e) => setDraft((d) => ({ ...d, tasted_on: e.target.value }))}
              />

              {/* Notes */}
              <label style={labelStyle}>Notes</label>
              <textarea
                style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginBottom: 16 }}
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="What stood out..."
              />

              {/* Buttons */}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { setAdding(false); setEditId(null); }} style={ghostBtn}>Cancel</button>
                <button onClick={saveTasting} disabled={busy} style={primaryBtn(!busy)}>
                  {busy ? "Saving..." : editId ? "Update tasting" : "Save tasting"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startAdd}
              style={{
                marginTop: 14, padding: 14, borderRadius: 14,
                border: `1.5px dashed ${C.border}`, background: "transparent",
                color: C.accent, fontFamily: sans, fontSize: 14, fontWeight: 600,
                cursor: "pointer", width: "100%",
              }}
            >+ Add tasting</button>
          )}
        </>
      )}

      {/* ---- Edit coffee button ---- */}
      <div style={{
        display: "flex", justifyContent: "center",
        marginTop: 24, paddingTop: 18,
        borderTop: `1px solid ${C.borderSoft}`,
      }}>
        <button onClick={onEdit} style={ghostBtn}>Edit coffee info</button>
      </div>
    </Sheet>
  );
}
