import { getApiKey, getProvider } from "./settings.js";
import { pb } from "./pb.js";

// Ask the server which global providers are configured (env vars present).
export async function aiStatus() {
  try { return await pb.send("/api/ai/status", { method: "GET" }); }
  catch { return { anthropic: false, openai: false }; }
}

export const PROCESSES = [
  "Washed", "Natural", "Honey",
  "Anaerobic", "Anaerobic Natural", "Anaerobic Washed",
  "Carbonic Maceration", "Lactic Anaerobic", "Thermal Shock",
  "Co-Fermentation", "Yeast Inoculated", "Double Fermented",
  "Wet-Hulled", "Black Honey", "White Honey", "Other",
];
export const ROAST_LEVELS = ["Light", "Light-Medium", "Medium", "Medium-Dark", "Dark"];
export const VARIETALS = [
  "Gesha/Geisha", "Bourbon", "Red Bourbon", "Yellow Bourbon", "Pink Bourbon",
  "Typica", "SL28", "SL34", "Caturra", "Catuai", "Pacas",
  "Heirloom / Ethiopian Landraces", "Pacamara", "Maragogipe", "Maracaturra",
  "Mundo Novo", "Java", "Sidra", "Wush Wush", "Chiroso",
  "Udaini", "Dawairi", "Yemen Heirloom",
  "74110", "74112", "Other",
];
export const FLAVOR_TAGS = ["Fruity", "Floral", "Chocolatey", "Nutty", "Caramel", "Spicy", "Earthy", "Bright", "Funky", "Smoky", "Citrus", "Berry", "Stone Fruit", "Herbal", "Jasmine", "Rose", "Tropical", "Winey", "Juicy", "Clean", "Complex", "Savory"];

// Flavour tags organised into SCAA-flavor-wheel-ish categories, each with a
// soft category color (the little dot) and per-tag emoji.
export const FLAVOR_CATEGORIES = [
  { name: "Fruity", color: "#d97670", tags: ["Fruity", "Berry", "Citrus", "Stone Fruit", "Tropical"] },
  { name: "Floral", color: "#e08fb0", tags: ["Floral", "Jasmine", "Rose"] },
  { name: "Cocoa & Sweet", color: "#a87148", tags: ["Chocolatey", "Caramel"] },
  { name: "Nutty", color: "#c8a878", tags: ["Nutty"] },
  { name: "Spice", color: "#d8884a", tags: ["Spicy"] },
  { name: "Earthy & Herbal", color: "#7a9468", tags: ["Earthy", "Herbal", "Smoky"] },
  { name: "Fermented", color: "#9c7ab0", tags: ["Funky", "Winey"] },
  { name: "Other", color: "#a89878", tags: ["Bright", "Juicy", "Clean", "Complex", "Savory"] },
];

export const TAG_EMOJI = {
  Fruity: "🍓", Berry: "🫐", Citrus: "🍊", "Stone Fruit": "🍑", Tropical: "🥭",
  Floral: "🌸", Jasmine: "🌼", Rose: "🌹",
  Chocolatey: "🍫", Caramel: "🍯",
  Nutty: "🌰",
  Spicy: "🌶️",
  Earthy: "🌍", Herbal: "🌿", Smoky: "💨",
  Funky: "🍺", Winey: "🍷",
  Bright: "✨", Juicy: "💧", Clean: "💎", Complex: "🎭", Savory: "🧂",
};

// Map our existing roast_level string to a 1-5 intensity for the flavor-profile bars.
export const ROAST_INTENSITY = {
  "Light": 1, "Light-Medium": 2, "Medium": 3, "Medium-Dark": 4, "Dark": 5,
};
export const COFFEE_COUNTRIES = [
  "Angola", "Bolivia", "Brazil", "Burundi", "Cameroon", "China", "Colombia",
  "Costa Rica", "Cuba", "Democratic Republic of the Congo", "Dominican Republic",
  "Ecuador", "El Salvador", "Ethiopia", "Gabon", "Ghana", "Guatemala", "Haiti",
  "Honduras", "India", "Indonesia", "Ivory Coast", "Jamaica", "Kenya", "Laos",
  "Madagascar", "Malawi", "Mexico", "Myanmar", "Nepal", "Nicaragua", "Nigeria",
  "Panama", "Papua New Guinea", "Peru", "Philippines", "Rwanda",
  "São Tomé and Príncipe", "Sierra Leone", "Sri Lanka", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Uganda", "USA (Hawaii)", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

// Compress an image to a max 1024px JPEG. Returns { blob, base64 } —
// blob for uploading to PocketBase, base64 for sending to the AI scanner.
export async function compressImage(file) {
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
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      canvas.toBlob(
        (blob) => resolve({ blob, base64: dataUrl.split(",")[1] }),
        "image/jpeg", 0.75
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Shared JSON field spec for both the photo scanner and the URL importer.
const FIELD_SPEC = `Respond ONLY with a valid JSON object — no markdown, no explanation, no backticks. Use exactly these keys:
{
  "name": "the coffee's name",
  "roaster": "roaster name",
  "origin": ["country", "additional countries if this is a blend — empty array if unknown"],
  "region": "specific region/area (single string; leave empty for multi-origin blends)",
  "producer": "farm or producer name",
  "varietal": ["each varietal as a separate array item — most coffees have 1-3; blends have more. Use bag's exact words, e.g. \\"Pink Bourbon\\", \\"Udaini\\", \\"Heirloom\\". Empty array if unknown."],
  "process": "the SINGLE most specific process. Never combine — \\"Anaerobic Natural\\" is ONE value, not two. Suggestions: ${PROCESSES.join(", ")}",
  "roastLevel": "one of: ${ROAST_LEVELS.join(", ")}",
  "altitude": "altitude range e.g. 1800-2200",
  "harvest": "harvest season e.g. Nov 2024",
  "importer": "importer name if known",
  "tags": ["from this list only: ${FLAVOR_TAGS.join(", ")}"],
  "notes": "tasting notes from the bag/page or from your search",
  "image_url": "absolute URL of the main coffee bag/package image on the page, or empty"
}
Use empty string "" for unknown string fields. Use [] for unknown arrays. ALWAYS return arrays for "origin" and "varietal" — never comma-joined strings.`;

// Parse a JSON object out of an LLM's text response.
function extractJson(raw) {
  const clean = (raw || "").replace(/```json|```/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

async function postJSON(url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

// ── ANTHROPIC ──────────────────────────────────────────────
async function anthropicImage(apiKey, base64, prompt) {
  const data = await postJSON("https://api.anthropic.com/v1/messages", {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  }, {
    model: "claude-sonnet-4-5", max_tokens: 1200,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
        { type: "text", text: prompt },
      ],
    }],
  });
  const text = (data.content || []).filter((b) => b.type === "text").pop()?.text || "";
  return extractJson(text);
}

async function anthropicUrl(apiKey, prompt) {
  const data = await postJSON("https://api.anthropic.com/v1/messages", {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  }, {
    model: "claude-sonnet-4-5", max_tokens: 2000,
    tools: [
      { type: "web_fetch_20250910", name: "web_fetch", max_uses: 5 },
      { type: "web_search_20250305", name: "web_search", max_uses: 5 },
    ],
    messages: [{ role: "user", content: prompt }],
  });
  const text = (data.content || []).filter((b) => b.type === "text").pop()?.text || "";
  return extractJson(text);
}

// ── OPENAI ─────────────────────────────────────────────────
async function openaiImage(apiKey, base64, prompt) {
  const data = await postJSON("https://api.openai.com/v1/chat/completions", {
    Authorization: `Bearer ${apiKey}`,
  }, {
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
      ],
    }],
  });
  const text = data.choices?.[0]?.message?.content || "";
  return extractJson(text);
}

async function openaiUrl(apiKey, prompt) {
  // OpenAI's Responses API + web_search tool: equivalent of Anthropic's web_fetch.
  const data = await postJSON("https://api.openai.com/v1/responses", {
    Authorization: `Bearer ${apiKey}`,
  }, {
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });
  // Responses API: convenience field "output_text" concatenates all text outputs.
  const text = data.output_text
    || (data.output || []).flatMap((o) => (o.content || []).filter((c) => c.type === "output_text").map((c) => c.text)).join("\n");
  return extractJson(text);
}

// ── Server proxy (global / shared key mode) ────────────────
async function globalScan(mode, payload) {
  const res = await pb.send("/api/ai/scan", { method: "POST", body: { mode, ...payload } });
  return extractJson(res.text || "");
}

// Use personal key if set; otherwise fall back to the server's shared key.
async function withFallback(globalCall, personalCall) {
  if (getApiKey()) return personalCall();
  return globalCall();
}

// ── Public extractors (provider-aware, global-first when opted in) ─────────
export async function extractBeanFromImage(base64) {
  const prompt = `You are a specialty coffee expert. Examine this coffee packaging image carefully.
Extract everything visible on the package. If you can search the web, look up this specific coffee to fill in details not visible.
${FIELD_SPEC}`;
  return withFallback(
    () => globalScan("image", { base64, prompt }),
    () => {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("NO_API_KEY");
      return getProvider() === "openai" ? openaiImage(apiKey, base64, prompt) : anthropicImage(apiKey, base64, prompt);
    },
  );
}

export async function extractBeanFromUrl(url) {
  const prompt = `You are a specialty coffee expert. Your job: gather AS MUCH accurate detail as possible about the coffee at this URL: ${url}

You MUST use BOTH tools (do not skip step 2):

Step 1 — Fetch ${url} and extract whatever the static HTML provides: <title>, meta tags, og: tags, <script type="application/ld+json"> blocks, any visible text.

Step 2 — ALSO run at least one web_search. This is mandatory, even if step 1 looked okay. Most modern roaster sites (Shopify, custom SPAs) are JavaScript-rendered, so the static HTML is nearly empty — but the same coffee is almost always listed on retailer / importer / blog / coffee-database pages (search for the coffee name + roaster name + words like "origin process varietal"). Pull origin, region, producer, varietal, process, altitude, harvest, and tasting notes from there.

Step 3 — Combine information from both. Prefer the richer, more authoritative source for each field. If sources conflict, prefer the roaster's own description.

** IMAGE: If — and ONLY if — the page HTML literally contains an og:image, twitter:image, or JSON-LD product image, copy that URL verbatim into "image_url". DO NOT construct, guess, or reconstruct URLs based on what a typical CDN path looks like (no inventing /cdn/shop/products/<slug>.jpg style paths). If you cannot find a literal image URL in the source, leave "image_url" empty — a separate scraper handles that case. **

Be diligent. A response missing origin/process/varietal/notes/image_url when those exist online is a failure.

${FIELD_SPEC}`;
  return withFallback(
    () => globalScan("url", { url, prompt }),
    () => {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("NO_API_KEY");
      return getProvider() === "openai" ? openaiUrl(apiKey, prompt) : anthropicUrl(apiKey, prompt);
    },
  );
}

// ── "Should I buy this?" verdict ───────────────────────────
// One combined call: extract the coffee's attributes AND give a buy/skip
// verdict against the user's palate. Returns { coffee, verdict, confidence,
// reasoning, image_url? }.

const VERDICT_TAIL = (palate) => `

After extracting the coffee, decide whether the user should buy it. Use their tasting history (palate signature):
${JSON.stringify(palate, null, 2)}

Be grounded in their actual numbers. process / varietal can be free-text — do NOT restrict to common values; capture the bag's exact words (e.g. "Lactic Anaerobic Natural", "Udaini").

Respond ONLY with valid JSON, no markdown, no commentary:
{
  "coffee": {
    "name": "...", "roaster": "...", "origin": ["..."], "region": "...",
    "producer": "...", "varietal": ["..."], "process": "...",
    "roastLevel": "...", "altitude": "...", "harvest": "...", "importer": "...",
    "tags": [], "notes": "...", "image_url": ""
  },
  "verdict": "buy" | "maybe" | "skip",
  "confidence": "high" | "medium" | "low",
  "reasoning": "1-2 sentence verdict grounded in the palate numbers",
  "matches": [
    { "attr": "Process" | "Origin" | "Varietal" | "Roast" | "Tag" | "Roaster",
      "value": "<specific value from this coffee>",
      "yourAvg": <number 0-10>,
      "n": <count of tastings backing it> }
  ],
  "mismatches": [
    { "attr": "...", "value": "...",
      "note": "no history" | "you average X.X" }
  ]
}

For "matches": include up to 4 attributes where their avg score is ≥ 7. Use the value AS APPEARS ON THIS COFFEE (e.g. value="Anaerobic Natural" from a coffee with that process, matched against their general "Anaerobic" / "Natural" averages).
For "mismatches": include up to 3 attributes where they have a low avg (< 6) or no history at all on the coffee's origin/process/varietal.
If they have ZERO tastings, leave both arrays empty.
Confidence: "low" if <10 tastings or no overlap; "high" if many tastings + strong overlap; "medium" otherwise.`;

async function anthropicImageVerdict(apiKey, base64, palate) {
  const prompt = `You are a specialty coffee expert evaluating a bag for a friend.
Step 1: Examine this coffee packaging image carefully and extract its details. Use web_search if useful.
${FIELD_SPEC}${VERDICT_TAIL(palate)}`;
  const data = await postJSON("https://api.anthropic.com/v1/messages", {
    "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true",
  }, {
    model: "claude-sonnet-4-5", max_tokens: 1500,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
        { type: "text", text: prompt },
      ],
    }],
  });
  const text = (data.content || []).filter((b) => b.type === "text").pop()?.text || "";
  return extractJson(text);
}

async function anthropicUrlVerdict(apiKey, url, palate) {
  const prompt = `You are a specialty coffee expert evaluating a coffee at ${url} for a friend.
Step 1: Fetch the page and ALSO web_search the coffee's name + roaster (most roaster sites are JS-rendered; resellers and importers carry the same data). Combine sources.
${FIELD_SPEC}${VERDICT_TAIL(palate)}`;
  const data = await postJSON("https://api.anthropic.com/v1/messages", {
    "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true",
  }, {
    model: "claude-sonnet-4-5", max_tokens: 2000,
    tools: [
      { type: "web_fetch_20250910", name: "web_fetch", max_uses: 5 },
      { type: "web_search_20250305", name: "web_search", max_uses: 5 },
    ],
    messages: [{ role: "user", content: prompt }],
  });
  const text = (data.content || []).filter((b) => b.type === "text").pop()?.text || "";
  return extractJson(text);
}

async function openaiImageVerdict(apiKey, base64, palate) {
  const prompt = `You are a specialty coffee expert evaluating a bag for a friend.
Examine this coffee packaging image and extract its details.
${FIELD_SPEC}${VERDICT_TAIL(palate)}`;
  const data = await postJSON("https://api.openai.com/v1/chat/completions", {
    Authorization: `Bearer ${apiKey}`,
  }, {
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
      ],
    }],
  });
  return extractJson(data.choices?.[0]?.message?.content || "");
}

async function openaiUrlVerdict(apiKey, url, palate) {
  const prompt = `You are a specialty coffee expert evaluating a coffee at ${url} for a friend.
Fetch and read the page; use web_search to fill gaps.
${FIELD_SPEC}${VERDICT_TAIL(palate)}`;
  const data = await postJSON("https://api.openai.com/v1/responses", {
    Authorization: `Bearer ${apiKey}`,
  }, {
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });
  const text = data.output_text
    || (data.output || []).flatMap((o) => (o.content || []).filter((c) => c.type === "output_text").map((c) => c.text)).join("\n");
  return extractJson(text);
}

export async function verdictFromImage(base64, palate) {
  return withFallback(
    () => globalScan("verdict_image", { base64, palate }),
    () => {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("NO_API_KEY");
      return getProvider() === "openai" ? openaiImageVerdict(apiKey, base64, palate) : anthropicImageVerdict(apiKey, base64, palate);
    },
  );
}

export async function verdictFromUrl(url, palate) {
  return withFallback(
    () => globalScan("verdict_url", { url, palate }),
    () => {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("NO_API_KEY");
      return getProvider() === "openai" ? openaiUrlVerdict(apiKey, url, palate) : anthropicUrlVerdict(apiKey, url, palate);
    },
  );
}

// Ask the server to scrape og:image / twitter:image / JSON-LD image from a
// product page. Deterministic (no LLM) — used as a fallback when the AI
// hallucinates an image URL that 404s. Returns "" if nothing found.
export async function scrapePageImage(pageUrl) {
  if (!pageUrl) return "";
  try {
    const res = await pb.send("/api/ai/page-meta", { method: "POST", body: { url: pageUrl } });
    if (res?.debug) console.log("[scrapePageImage] debug:", res.debug);
    return res?.image_url || "";
  } catch (e) {
    console.log("[scrapePageImage] failed:", e?.message || e);
    return "";
  }
}

// Fetch an external image (a roaster's product photo) and return a Blob suitable
// for upload as a coffee's avatar. Tries the browser first (most CDNs are CORS-OK);
// if that fails, goes through our server proxy.
export async function fetchExternalImage(url) {
  if (!url) return null;
  // Upgrade http:// → https:// to avoid mixed-content blocking when we're on
  // HTTPS. Most CDNs (Shopify, Cloudflare, etc.) serve both, so this is safe.
  const safeUrl = url.startsWith("http://") ? "https://" + url.slice(7) : url;
  console.log("[fetchExternalImage] trying:", safeUrl);
  // 1) direct browser fetch
  try {
    const r = await fetch(safeUrl, { mode: "cors" });
    if (r.ok) {
      const blob = await r.blob();
      if (blob.type.startsWith("image/")) {
        console.log("[fetchExternalImage] direct OK", blob.type, blob.size);
        return blob;
      }
    }
  } catch (e) {
    console.log("[fetchExternalImage] direct failed:", e?.message || e);
  }
  // 2) server proxy (handles CORS-blocked CDNs and bad TLS)
  try {
    const res = await pb.send("/api/ai/fetch-image", { method: "POST", body: { url: safeUrl } });
    if (res?.base64) {
      const bin = atob(res.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: res.contentType || "image/jpeg" });
      console.log("[fetchExternalImage] proxy OK", blob.type, blob.size);
      return blob;
    }
  } catch (e) {
    console.log("[fetchExternalImage] proxy failed:", e?.message || e);
  }
  return null;
}

// Average + per-person breakdown for a coffee's tastings (array of {user, score, expand}).
export function scoreSummary(tastings = []) {
  const scores = tastings.map((t) => Number(t.score)).filter((s) => !isNaN(s) && s > 0);
  const avg = scores.length ? scores.reduce((a, x) => a + x, 0) / scores.length : null;
  return { avg, count: tastings.length };
}
