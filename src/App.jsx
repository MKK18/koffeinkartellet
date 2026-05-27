import { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import "./storage.js"; // installs window.storage (localStorage-backed)

const API_KEY_STORAGE = "anthropic-api-key";
const getApiKey = () => {
  try { return localStorage.getItem(API_KEY_STORAGE) || ""; } catch { return ""; }
};
const setApiKey = (k) => {
  try { k ? localStorage.setItem(API_KEY_STORAGE, k) : localStorage.removeItem(API_KEY_STORAGE); } catch {}
};

const PROCESSES = ["Washed", "Natural", "Anaerobic", "Honey", "Wet-Hulled", "Carbonic Maceration", "Other"];
const ROAST_LEVELS = ["Light", "Light-Medium", "Medium", "Medium-Dark", "Dark"];
const VARIETALS = ["Gesha/Geisha", "Bourbon", "Typica", "SL28", "SL34", "Caturra", "Catuai", "Heirloom / Ethiopian Landraces", "Pacamara", "Maragogipe", "Mundo Novo", "74110", "74112", "Other"];
const FLAVOR_TAGS = ["Fruity", "Floral", "Chocolatey", "Nutty", "Caramel", "Spicy", "Earthy", "Bright", "Funky", "Smoky", "Citrus", "Berry", "Stone Fruit", "Herbal", "Jasmine", "Rose", "Tropical", "Winey", "Juicy", "Clean", "Complex", "Savory"];
const COFFEE_COUNTRIES = [
  "Angola", "Bolivia", "Brazil", "Burundi", "Cameroon", "China", "Colombia",
  "Costa Rica", "Cuba", "Democratic Republic of the Congo", "Dominican Republic",
  "Ecuador", "El Salvador", "Ethiopia", "Gabon", "Ghana", "Guatemala", "Haiti",
  "Honduras", "India", "Indonesia", "Ivory Coast", "Jamaica", "Kenya", "Laos",
  "Madagascar", "Malawi", "Mexico", "Myanmar", "Nepal", "Nicaragua", "Nigeria",
  "Panama", "Papua New Guinea", "Peru", "Philippines", "Rwanda",
  "São Tomé and Príncipe", "Sierra Leone", "Sri Lanka", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Uganda", "USA (Hawaii)", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];

// Lat/lng positioned at the main coffee-growing region (not country centroid)
const COUNTRY_COORDS = {
  "Angola": [-12.5, 18.5], "Bolivia": [-16.3, -64.7], "Brazil": [-20, -45],
  "Burundi": [-3.4, 29.9], "Cameroon": [5.5, 11], "China": [24, 101],
  "Colombia": [4, -75], "Costa Rica": [9.9, -84], "Cuba": [21.5, -77.8],
  "Democratic Republic of the Congo": [-4, 22], "Dominican Republic": [18.7, -70.2],
  "Ecuador": [-1.8, -78.2], "El Salvador": [13.8, -88.9], "Ethiopia": [9, 38],
  "Gabon": [-0.8, 11.6], "Ghana": [7.9, -1], "Guatemala": [15.5, -90.2],
  "Haiti": [18.9, -72.3], "Honduras": [15.2, -86.2], "India": [13, 76],
  "Indonesia": [-0.8, 113.9], "Ivory Coast": [7.5, -5.5], "Jamaica": [18.1, -77.3],
  "Kenya": [-0.5, 37], "Laos": [19.9, 102.5], "Madagascar": [-18.8, 46.9],
  "Malawi": [-13.3, 34.3], "Mexico": [16, -92], "Myanmar": [21.9, 95.9],
  "Nepal": [28, 84], "Nicaragua": [12.9, -85.2], "Nigeria": [9.1, 8.7],
  "Panama": [8.5, -80.8], "Papua New Guinea": [-6.3, 143.9], "Peru": [-9, -75],
  "Philippines": [12.9, 121.8], "Rwanda": [-1.9, 29.9], "São Tomé and Príncipe": [0.2, 6.6],
  "Sierra Leone": [8.5, -11.8], "Sri Lanka": [7, 81], "Tanzania": [-6.4, 34.9],
  "Thailand": [15.9, 100], "Timor-Leste": [-8.9, 125.7], "Togo": [8.6, 0.8],
  "Uganda": [1.4, 32.3], "USA (Hawaii)": [20, -155], "Venezuela": [6.4, -66.6],
  "Vietnam": [14.1, 108.3], "Yemen": [15.6, 48.5], "Zambia": [-13.1, 27.8],
  "Zimbabwe": [-19, 29.2],
};

const EMPTY_BEAN = {
  id: null, name: "", roaster: "", origin: "", region: "", producer: "",
  varietal: "", process: "", roastLevel: "", altitude: "", harvest: "",
  importer: "", tags: [], notes: "", date: "", image: "",
  ratings: [],
};

const EMPTY_RATING = {
  id: null, rater: "", score: 7, grind: "", notes: "", date: "",
};

const RATERS = [
  { name: "Kiki", color: "#C0704A" },
  { name: "Madsy", color: "#4A7A90" },
];

const raterColor = (name) => RATERS.find(r => r.name === name)?.color || "#8a7060";

// Migrate old beans with kikiscore/madsyscore/kikiNotes/madsyNotes into ratings[]
function migrateBeans(beans) {
  return beans.map(b => {
    if (b.ratings) return b;
    const ratings = [];
    if (b.kikiscore) ratings.push({ id: `mig-k-${b.id}`, rater: "Kiki", score: b.kikiscore, grind: "", notes: b.kikiNotes || "", date: b.date || "" });
    if (b.madsyscore) ratings.push({ id: `mig-m-${b.id}`, rater: "Madsy", score: b.madsyscore, grind: "", notes: b.madsyNotes || "", date: b.date || "" });
    const { kikiscore, madsyscore, kikiNotes, madsyNotes, ...rest } = b;
    return { ...rest, ratings };
  });
}

function buildSampleBeans() {
  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  };
  return [
    {
      id: "sample-1",
      name: "Daye Bensa Bombe",
      roaster: "DAK Coffee Roasters",
      origin: "Ethiopia", region: "Sidamo, Bensa", producer: "Daye Bensa",
      varietal: "Heirloom / Ethiopian Landraces", process: "Natural",
      roastLevel: "Light", altitude: "1900-2150",
      harvest: "Nov 2024 – Jan 2025", importer: "Collaborative Coffee Source",
      tags: ["Fruity", "Berry", "Floral", "Jasmine"],
      notes: "Stunning natural from the Bensa family. Bag promises strawberry jam, jasmine, and white grape — a textbook Yirg with a velvety body.",
      date: daysAgo(28), image: "",
      ratings: [
        { id: "s1-r1", rater: "Kiki", score: 8.5, grind: 3, notes: "V60 standard recipe. Strawberry jam, exactly as advertised. Mouthfeel a bit thin — going finer next time.", date: daysAgo(25) },
        { id: "s1-r2", rater: "Madsy", score: 8.5, grind: 2, notes: "Inverted Aeropress, 90°C, 1:14. The florals woke up. Tastes like a flower shop in the best way.", date: daysAgo(20) },
        { id: "s1-r3", rater: "Kiki", score: 9, grind: 2, notes: "Finer = unlocked. Sweetness exploded. This is the one.", date: daysAgo(12) },
      ],
    },
    {
      id: "sample-2",
      name: "Kieni AA",
      roaster: "Coffee Collective",
      origin: "Kenya", region: "Nyeri", producer: "Kieni Factory",
      varietal: "SL28", process: "Washed",
      roastLevel: "Light-Medium", altitude: "1700-1900",
      harvest: "Nov 2024 – Jan 2025", importer: "Coffee Collective Direct Trade",
      tags: ["Bright", "Berry", "Juicy", "Complex", "Winey"],
      notes: "Classic Nyeri. Blackcurrant, tomato, dense sugar. The kind of acidity that makes you sit up straighter.",
      date: daysAgo(14), image: "",
      ratings: [
        { id: "s2-r1", rater: "Madsy", score: 9, grind: 3, notes: "Blackcurrant for days. V60, 1:16. Closer to a young Chianti than a coffee, somehow.", date: daysAgo(10) },
      ],
    },
    {
      id: "sample-3",
      name: "Hartmann Geisha",
      roaster: "La Cabra",
      origin: "Panama", region: "Volcán, Chiriquí", producer: "Finca Hartmann",
      varietal: "Gesha/Geisha", process: "Washed",
      roastLevel: "Light", altitude: "1700-1900",
      harvest: "Feb 2025", importer: "Direct",
      tags: ["Floral", "Jasmine", "Tropical", "Clean", "Bright"],
      notes: "Hartmann is one of the OG Geisha producers in Panama. Bag promises bergamot, jasmine tea, white peach.",
      date: daysAgo(21), image: "",
      ratings: [
        { id: "s3-r1", rater: "Kiki", score: 9, grind: 2, notes: "Bergamot is INSANE. Earl Grey with stone fruit on top. V60, 1:16.", date: daysAgo(18) },
        { id: "s3-r2", rater: "Madsy", score: 9.5, grind: 2, notes: "Possibly the best cup of the year. Jasmine front, peach middle, sweetness that won't leave. Pushed water to 92°C.", date: daysAgo(15) },
        { id: "s3-r3", rater: "Madsy", score: 7.5, grind: 4, notes: "Tried coarser to see if I could ruin it. I could.", date: daysAgo(8) },
      ],
    },
    {
      id: "sample-4",
      name: "Las Margaritas Anaerobic",
      roaster: "April Coffee Roasters",
      origin: "Colombia", region: "Huila", producer: "Las Margaritas",
      varietal: "Caturra", process: "Anaerobic",
      roastLevel: "Light", altitude: "1750",
      harvest: "Aug 2024", importer: "",
      tags: ["Funky", "Winey", "Tropical", "Complex", "Berry"],
      notes: "72-hour anaerobic. Bag warns it's 'an experience' — boozy mango, lychee, raspberry.",
      date: daysAgo(7), image: "",
      ratings: [
        { id: "s4-r1", rater: "Madsy", score: 8, grind: 3, notes: "Funky as advertised. Lychee comes through fine. The boozy finish is doing the most.", date: daysAgo(5) },
      ],
    },
    {
      id: "sample-5",
      name: "El Paraíso Honey",
      roaster: "Manhattan Coffee Roasters",
      origin: "Colombia", region: "Cauca", producer: "El Paraíso (Diego Bermúdez)",
      varietal: "Catuai", process: "Honey",
      roastLevel: "Light-Medium", altitude: "1850",
      harvest: "May 2025", importer: "",
      tags: ["Caramel", "Chocolatey", "Stone Fruit", "Clean"],
      notes: "Just opened. Bag promises apricot, caramel, dark chocolate. Looks like a comfort cup.",
      date: daysAgo(2), image: "",
      ratings: [],
    },
  ];
}

// Compress image to base64 JPEG, max 1024px, quality 0.75
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxSize = 1024;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round((height / width) * maxSize); width = maxSize; }
        else { width = Math.round((width / height) * maxSize); height = maxSize; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75).split(",")[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function extractBeanFromImage(base64) {
  const prompt = `You are a specialty coffee expert. Examine this coffee packaging image carefully.

First, extract everything visible on the package (name, roaster, origin, region/area, producer/farm, varietal/cultivar, process, roast level, altitude, harvest season, importer, tasting notes/flavor descriptors).

Then use web_search to look up this specific coffee to fill in any details not visible on the package (e.g. exact altitude, importer, varietal, harvest details).

Respond ONLY with a valid JSON object — no markdown, no explanation, no backticks. Use exactly these keys:
{
  "name": "the coffee's name as on the bag",
  "roaster": "roaster name",
  "origin": "country",
  "region": "specific region/area",
  "producer": "farm or producer name",
  "varietal": "one of: Gesha/Geisha, Bourbon, Typica, SL28, SL34, Caturra, Catuai, Heirloom / Ethiopian Landraces, Pacamara, Maragogipe, Mundo Novo, 74110, 74112, Other",
  "process": "one of: Washed, Natural, Anaerobic, Honey, Wet-Hulled, Carbonic Maceration, Other",
  "roastLevel": "one of: Light, Light-Medium, Medium, Medium-Dark, Dark",
  "altitude": "altitude range e.g. 1800-2200",
  "harvest": "harvest season e.g. Nov 2024",
  "importer": "importer name if known",
  "tags": ["array", "of", "flavor", "tags", "from this list only: Fruity, Floral, Chocolatey, Nutty, Caramel, Spicy, Earthy, Bright, Funky, Smoky, Citrus, Berry, Stone Fruit, Herbal, Jasmine, Rose, Tropical, Winey, Juicy, Clean, Complex, Savory"],
  "notes": "tasting notes from the bag or from your search"
}
Use empty string "" for unknown string fields. Use [] for unknown tags.`;

  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          { type: "text", text: prompt }
        ]
      }]
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();

  // Find the last text block (after any tool use)
  const textBlocks = data.content.filter(b => b.type === "text");
  const raw = textBlocks[textBlocks.length - 1]?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  // Extract JSON object
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

// ── UI Components ─────────────────────────────────────────

function ScoreCircle({ score, name, color }) {
  const r = 28, circ = 2 * Math.PI * r, pct = score ? (score / 10) * circ : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e8ddd0" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${pct} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)" style={{ transition: "stroke-dasharray 0.5s ease" }} />
        <text x="36" y="40" textAnchor="middle" fill={score ? color : "#c5b9aa"}
          style={{ fontSize: score ? 18 : 13, fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          {score || "—"}
        </text>
      </svg>
      <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7060", fontFamily: "'DM Sans', sans-serif" }}>{name}</span>
    </div>
  );
}

function Tag({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", borderRadius: 20, fontSize: 12,
      fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em",
      border: active ? "1.5px solid #8B5E3C" : "1.5px solid #d4c5b5",
      background: active ? "#8B5E3C" : "transparent",
      color: active ? "#fff8f0" : "#8a7060",
      cursor: "pointer", transition: "all 0.15s ease"
    }}>{label}</button>
  );
}

function Pill({ children, green, awaiting, color }) {
  if (awaiting) {
    return (
      <span style={{
        fontSize: 11, padding: "1px 9px", borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
        background: "transparent", color, border: `1px dashed ${color}`,
        letterSpacing: "0.02em"
      }}>{children}</span>
    );
  }
  return (
    <span style={{
      fontSize: 11, padding: "2px 10px", borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
      background: green ? "#e8f0e8" : "#f0e6da", color: green ? "#3a6040" : "#6b4226"
    }}>{children}</span>
  );
}

function CountryCombobox({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef();

  useEffect(() => {
    const onDocDown = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const q = (value || "").toLowerCase().trim();
  const filtered = q
    ? COFFEE_COUNTRIES.filter(c => c.toLowerCase().includes(q))
    : COFFEE_COUNTRIES;
  const exactMatch = filtered.length === 1 && filtered[0].toLowerCase() === q;

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <input
        type="text"
        value={value || ""}
        placeholder={placeholder || ""}
        onFocus={() => setOpen(true)}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "Enter" && filtered.length > 0) {
            e.preventDefault();
            onChange(filtered[0]);
            setOpen(false);
          }
        }}
        style={{
          width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e0d0c0",
          background: "#fff8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          color: "#2c1a0e", outline: "none", boxSizing: "border-box"
        }}
      />
      {open && filtered.length > 0 && !exactMatch && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff8f0", border: "1.5px solid #e0d0c0", borderRadius: 10,
          maxHeight: 220, overflowY: "auto", zIndex: 20,
          boxShadow: "0 8px 20px rgba(100,70,40,0.14)"
        }}>
          {filtered.map(c => {
            const isSelected = c.toLowerCase() === q;
            return (
              <div key={c}
                onMouseDown={(e) => { e.preventDefault(); onChange(c); setOpen(false); }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#fbeee4"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                style={{
                  padding: "8px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  color: isSelected ? "#8B5E3C" : "#2c1a0e",
                  background: isSelected ? "#fbeee4" : "transparent",
                  fontWeight: isSelected ? 600 : 400,
                  cursor: "pointer"
                }}>
                {c}
              </div>
            );
          })}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff8f0", border: "1.5px solid #e0d0c0", borderRadius: 10,
          padding: "10px 14px", fontSize: 13, color: "#a08878",
          fontFamily: "'DM Sans', sans-serif", fontStyle: "italic", zIndex: 20,
          boxShadow: "0 8px 20px rgba(100,70,40,0.14)"
        }}>
          No matches — your text will be kept
        </div>
      )}
    </div>
  );
}

function BeanCard({ bean, onClick }) {
  const ratings = bean.ratings || [];
  const kiScores = ratings.filter(r => r.rater === "Kiki" && r.score).map(r => Number(r.score));
  const maScores = ratings.filter(r => r.rater === "Madsy" && r.score).map(r => Number(r.score));
  const allScores = ratings.map(r => Number(r.score)).filter(s => !isNaN(s) && s > 0);
  const score = allScores.length ? (allScores.reduce((a, x) => a + x, 0) / allScores.length).toFixed(1) : null;
  const hasKi = kiScores.length > 0;
  const hasMa = maScores.length > 0;
  const both = hasKi && hasMa;
  const onlyKi = hasKi && !hasMa;
  const onlyMa = !hasKi && hasMa;
  const scoreLabel = both ? "AVG" : onlyKi ? "KIKI" : onlyMa ? "MADSY" : null;
  const scoreColor = both ? "#8B5E3C" : onlyKi ? "#C0704A" : onlyMa ? "#4A7A90" : "#d4c5b5";
  const tastingCount = ratings.length;

  return (
    <div onClick={onClick} style={{
      background: "#fff8f0", border: "1px solid #e8ddd0", borderRadius: 16,
      overflow: "hidden", cursor: "pointer",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
      boxShadow: "0 2px 8px rgba(100,70,40,0.06)"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(100,70,40,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(100,70,40,0.06)"; }}
    >
      <div style={{ display: "flex" }}>
        {/* Package image or placeholder */}
        <div style={{
          width: 88, minHeight: 100, flexShrink: 0,
          background: bean.image ? "transparent" : "#f0e6da",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden"
        }}>
          {bean.image
            ? <img src={`data:image/jpeg;base64,${bean.image}`} alt="package"
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 28 }}>☕</span>
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#2c1a0e", lineHeight: 1.2 }}>{bean.name || "Unnamed Bean"}</div>
              <div style={{ fontSize: 12, color: "#8a7060", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>
                {[bean.roaster, [bean.origin, bean.region].filter(Boolean).join(", "), bean.producer].filter(Boolean).join(" · ")}
              </div>
              {(bean.varietal || bean.altitude) && (
                <div style={{ fontSize: 11, color: "#a08878", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                  {[bean.varietal, bean.altitude ? `${bean.altitude} masl` : null].filter(Boolean).join(" · ")}
                </div>
              )}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                {bean.process && <Pill>{bean.process}</Pill>}
                {bean.roastLevel && <Pill>{bean.roastLevel}</Pill>}
                {bean.tags?.slice(0, 2).map(t => <Pill key={t} green>{t}</Pill>)}
                {onlyKi && <Pill awaiting color="#4A7A90">Awaiting Madsy</Pill>}
                {onlyMa && <Pill awaiting color="#C0704A">Awaiting Kiki</Pill>}
              </div>
            </div>
            <div style={{ marginLeft: 12, textAlign: "center", flexShrink: 0 }}>
              {score ? (
                <>
                  <div style={{ fontSize: 24, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: 9, color: scoreColor, opacity: 0.7, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em" }}>{scoreLabel}</div>
                  {tastingCount > 1 && (
                    <div style={{ fontSize: 9, color: "#b89880", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{tastingCount} tastings</div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 20, color: "#d4c5b5", fontFamily: "'Playfair Display', serif" }}>—</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TastingCard({ rating, onEdit, onDelete }) {
  const color = raterColor(rating.rater);
  return (
    <div onClick={onEdit} style={{
      background: "#fdf4ee", border: `1px solid #f0e0d0`, borderLeft: `4px solid ${color}`,
      borderRadius: 10, padding: "12px 14px", cursor: "pointer",
      transition: "background 0.15s"
    }}
      onMouseEnter={e => e.currentTarget.style.background = "#fbeee4"}
      onMouseLeave={e => e.currentTarget.style.background = "#fdf4ee"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{rating.rater}</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color }}>{rating.score}</span>
        <span style={{ fontSize: 11, color: "#a08878" }}>/ 10</span>
        {rating.grind && (
          <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 10, background: "#fff8f0", color: "#8a7060", border: "1px solid #e0d0c0" }}>
            Grind {rating.grind}
          </span>
        )}
        <span style={{ flex: 1 }} />
        {rating.date && <span style={{ fontSize: 11, color: "#a08878" }}>{rating.date}</span>}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", color: "#b89880", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
      </div>
      {rating.notes && (
        <div style={{ fontSize: 12, color: "#5a4030", marginTop: 6, fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap" }}>{rating.notes}</div>
      )}
    </div>
  );
}

function TastingForm({ rating, onSave, onCancel }) {
  const [r, setR] = useState(rating);
  const set = (k, v) => setR(prev => ({ ...prev, [k]: v }));
  const valid = r.rater && r.score;
  const color = raterColor(r.rater);

  const inpStyle = {
    width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e0d0c0",
    background: "#fff8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: "#2c1a0e", outline: "none", boxSizing: "border-box"
  };
  const lblStyle = { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", marginBottom: 6, display: "block" };

  return (
    <div style={{
      background: "#fff8f0", border: `2px solid ${r.rater ? color : "#e0d0c0"}`,
      borderRadius: 14, padding: 16, transition: "border-color 0.2s"
    }}>
      {/* Rater toggle */}
      <label style={lblStyle}>Who's tasting?</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {RATERS.map(({ name, color: c }) => (
          <button key={name} onClick={() => set("rater", name)} style={{
            flex: 1, padding: "9px 14px", borderRadius: 10,
            border: `1.5px solid ${r.rater === name ? c : "#e0d0c0"}`,
            background: r.rater === name ? c : "transparent",
            color: r.rater === name ? "#fff8f0" : "#8a7060",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s"
          }}>{name}</button>
        ))}
      </div>

      {/* Score */}
      <label style={lblStyle}>Score</label>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <ScoreCircle score={r.score} name="" color={color} />
        <div style={{ flex: 1 }}>
          <input type="range" min="1" max="10" step="0.5" value={r.score || 5}
            onChange={e => set("score", e.target.value)}
            style={{ width: "100%", accentColor: color }} />
          <div style={{ fontSize: 11, color: "#b89880", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
            {r.score ? `${r.score} / 10` : "Drag to score"}
          </div>
        </div>
      </div>

      {/* Grind */}
      <label style={lblStyle}>Grind setting</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map(g => (
          <button key={g} onClick={() => set("grind", r.grind === g ? "" : g)} style={{
            flex: 1, padding: "9px 0", borderRadius: 10,
            border: `1.5px solid ${r.grind === g ? color : "#e0d0c0"}`,
            background: r.grind === g ? color : "transparent",
            color: r.grind === g ? "#fff8f0" : "#8a7060",
            fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s"
          }}>{g}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b89880", fontFamily: "'DM Sans', sans-serif", marginBottom: 14, padding: "0 4px" }}>
        <span>fine</span><span>coarse</span>
      </div>

      {/* Date */}
      <label style={lblStyle}>Date</label>
      <input type="date" value={r.date} onChange={e => set("date", e.target.value)} style={{ ...inpStyle, marginBottom: 14 }} />

      {/* Notes */}
      <label style={lblStyle}>Notes</label>
      <textarea value={r.notes} onChange={e => set("notes", e.target.value)}
        placeholder="Brew method, impressions, what stood out..."
        style={{ ...inpStyle, minHeight: 60, resize: "vertical", marginBottom: 14 }} />

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{
          padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e0d0c0",
          background: "transparent", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer"
        }}>Cancel</button>
        <button onClick={() => valid && onSave(r)} disabled={!valid} style={{
          padding: "8px 18px", borderRadius: 10, border: "none",
          background: valid ? color : "#d4c5b5",
          color: "#fff8f0", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
          cursor: valid ? "pointer" : "not-allowed"
        }}>Save Tasting</button>
      </div>
    </div>
  );
}

function TastingsSection({ ratings, onChange }) {
  const [active, setActive] = useState(null); // null | { rating, isNew }

  const upsert = (r) => {
    const withId = r.id ? r : { ...r, id: Date.now() + Math.random() };
    const exists = ratings.some(x => x.id === withId.id);
    onChange(exists ? ratings.map(x => x.id === withId.id ? withId : x) : [...ratings, withId]);
    setActive(null);
  };

  const remove = (id) => {
    if (!confirm("Remove this tasting?")) return;
    onChange(ratings.filter(r => r.id !== id));
    if (active?.rating?.id === id) setActive(null);
  };

  const sorted = [...ratings].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.length === 0 && !active && (
        <div style={{ textAlign: "center", padding: "20px 16px", color: "#b89880", fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: "#fdf4ee", borderRadius: 10, border: "1.5px dashed #e0d0c0" }}>
          No tastings yet — add one when you brew it
        </div>
      )}
      {sorted.map(r => (
        active?.rating?.id === r.id
          ? <TastingForm key={r.id} rating={active.rating} onSave={upsert} onCancel={() => setActive(null)} />
          : <TastingCard key={r.id} rating={r} onEdit={() => setActive({ rating: r, isNew: false })} onDelete={() => remove(r.id)} />
      ))}
      {active?.isNew && (
        <TastingForm rating={active.rating} onSave={upsert} onCancel={() => setActive(null)} />
      )}
      {!active && (
        <button onClick={() => setActive({ rating: { ...EMPTY_RATING, date: new Date().toISOString().split("T")[0] }, isNew: true })}
          style={{
            padding: "10px 14px", borderRadius: 10, border: "1.5px dashed #8B5E3C",
            background: "transparent", color: "#8B5E3C", fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 2
          }}>+ Add Tasting</button>
      )}
    </div>
  );
}

function SectionHead({ title }) {
  return <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b89880", fontFamily: "'DM Sans', sans-serif", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #ecddd0", marginTop: 20 }}>{title}</div>;
}

function Spinner() {
  return (
    <div style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #e0d0c0", borderTopColor: "#8B5E3C", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#3a2010", lineHeight: 1.5 }}>
      <span style={{ color: "#b89880", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 70, paddingTop: 2 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function BeanViewMode({ bean, onRatingsChange, onEdit, onDelete, onClose }) {
  const ratings = bean.ratings || [];
  const ki = ratings.filter(r => r.rater === "Kiki" && r.score).map(r => Number(r.score));
  const ma = ratings.filter(r => r.rater === "Madsy" && r.score).map(r => Number(r.score));
  const all = ratings.map(r => Number(r.score)).filter(s => !isNaN(s) && s > 0);
  const score = all.length ? (all.reduce((a, x) => a + x, 0) / all.length).toFixed(1) : null;
  const both = ki.length > 0 && ma.length > 0;
  const onlyKi = ki.length > 0 && ma.length === 0;
  const onlyMa = ma.length > 0 && ki.length === 0;
  const scoreLabel = both ? "AVG" : onlyKi ? "KIKI" : onlyMa ? "MADSY" : null;
  const scoreColor = both ? "#8B5E3C" : onlyKi ? "#C0704A" : onlyMa ? "#4A7A90" : "#d4c5b5";
  const kiAvg = ki.length ? (ki.reduce((a, x) => a + x, 0) / ki.length).toFixed(1) : null;
  const maAvg = ma.length ? (ma.reduce((a, x) => a + x, 0) / ma.length).toFixed(1) : null;

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#2c1a0e", lineHeight: 1.2 }}>
            {bean.name || "Unnamed Bean"}
          </h2>
          {bean.roaster && (
            <div style={{ fontSize: 13, color: "#8a7060", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              {bean.roaster}
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: "#8a7060", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {/* Bean summary card */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
        {bean.image ? (
          <img src={`data:image/jpeg;base64,${bean.image}`} alt="package"
            style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 12, flexShrink: 0, border: "1.5px solid #e0d0c0" }} />
        ) : (
          <div style={{ width: 110, height: 110, background: "#f0e6da", borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #e0d0c0" }}>
            <span style={{ fontSize: 36 }}>☕</span>
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <Fact label="Origin" value={[bean.origin, bean.region].filter(Boolean).join(", ")} />
          <Fact label="Producer" value={bean.producer} />
          <Fact label="Varietal" value={bean.varietal} />
          <Fact label="Process" value={[bean.process, bean.roastLevel].filter(Boolean).join(" · ")} />
          <Fact label="Altitude" value={bean.altitude ? `${bean.altitude} masl` : ""} />
          <Fact label="Harvest" value={bean.harvest} />
        </div>
      </div>

      {/* Flavor tags */}
      {bean.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
          {bean.tags.map(t => <Pill key={t} green>{t}</Pill>)}
        </div>
      )}

      {/* Bag notes */}
      {bean.notes && (
        <div style={{ fontSize: 13, color: "#5a4030", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55, fontStyle: "italic", padding: "12px 14px", background: "#fdf4ee", borderRadius: 10, borderLeft: "3px solid #d4b896", marginTop: 14 }}>
          {bean.notes}
        </div>
      )}

      {/* Score panel */}
      <SectionHead title="Tastings" />
      <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fdf4ee", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f0e0d0", marginBottom: 14 }}>
        <div style={{ textAlign: "center", flexShrink: 0, minWidth: 70 }}>
          {score ? (
            <>
              <div style={{ fontSize: 42, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 10, color: scoreColor, opacity: 0.75, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.12em", marginTop: 3 }}>{scoreLabel}</div>
            </>
          ) : (
            <div style={{ fontSize: 36, color: "#d4c5b5", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>—</div>
          )}
        </div>
        <div style={{ flex: 1, fontSize: 13, color: "#5a4030", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
          {ratings.length === 0 ? (
            <div style={{ color: "#8a7060" }}>No tastings yet. Brew a cup and add your first vote ↓</div>
          ) : (
            <>
              <div style={{ fontWeight: 600 }}>{ratings.length} {ratings.length === 1 ? "tasting" : "tastings"}</div>
              {kiAvg && <div style={{ color: "#C0704A" }}>Kiki · {kiAvg} <span style={{ color: "#b89880" }}>({ki.length})</span></div>}
              {maAvg && <div style={{ color: "#4A7A90" }}>Madsy · {maAvg} <span style={{ color: "#b89880" }}>({ma.length})</span></div>}
              {onlyKi && <div style={{ fontSize: 12, color: "#4A7A90", marginTop: 4, fontStyle: "italic" }}>Awaiting Madsy</div>}
              {onlyMa && <div style={{ fontSize: 12, color: "#C0704A", marginTop: 4, fontStyle: "italic" }}>Awaiting Kiki</div>}
            </>
          )}
        </div>
      </div>

      {/* Tastings list + Add */}
      <TastingsSection ratings={ratings} onChange={onRatingsChange} />

      {/* Footer */}
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid #ecddd0" }}>
        <button onClick={onDelete} style={{
          padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e0c0b0",
          background: "transparent", color: "#b07060", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer"
        }}>Delete</button>
        <button onClick={onEdit} style={{
          padding: "9px 18px", borderRadius: 10, border: "1.5px solid #8B5E3C",
          background: "transparent", color: "#8B5E3C", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>✎ Edit Bean Info</button>
      </div>
    </>
  );
}

function Modal({ bean, onClose, onSave, onDelete }) {
  const isNewBean = !bean.id;
  const [mode, setMode] = useState(isNewBean ? 'edit' : 'view');
  const initialForm = { ...EMPTY_BEAN, ...bean, ratings: bean.ratings || [], date: bean.date || new Date().toISOString().split("T")[0] };
  const [form, setForm] = useState(initialForm);
  const [pristine, setPristine] = useState(initialForm); // For cancel-revert
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extractDone, setExtractDone] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = t => set("tags", form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);

  // Auto-save when ratings change (view mode)
  const updateRatings = async (newRatings) => {
    const updated = { ...form, ratings: newRatings };
    setForm(updated);
    setPristine(updated);
    if (form.id) await onSave(updated, { stayOpen: true });
  };

  const handleSaveBeanInfo = async () => {
    if (!form.name.trim()) return alert("Please give the bean a name!");
    const toSave = form.id ? form : { ...form, id: Date.now() };
    await onSave(toSave, { stayOpen: true });
    setForm(toSave);
    setPristine(toSave);
    setMode('view');
  };

  const handleCancelEdit = () => {
    if (isNewBean && !form.id) {
      onClose();
    } else {
      setForm(pristine);
      setMode('view');
    }
  };

  const handleDeleteBean = () => {
    if (form.id) onDelete(form.id);
    else onClose();
  };


  const inp = {
    width: "100%", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e0d0c0",
    background: "#fff8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: "#2c1a0e", outline: "none", boxSizing: "border-box"
  };
  const lbl = { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "block" };

  const F = ({ label, k, placeholder, full, type }) => (
    <div style={full ? { gridColumn: "1/-1" } : {}}>
      <label style={lbl}>{label}</label>
      <input type={type || "text"} style={inp} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder || ""} />
    </div>
  );
  const Sel = ({ label, k, options, full }) => (
    <div style={full ? { gridColumn: "1/-1" } : {}}>
      <label style={lbl}>{label}</label>
      <select style={inp} value={form[k]} onChange={e => set(k, e.target.value)}>
        <option value="">Select...</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  const handleImageFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setExtractError("");
    setExtractDone(false);
    try {
      const compressed = await compressImage(file);
      set("image", compressed);

      // Auto-extract
      setExtracting(true);
      try {
        const extracted = await extractBeanFromImage(compressed);
        setForm(f => ({
          ...f,
          image: compressed,
          name: extracted.name || f.name,
          roaster: extracted.roaster || f.roaster,
          origin: extracted.origin || f.origin,
          region: extracted.region || f.region,
          producer: extracted.producer || f.producer,
          varietal: VARIETALS.includes(extracted.varietal) ? extracted.varietal : (f.varietal || ""),
          process: PROCESSES.includes(extracted.process) ? extracted.process : (f.process || ""),
          roastLevel: ROAST_LEVELS.includes(extracted.roastLevel) ? extracted.roastLevel : (f.roastLevel || ""),
          altitude: extracted.altitude || f.altitude,
          harvest: extracted.harvest || f.harvest,
          importer: extracted.importer || f.importer,
          tags: extracted.tags?.filter(t => FLAVOR_TAGS.includes(t)) || f.tags,
          notes: extracted.notes || f.notes,
        }));
        setExtractDone(true);
      } catch (err) {
        if (err?.message === "NO_API_KEY") {
          setExtractError("Add your Anthropic API key in Settings (top-right) to enable photo scanning.");
        } else {
          setExtractError("Couldn't extract info — fill in manually.");
        }
      } finally {
        setExtracting(false);
      }
    } catch {
      setExtractError("Image couldn't be processed.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,10,5,0.6)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff8f0", borderRadius: 20, padding: 28, width: "100%", maxWidth: 580,
        maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(60,20,0,0.3)"
      }}>
        {mode === 'view' ? (
          <BeanViewMode
            bean={form}
            onRatingsChange={updateRatings}
            onEdit={() => setMode('edit')}
            onDelete={handleDeleteBean}
            onClose={onClose}
          />
        ) : (
          <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2c1a0e" }}>
            {isNewBean ? "Add a Bean" : "Edit Bean Info"}
          </h2>
          <button onClick={handleCancelEdit} style={{ background: "none", border: "none", fontSize: 24, color: "#8a7060", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* ── Image / Scan section ── */}
        <SectionHead title="Package Photo" />
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          style={{ display: "none" }} onChange={e => handleImageFile(e.target.files[0])} />

        {form.image ? (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={`data:image/jpeg;base64,${form.image}`} alt="package"
                style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 12, border: "1.5px solid #e0d0c0" }} />
              <button onClick={() => { set("image", ""); setExtractDone(false); }}
                style={{
                  position: "absolute", top: -8, right: -8, width: 22, height: 22,
                  borderRadius: "50%", border: "none", background: "#8B5E3C", color: "#fff",
                  fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1
                }}>×</button>
            </div>
            <div style={{ flex: 1 }}>
              {extracting && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8B5E3C", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                  <Spinner /> Scanning package &amp; searching the web...
                </div>
              )}
              {extractDone && !extracting && (
                <div style={{ color: "#4a7a50", fontFamily: "'DM Sans', sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  ✓ Fields filled in — check and adjust below
                </div>
              )}
              {extractError && (
                <div style={{ color: "#a05040", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{extractError}</div>
              )}
              {!extracting && (
                <button onClick={() => fileRef.current?.click()} style={{
                  marginTop: 8, padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e0d0c0",
                  background: "transparent", color: "#8a7060", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12, cursor: "pointer"
                }}>Replace photo</button>
              )}
              {!extracting && !extractDone && form.image && (
                <button onClick={async () => { setExtracting(true); setExtractError(""); setExtractDone(false); try { const extracted = await extractBeanFromImage(form.image); setForm(f => ({ ...f, name: extracted.name || f.name, roaster: extracted.roaster || f.roaster, origin: extracted.origin || f.origin, region: extracted.region || f.region, producer: extracted.producer || f.producer, varietal: VARIETALS.includes(extracted.varietal) ? extracted.varietal : f.varietal, process: PROCESSES.includes(extracted.process) ? extracted.process : f.process, roastLevel: ROAST_LEVELS.includes(extracted.roastLevel) ? extracted.roastLevel : f.roastLevel, altitude: extracted.altitude || f.altitude, harvest: extracted.harvest || f.harvest, importer: extracted.importer || f.importer, tags: extracted.tags?.filter(t => FLAVOR_TAGS.includes(t)) || f.tags, notes: extracted.notes || f.notes })); setExtractDone(true); } catch (err) { setExtractError(err?.message === "NO_API_KEY" ? "Add your Anthropic API key in Settings to enable scanning." : "Extraction failed."); } finally { setExtracting(false); } }}
                  style={{ marginTop: 8, marginLeft: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid #8B5E3C", background: "transparent", color: "#8B5E3C", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer" }}>
                  Re-extract with AI
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed #d4c5b5", borderRadius: 14, padding: "28px 20px",
              textAlign: "center", cursor: "pointer", background: "#fdf4ee",
              transition: "border-color 0.15s, background 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#8B5E3C"; e.currentTarget.style.background = "#fbeee4"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d4c5b5"; e.currentTarget.style.background = "#fdf4ee"; }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#6b4226", marginBottom: 4 }}>Take or upload a package photo</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#a08878" }}>AI will scan it and fill in the details automatically</div>
          </div>
        )}

        {/* ── Basics ── */}
        <SectionHead title="Basics" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <F label="Bean Name *" k="name" placeholder="e.g. Yirgacheffe Kochere" full />
          <F label="Roaster" k="roaster" placeholder="e.g. DAK Coffee Roasters" />
          <F label="Date Added" k="date" type="date" />
        </div>

        <SectionHead title="Origin & Provenance" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Country of Origin</label>
            <CountryCombobox value={form.origin} onChange={v => set("origin", v)} placeholder="e.g. Ethiopia" />
          </div>
          <F label="Region" k="region" placeholder="e.g. Yirgacheffe" />
          <F label="Producer / Farm" k="producer" placeholder="e.g. Daye Bensa" />
          <F label="Importer" k="importer" placeholder="e.g. Collaborative Coffee Source" />
        </div>

        <SectionHead title="Bean Details" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Sel label="Varietal" k="varietal" options={VARIETALS} />
          <Sel label="Process" k="process" options={PROCESSES} />
          <Sel label="Roast Level" k="roastLevel" options={ROAST_LEVELS} />
          <F label="Altitude (masl)" k="altitude" placeholder="e.g. 1900–2200" />
          <F label="Harvest Season" k="harvest" placeholder="e.g. Nov 2024 – Jan 2025" full />
        </div>

        <SectionHead title="Flavour Tags" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {FLAVOR_TAGS.map(t => <Tag key={t} label={t} active={form.tags.includes(t)} onClick={() => toggleTag(t)} />)}
        </div>

        <SectionHead title="From the Bag" />
        <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Roaster's tasting notes, origin story, brew suggestions..." />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 16, borderTop: "1px solid #ecddd0" }}>
          {!isNewBean && (
            <button onClick={handleDeleteBean} style={{
              padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e0c0b0",
              background: "transparent", color: "#b07060", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", marginRight: "auto"
            }}>Delete</button>
          )}
          <button onClick={handleCancelEdit} style={{
            padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e0d0c0",
            background: "transparent", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer"
          }}>Cancel</button>
          <button onClick={handleSaveBeanInfo} disabled={extracting} style={{
            padding: "10px 22px", borderRadius: 10, border: "none",
            background: extracting ? "#c4a48a" : "#8B5E3C", color: "#fff8f0",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            cursor: extracting ? "not-allowed" : "pointer"
          }}>{isNewBean ? "Save Bean" : "Save Changes"}</button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

function MapView({ beans }) {
  const [geo, setGeo] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const sources = [
      'https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson',
      'https://unpkg.com/world-atlas@2/countries-50m.json',
    ];
    (async () => {
      for (const url of sources) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const data = await r.json();
          if (data.features || data.objects) { setGeo(data); return; }
        } catch {}
      }
    })();
  }, []);

  const width = 800, height = 320;

  const projection = useMemo(
    () => d3.geoNaturalEarth1().scale(width / 6).translate([width / 2, height / 1.8]),
    []
  );
  const pathGen = useMemo(() => d3.geoPath().projection(projection), [projection]);
  const scoreColor = useMemo(
    () => d3.scaleLinear().domain([5, 10]).range(['#e8c8a8', '#5e3a1f']).clamp(true),
    []
  );

  const byCountry = useMemo(() => {
    const m = {};
    beans.forEach(b => {
      if (!b.origin) return;
      const scores = (b.ratings || []).map(r => Number(r.score)).filter(s => !isNaN(s) && s > 0);
      if (!scores.length) return;
      const avg = scores.reduce((a, x) => a + x, 0) / scores.length;
      if (!m[b.origin]) m[b.origin] = [];
      m[b.origin].push(avg);
    });
    return Object.entries(m).map(([country, avgs]) => ({
      country,
      avg: avgs.reduce((a, x) => a + x, 0) / avgs.length,
      count: avgs.length,
    })).sort((a, b) => a.count - b.count); // Smaller dots first so larger render on top
  }, [beans]);

  // GeoJSON or TopoJSON fallback handling: only render features if it's GeoJSON
  const features = geo?.features || null;

  if (byCountry.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
        Coffee Map
      </div>
      <div style={{ background: "#fff8f0", borderRadius: 14, padding: "14px 12px", border: "1px solid #e8ddd0" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {/* Equator + Tropics — subtle reference lines */}
          {[
            { lat: 23.5, dash: "3 4" },
            { lat: 0, dash: "0" },
            { lat: -23.5, dash: "3 4" },
          ].map(({ lat, dash }) => {
            const y = projection([0, lat])?.[1];
            return y ? (
              <line key={lat} x1={20} x2={width - 20} y1={y} y2={y}
                stroke="#e0d0c0" strokeWidth={0.6} strokeDasharray={dash} opacity={0.7} />
            ) : null;
          })}

          {/* Country fills (if loaded) */}
          {features && features.map((f, i) => (
            <path key={i} d={pathGen(f) || ""}
              fill="#f5ebdc" stroke="#e0d0c0" strokeWidth={0.4} />
          ))}

          {/* Scored country dots */}
          {byCountry.map(({ country, avg, count }) => {
            const coords = COUNTRY_COORDS[country];
            if (!coords) return null;
            const [lat, lng] = coords;
            const projected = projection([lng, lat]);
            if (!projected) return null;
            const [x, y] = projected;
            const r = 12 + Math.min(8, (count - 1) * 2);
            const color = scoreColor(avg);
            return (
              <g key={country}>
                <circle cx={x} cy={y} r={r + 1.5} fill="#fff8f0" opacity={0.85} />
                <circle cx={x} cy={y} r={r} fill={color} stroke="#fff8f0" strokeWidth={1.5} />
                <text x={x} y={y} dy={3.5} textAnchor="middle"
                  fontSize={r > 14 ? 12 : 11} fontFamily="'DM Sans', sans-serif"
                  fill="#fff8f0" fontWeight={700} style={{ pointerEvents: "none" }}>
                  {avg.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "0 4px", fontSize: 11, color: "#8a7060", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>5</span>
            <span style={{ width: 64, height: 8, borderRadius: 4, background: "linear-gradient(to right, #e8c8a8, #5e3a1f)" }} />
            <span>10</span>
          </div>
          <span style={{ fontStyle: "italic", fontSize: 10 }}>circle size = bean count</span>
        </div>
      </div>
    </div>
  );
}

function Insights({ beans }) {
  if (beans.length === 0) return (
    <div style={{ textAlign: "center", color: "#b89880", padding: 40, fontFamily: "'DM Sans', sans-serif" }}>Add some beans to see insights!</div>
  );

  const beanAvg = (b) => {
    const scores = (b.ratings || []).map(r => Number(r.score)).filter(s => !isNaN(s) && s > 0);
    return scores.length ? scores.reduce((a, x) => a + x, 0) / scores.length : null;
  };
  const personAvg = (b, who) => {
    const scores = (b.ratings || []).filter(r => r.rater === who).map(r => Number(r.score)).filter(s => !isNaN(s) && s > 0);
    return scores.length ? scores.reduce((a, x) => a + x, 0) / scores.length : null;
  };

  const avgByGroup = (key) => {
    const groups = {};
    beans.forEach(b => {
      const val = b[key]; if (!val) return;
      const avg = beanAvg(b);
      if (avg === null) return;
      if (!groups[val]) groups[val] = [];
      groups[val].push(avg);
    });
    return Object.entries(groups)
      .map(([k, v]) => ({ label: k, avg: (v.reduce((a, x) => a + x, 0) / v.length).toFixed(1), count: v.length }))
      .sort((a, b) => b.avg - a.avg);
  };

  const topTags = () => {
    const counts = {};
    beans.forEach(b => b.tags?.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  };

  const BarGroup = ({ title, data }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>{title}</div>
      {data.length === 0
        ? <div style={{ color: "#c5b5a5", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>No data yet</div>
        : data.map(d => (
          <div key={d.label} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 13, color: "#3a2010", fontFamily: "'DM Sans', sans-serif" }}>{d.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#8B5E3C", fontFamily: "'Playfair Display', serif" }}>
                {d.avg} <span style={{ fontSize: 10, color: "#b89880", fontWeight: 400 }}>({d.count})</span>
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "#e8ddd0" }}>
              <div style={{ height: 6, borderRadius: 3, background: "#8B5E3C", width: `${(d.avg / 10) * 100}%`, transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
    </div>
  );

  const kiTop = beans.filter(b => personAvg(b, "Kiki") !== null).sort((a, b) => personAvg(b, "Kiki") - personAvg(a, "Kiki"))[0];
  const madTop = beans.filter(b => personAvg(b, "Madsy") !== null).sort((a, b) => personAvg(b, "Madsy") - personAvg(a, "Madsy"))[0];

  return (
    <div>
      <MapView beans={beans} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        {[{ name: "Kiki", bean: kiTop, color: "#C0704A" }, { name: "Madsy", bean: madTop, color: "#4A7A90" }].map(({ name, bean, color }) => (
          <div key={name} style={{ background: "#fff8f0", border: "1px solid #e8ddd0", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color, fontFamily: "'DM Sans', sans-serif" }}>{name}'s Top Pick</div>
            <div style={{ fontSize: 15, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#2c1a0e", marginTop: 6, lineHeight: 1.3 }}>{bean?.name || "—"}</div>
            <div style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", color, fontWeight: 700 }}>{bean ? personAvg(bean, name)?.toFixed(1) : ""}</div>
          </div>
        ))}
      </div>

      <BarGroup title="By Country of Origin" data={avgByGroup("origin")} />
      <BarGroup title="By Process" data={avgByGroup("process")} />
      <BarGroup title="By Varietal" data={avgByGroup("varietal")} />
      <BarGroup title="By Roast Level" data={avgByGroup("roastLevel")} />
      <BarGroup title="By Region" data={avgByGroup("region")} />

      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>Favourite Flavour Tags</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {topTags().map(([t, c]) => (
            <span key={t} style={{ padding: "5px 14px", borderRadius: 20, background: "#e8f0e8", color: "#3a6040", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              {t} <strong>{c}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ onClose }) {
  const [key, setKey] = useState(getApiKey());
  const [show, setShow] = useState(false);
  const save = () => { setApiKey(key.trim()); onClose(); };
  const clear = () => { setApiKey(""); setKey(""); };

  const inp = {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e0d0c0",
    background: "#fff8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: "#2c1a0e", outline: "none", boxSizing: "border-box"
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(20,10,5,0.6)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        background: "#fff8f0", borderRadius: 20, padding: 28, width: "100%", maxWidth: 460,
        boxShadow: "0 20px 60px rgba(60,20,0,0.3)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2c1a0e" }}>Settings</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: "#8a7060", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ fontSize: 13, color: "#5a4030", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55, marginBottom: 16 }}>
          Paste your <strong>Anthropic API key</strong> to enable AI package scanning. The key stays in this browser only — it's never sent anywhere except directly to Anthropic when you scan a photo.
        </div>

        <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", marginBottom: 6, display: "block" }}>API Key</label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{ ...inp, paddingRight: 64 }}
          />
          <button onClick={() => setShow(s => !s)} style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#8a7060",
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer", padding: "4px 8px"
          }}>{show ? "Hide" : "Show"}</button>
        </div>

        <div style={{ fontSize: 12, color: "#a08878", fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>
          Get a key at <span style={{ color: "#8B5E3C" }}>console.anthropic.com</span> → API Keys.
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          <button onClick={clear} style={{
            padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e0c0b0",
            background: "transparent", color: "#b07060", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer"
          }}>Remove key</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{
              padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e0d0c0",
              background: "transparent", color: "#8a7060", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer"
            }}>Cancel</button>
            <button onClick={save} style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: "#8B5E3C", color: "#fff8f0", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [beans, setBeans] = useState([]);
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState("journal");
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("coffee-beans");
        if (r?.value) {
          const parsed = JSON.parse(r.value);
          const migrated = migrateBeans(parsed);
          setBeans(migrated);
          // Persist migration so old fields don't linger
          if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
            try { await window.storage.set("coffee-beans", JSON.stringify(migrated)); } catch {}
          }
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const save = async (updated) => {
    await window.storage.set("coffee-beans", JSON.stringify(updated));
    setBeans(updated);
  };

  const handleSave = async (form, options = {}) => {
    if (!form.name?.trim()) return alert("Please give the bean a name!");
    const exists = beans.some(b => b.id === form.id);
    const updated = exists
      ? beans.map(b => b.id === form.id ? form : b)
      : [...beans, form];
    await save(updated);
    if (!options.stayOpen) setModal(null);
    else setModal(form); // Update modal's bean so re-opens have latest data
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bean?")) return;
    await save(beans.filter(b => b.id !== id));
    setModal(null);
  };

  const filtered = beans.filter(b =>
    !filter || [b.name, b.roaster, b.origin, b.region, b.producer, b.varietal, b.process, b.importer, ...(b.tags || [])].join(" ").toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#fdf6ee", fontFamily: "'DM Sans', sans-serif", color: "#8a7060" }}>
      Loading your beans...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6ee" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ background: "#2c1a0e", padding: "24px 24px 0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b89870", fontFamily: "'DM Sans', sans-serif" }}>☕ Coffee Journal</div>
              <h1 style={{ margin: "6px 0 0", fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#fff8f0", fontWeight: 900, lineHeight: 1.1 }}>Kiki & Madsy</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 2 }}>
              <div style={{ fontSize: 11, color: "#6b5040", fontFamily: "'DM Sans', sans-serif" }}>
                {beans.length} bean{beans.length !== 1 ? "s" : ""} tasted
              </div>
              <button onClick={() => setSettingsOpen(true)} title="Settings"
                style={{
                  background: "transparent", border: "1px solid #6b5040", borderRadius: 8,
                  color: "#b89870", fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  padding: "4px 10px", cursor: "pointer"
                }}>⚙ Settings</button>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 20 }}>
            {["journal", "insights"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "10px 22px", border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                letterSpacing: "0.05em", textTransform: "capitalize",
                background: tab === t ? "#fff8f0" : "transparent",
                color: tab === t ? "#2c1a0e" : "#8a7060",
                borderRadius: "10px 10px 0 0", transition: "all 0.15s"
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
        {tab === "journal" && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input value={filter} onChange={e => setFilter(e.target.value)}
                placeholder="Search beans, origins, varietals, tags..."
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 12, border: "1.5px solid #e0d0c0",
                  background: "#fff8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#2c1a0e", outline: "none"
                }} />
              <button onClick={() => setModal({ ...EMPTY_BEAN })} style={{
                padding: "10px 20px", borderRadius: 12, border: "none",
                background: "#8B5E3C", color: "#fff8f0", fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
              }}>+ Add Bean</button>
            </div>

            {filtered.length === 0 ? (
              beans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#b89880", fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#8a7060", marginBottom: 8 }}>No beans yet</div>
                  <div style={{ fontSize: 14, marginBottom: 20 }}>Tap "+ Add Bean" and scan a package to get started</div>
                  <button onClick={() => save(buildSampleBeans())} style={{
                    padding: "10px 20px", borderRadius: 12, border: "1.5px dashed #8B5E3C",
                    background: "transparent", color: "#8B5E3C", fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13, fontWeight: 600, cursor: "pointer"
                  }}>Load sample beans</button>
                  <div style={{ fontSize: 11, marginTop: 10, color: "#c5b5a5" }}>(5 example coffees to play with)</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#b89880", fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#8a7060", marginBottom: 6 }}>No matches</div>
                  <div style={{ fontSize: 13 }}>Nothing matches "{filter}"</div>
                </div>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map(b => <BeanCard key={b.id} bean={b} onClick={() => setModal(b)} />)}
              </div>
            )}
          </>
        )}
        {tab === "insights" && <Insights beans={beans} />}
      </div>

      {modal && <Modal bean={modal} onClose={() => setModal(null)} onSave={handleSave} onDelete={handleDelete} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
