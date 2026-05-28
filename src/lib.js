import { getApiKey, getProvider } from "./settings.js";
import { pb } from "./pb.js";

// Ask the server which global providers are configured (env vars present).
export async function aiStatus() {
  try { return await pb.send("/api/ai/status", { method: "GET" }); }
  catch { return { anthropic: false, openai: false }; }
}

export const PROCESSES = ["Washed", "Natural", "Anaerobic", "Honey", "Wet-Hulled", "Carbonic Maceration", "Other"];
export const ROAST_LEVELS = ["Light", "Light-Medium", "Medium", "Medium-Dark", "Dark"];
export const VARIETALS = ["Gesha/Geisha", "Bourbon", "Typica", "SL28", "SL34", "Caturra", "Catuai", "Heirloom / Ethiopian Landraces", "Pacamara", "Maragogipe", "Mundo Novo", "74110", "74112", "Other"];
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
  "origin": "country",
  "region": "specific region/area",
  "producer": "farm or producer name",
  "varietal": "one of: ${VARIETALS.join(", ")}",
  "process": "one of: ${PROCESSES.join(", ")}",
  "roastLevel": "one of: ${ROAST_LEVELS.join(", ")}",
  "altitude": "altitude range e.g. 1800-2200",
  "harvest": "harvest season e.g. Nov 2024",
  "importer": "importer name if known",
  "tags": ["from this list only: ${FLAVOR_TAGS.join(", ")}"],
  "notes": "tasting notes from the bag/page or from your search"
}
Use empty string "" for unknown string fields. Use [] for unknown tags.`;

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
    model: "claude-sonnet-4-5", max_tokens: 1500,
    tools: [
      { type: "web_fetch_20250910", name: "web_fetch", max_uses: 3 },
      { type: "web_search_20250305", name: "web_search", max_uses: 3 },
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

// ── Public extractors (provider-aware) ─────────────────────
export async function extractBeanFromImage(base64) {
  const provider = getProvider();
  const prompt = `You are a specialty coffee expert. Examine this coffee packaging image carefully.
Extract everything visible on the package. If you can search the web, look up this specific coffee to fill in details not visible.
${FIELD_SPEC}`;
  if (provider === "global") return globalScan("image", { base64, prompt });
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");
  return provider === "openai"
    ? openaiImage(apiKey, base64, prompt)
    : anthropicImage(apiKey, base64, prompt);
}

export async function extractBeanFromUrl(url) {
  const provider = getProvider();
  const prompt = `You are a specialty coffee expert. Fetch the coffee product page at ${url} and read it carefully.
Extract the coffee's details from the page. If anything important is missing, you may also search the web to fill gaps.
${FIELD_SPEC}`;
  if (provider === "global") return globalScan("url", { url, prompt });
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");
  return provider === "openai"
    ? openaiUrl(apiKey, prompt)
    : anthropicUrl(apiKey, prompt);
}

// Average + per-person breakdown for a coffee's tastings (array of {user, score, expand}).
export function scoreSummary(tastings = []) {
  const scores = tastings.map((t) => Number(t.score)).filter((s) => !isNaN(s) && s > 0);
  const avg = scores.length ? scores.reduce((a, x) => a + x, 0) / scores.length : null;
  return { avg, count: tastings.length };
}
