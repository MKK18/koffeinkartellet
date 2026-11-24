// Pure helpers for the Cupping Table world: member colours, bowl tints,
// dates, averages, and how tastings group onto the timeline.

// ── Colour ────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(h)) return null;
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
}
function lum([r, g, b]) {
  const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrastOnWhite = (rgb) => 1.05 / (lum(rgb) + 0.05);
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

// Darken a colour until it reads as text on the white sheet (≥4.6:1).
export function inkSafe(hex, fallback = "#1f4a63") {
  let rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  for (let i = 0; i < 40 && contrastOnWhite(rgb) < 4.6; i++) rgb = rgb.map((v) => v * 0.92);
  return toHex(rgb);
}

// A member's colour, made legible on paper. Members without one get a stable
// pick from the crew palette.
const CREW = ["#2e6b52", "#3f5fc4", "#8a3f80", "#a24a14", "#1f6f7a", "#6b5a12"];
export function memberColor(user) {
  if (user?.color) return inkSafe(user.color);
  const id = String(user?.id || user?.name || "");
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CREW[h % CREW.length];
}
export const CREW_COLORS = CREW;

export function initial(user) {
  return (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();
}
export function firstName(user) {
  return (user?.name || "Someone").trim().split(/\s+/)[0];
}

// Bowl tint from the coffee's roast: what you'd see looking into the cup.
const BOWLS = {
  "Light": ["#a9784a", "#7d4e29"],
  "Light-Medium": ["#93633a", "#683f20"],
  "Medium": ["#7a4c28", "#4f2d15"],
  "Medium-Dark": ["#5a3519", "#36200e"],
  "Dark": ["#3a2312", "#1e1209"],
};
export function bowlTint(roast) {
  return BOWLS[roast] || ["#86593a", "#573519"];
}

// ── Numbers & dates ───────────────────────────────────────────────────────
export const avg = (arr) => (arr.length ? arr.reduce((a, x) => a + x, 0) / arr.length : null);
export const fmtScore = (n) => (n == null || Number.isNaN(Number(n)) ? "–" : Number(n).toFixed(1));

const parse = (s) => (s ? new Date(String(s).replace(" ", "T")) : null);
// tasted_on is a date the person chose; created is when they wrote it.
export const tastingDate = (t) => parse(t?.tasted_on) || parse(t?.created) || new Date(0);

const DF = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const DF_SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
// One date format everywhere: "14 Nov 2026" (year dropped when it's this year).
export function fmtDate(d) {
  const x = d instanceof Date ? d : parse(d);
  if (!x || Number.isNaN(x.getTime())) return "";
  return x.getFullYear() === new Date().getFullYear() ? DF_SHORT.format(x) : DF.format(x);
}

function startOfWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const MONTH_NY = new Intl.DateTimeFormat("en-GB", { month: "long" });

// Which heading a tasting sits under on the timeline.
export function bucketOf(date, now = new Date()) {
  const w0 = startOfWeek(now).getTime();
  const w = startOfWeek(date).getTime();
  const week = 7 * 864e5;
  if (w >= w0) return { key: "w0", label: "This week" };
  if (w >= w0 - week) return { key: "w1", label: "Last week" };
  if (w >= w0 - 2 * week) return { key: "w2", label: "Two weeks ago" };
  const label = date.getFullYear() === now.getFullYear() ? MONTH_NY.format(date) : MONTH.format(date);
  return { key: `m${date.getFullYear()}-${date.getMonth()}`, label };
}

// Group tastings into timeline entries: one entry per coffee per heading, with
// each member's latest score in that span and the freshest note.
export function timelineEntries(tastings, now = new Date()) {
  const sorted = [...tastings].sort((a, b) => tastingDate(b) - tastingDate(a) || String(b.created).localeCompare(String(a.created)));
  const groups = [];
  const byKey = new Map();
  for (const t of sorted) {
    const c = t.expand?.coffee;
    if (!c) continue;
    const d = tastingDate(t);
    const b = bucketOf(d, now);
    let g = byKey.get(b.key);
    if (!g) { g = { ...b, entries: [], byCoffee: new Map() }; byKey.set(b.key, g); groups.push(g); }
    let e = g.byCoffee.get(c.id);
    if (!e) { e = { coffee: c, latest: d, scores: {}, counts: {}, notes: [] }; g.byCoffee.set(c.id, e); g.entries.push(e); }
    const uid = t.user;
    if (e.scores[uid] == null) e.scores[uid] = Number(t.score);
    e.counts[uid] = (e.counts[uid] || 0) + 1;
    if (t.notes && t.notes.trim()) e.notes.push({ user: uid, text: t.notes.trim() });
  }
  return groups.map(({ byCoffee, ...g }) => g);
}

export const SPLIT_AT = 1.5;
export function spread(values) {
  const v = values.filter((x) => x != null && !Number.isNaN(x));
  return v.length > 1 ? Math.max(...v) - Math.min(...v) : 0;
}

// The crew's top cup: highest average over every tasting (ties → most rated).
export function topCoffeeId(tastings) {
  const by = {};
  tastings.forEach((t) => { const s = Number(t.score); if (s) (by[t.coffee] ||= []).push(s); });
  let best = null;
  Object.entries(by).forEach(([id, arr]) => {
    const a = avg(arr);
    if (!best || a > best.a || (a === best.a && arr.length > best.n)) best = { id, a, n: arr.length };
  });
  return best?.id || null;
}
