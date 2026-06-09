import { useState, useEffect } from "react";
import { C, sans, serif, inputStyle, labelStyle, primaryBtn, ghostBtn } from "./ui.jsx";
import { Sheet, SectionHead, Pill, Spinner } from "./components.jsx";
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
      {/* ── Hero image ─────────────────────────────────────── */}
      <div style={{ margin: "-28px -28px 0", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
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
              position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
              background: "linear-gradient(to top, rgba(255,250,242,0.95), transparent)",
            }} />
          </div>
        ) : (
          <div style={{
            width: "100%", height: 180,
            background: "linear-gradient(135deg, #f0e0cc 0%, #e8d0b8 40%, #dcc0a8 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 64, opacity: 0.5 }}>☕</span>
          </div>
        )}
      </div>

      {/* ── Title section ──────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        gap: 12, marginTop: img ? -8 : 16, position: "relative", zIndex: 1,
        paddingBottom: 4,
      }}>
        <div style={{ flex: 1 }}>
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
        <button
          onClick={onClose}
          style={{
            background: C.tint, border: `1px solid ${C.borderSoft}`,
            width: 34, height: 34, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: C.muted, cursor: "pointer", lineHeight: 1,
            flexShrink: 0, marginTop: 2,
          }}
        >&times;</button>
      </div>

      {/* ── Score panel (Vivino-inspired) ──────────────────── */}
      {tastings !== null && (
        <div style={{
          background: C.tint, border: `1px solid ${C.borderSoft}`,
          borderRadius: 16, padding: "18px 20px", marginTop: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Large average score */}
            <div style={{ textAlign: "center", minWidth: 68, flexShrink: 0 }}>
              <div style={{
                fontSize: 48, fontFamily: serif, fontWeight: 800,
                color: avg ? C.accent : "#d4c5b5", lineHeight: 1,
                letterSpacing: "-0.02em",
              }}>{avg || "—"}</div>
              {avg && (
                <div style={{
                  fontSize: 11, color: C.accent, fontFamily: sans,
                  letterSpacing: "0.08em", marginTop: 4, fontWeight: 600,
                }}>/ 10</div>
              )}
            </div>

            {/* Separator */}
            <div style={{
              width: 1, alignSelf: "stretch", background: C.border,
              margin: "4px 0", flexShrink: 0,
            }} />

            {/* Per-person breakdown */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {tastings.length === 0 ? (
                <span style={{
                  color: C.muted, fontFamily: sans, fontSize: 13, lineHeight: 1.5,
                }}>No tastings yet — brew a cup and log the first one below</span>
              ) : (
                <>
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8,
                  }}>
                    {personList.map((p) => {
                      const pAvg = (p.scores.reduce((a, x) => a + x, 0) / p.scores.length).toFixed(1);
                      return (
                        <div key={p.name} style={{
                          display: "flex", alignItems: "center", gap: 7,
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: p.color, display: "flex",
                            alignItems: "center", justifyContent: "center",
                            color: "#fff8f0", fontFamily: serif, fontWeight: 700,
                            fontSize: 14, lineHeight: 1,
                          }}>{pAvg}</div>
                          <div style={{
                            fontFamily: sans, fontSize: 12, color: p.color,
                            fontWeight: 600, lineHeight: 1.2,
                          }}>
                            {p.name}
                            <span style={{
                              color: C.faint, fontWeight: 400, marginLeft: 3,
                            }}>({p.scores.length})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{
                    fontSize: 12, color: C.muted, fontFamily: sans,
                  }}>
                    {tastings.length} {tastings.length === 1 ? "tasting" : "tastings"} total
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Metadata grid ──────────────────────────────────── */}
      {(() => {
        const facts = [
          { label: "Origin", value: [coffee.origin, coffee.region].filter(Boolean).join(", ") },
          { label: "Producer", value: coffee.producer },
          { label: "Varietal", value: coffee.varietal },
          { label: "Process", value: [coffee.process, coffee.roast_level].filter(Boolean).join(" · ") },
          { label: "Altitude", value: coffee.altitude ? `${coffee.altitude} masl` : "" },
          { label: "Harvest", value: coffee.harvest },
        ].filter((f) => f.value);
        if (facts.length === 0) return null;
        return (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px",
            marginTop: 20, padding: "16px 18px",
            background: C.card, border: `1px solid ${C.borderSoft}`,
            borderRadius: 14,
          }}>
            {facts.map((f) => <Fact key={f.label} label={f.label} value={f.value} />)}
          </div>
        );
      })()}

      {/* ── Flavor tags ────────────────────────────────────── */}
      {coffee.tags?.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 7, marginTop: 16,
        }}>
          {coffee.tags.map((t) => (
            <Pill key={t} green>{TAG_EMOJI[t] ? `${TAG_EMOJI[t]} ${t}` : t}</Pill>
          ))}
        </div>
      )}

      {/* ── Bag notes ──────────────────────────────────────── */}
      {coffee.bag_notes && (
        <div style={{
          marginTop: 16, padding: "14px 18px",
          borderLeft: `3px solid ${C.accent}`,
          background: C.tint, borderRadius: "0 12px 12px 0",
          fontFamily: sans, fontSize: 14, color: "#5a4030",
          lineHeight: 1.6, fontStyle: "italic",
        }}>
          {coffee.bag_notes}
        </div>
      )}

      {/* ── Tastings section ───────────────────────────────── */}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tastings.map((t) => {
              const u = t.expand?.user || {};
              const mine = u.id === user?.id;
              const userColor = u.color || C.brown;
              return (
                <div key={t.id} style={{
                  background: C.card, border: `1px solid ${C.borderSoft}`,
                  borderRadius: 14, overflow: "hidden",
                  display: "flex",
                }}>
                  {/* Left color bar */}
                  <div style={{
                    width: 3, flexShrink: 0, background: userColor,
                  }} />

                  <div style={{ flex: 1, padding: "14px 16px" }}>
                    {/* Top row: name, score, date */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      fontFamily: sans, marginBottom: 2,
                    }}>
                      <span
                        onClick={() => u.id && openProfile(u.id)}
                        style={{
                          color: userColor, fontWeight: 700, fontSize: 14,
                          cursor: u.id ? "pointer" : "default",
                        }}
                      >{u.name || "Someone"}</span>

                      <span style={{
                        fontFamily: serif, fontWeight: 700, fontSize: 22,
                        color: userColor, lineHeight: 1, marginLeft: 2,
                      }}>{Number(t.score).toFixed(1)}</span>
                      <span style={{
                        fontSize: 11, color: C.faint, alignSelf: "flex-end",
                        marginBottom: 2,
                      }}>/ 10</span>

                      <span style={{ flex: 1 }} />

                      {(t.tasted_on || "").split(" ")[0] && (
                        <span style={{
                          fontSize: 11, color: C.faint, fontFamily: sans,
                        }}>{(t.tasted_on || "").split(" ")[0]}</span>
                      )}
                    </div>

                    {/* Method tags */}
                    {(t.grind || t.brew_method) && (
                      <div style={{
                        display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap",
                      }}>
                        {t.grind && (
                          <span style={{
                            fontSize: 11, padding: "2px 10px", borderRadius: 10,
                            background: C.tint, color: C.muted,
                            border: `1px solid ${C.borderSoft}`, fontFamily: sans,
                          }}>Grind {t.grind}</span>
                        )}
                        {t.brew_method && (
                          <span style={{
                            fontSize: 11, padding: "2px 10px", borderRadius: 10,
                            background: C.tint, color: C.muted,
                            border: `1px solid ${C.borderSoft}`, fontFamily: sans,
                          }}>{t.brew_method}</span>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {t.notes && (
                      <div style={{
                        fontSize: 13, color: "#5a4030", marginTop: 8,
                        fontFamily: sans, lineHeight: 1.55, whiteSpace: "pre-wrap",
                      }}>{t.notes}</div>
                    )}

                    {/* Edit / delete (own tastings only) */}
                    {mine && (
                      <div style={{
                        display: "flex", gap: 4, marginTop: 8,
                        justifyContent: "flex-end",
                      }}>
                        <button
                          onClick={() => startEdit(t)}
                          style={{
                            background: "none", border: `1px solid ${C.borderSoft}`,
                            borderRadius: 8, padding: "3px 12px",
                            color: C.muted, cursor: "pointer", fontSize: 11,
                            fontFamily: sans,
                          }}
                        >edit</button>
                        <button
                          onClick={() => remove(t.id)}
                          style={{
                            background: "none", border: `1px solid ${C.borderSoft}`,
                            borderRadius: 8, padding: "3px 10px",
                            color: C.faint, cursor: "pointer", fontSize: 14,
                            lineHeight: 1,
                          }}
                        >&times;</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Add / edit tasting form ──────────────────────── */}
          {adding ? (
            <div style={{
              background: C.card, border: `2px solid ${user?.color || C.brown}`,
              borderRadius: 16, padding: 20, marginTop: 14,
            }}>
              {/* Score slider */}
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", marginBottom: 10,
                }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Score</label>
                  <span style={{
                    fontFamily: serif, fontSize: 28, fontWeight: 700,
                    color: user?.color || C.brown, lineHeight: 1,
                  }}>{Number(draft.score).toFixed(1)}<span style={{
                    fontSize: 14, color: C.faint, fontWeight: 400, marginLeft: 3,
                  }}>/ 10</span></span>
                </div>
                <input
                  type="range" min="1" max="10" step="0.5"
                  value={draft.score}
                  onChange={(e) => setDraft((d) => ({ ...d, score: e.target.value }))}
                  style={{ width: "100%", accentColor: user?.color || C.brown }}
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
                marginTop: 14, padding: "14px 18px", borderRadius: 14,
                border: `1.5px dashed ${C.accent}`, background: "transparent",
                color: C.accent, fontFamily: sans, fontSize: 14, fontWeight: 600,
                cursor: "pointer", width: "100%",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.tint}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >+ Add tasting</button>
          )}
        </>
      )}

      {/* ── Edit coffee button ─────────────────────────────── */}
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
