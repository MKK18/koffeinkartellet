import { getApiKey } from "./settings.js";

export const PROCESSES = ["Washed", "Natural", "Anaerobic", "Honey", "Wet-Hulled", "Carbonic Maceration", "Other"];
export const ROAST_LEVELS = ["Light", "Light-Medium", "Medium", "Medium-Dark", "Dark"];
export const VARIETALS = ["Gesha/Geisha", "Bourbon", "Typica", "SL28", "SL34", "Caturra", "Catuai", "Heirloom / Ethiopian Landraces", "Pacamara", "Maragogipe", "Mundo Novo", "74110", "74112", "Other"];
export const FLAVOR_TAGS = ["Fruity", "Floral", "Chocolatey", "Nutty", "Caramel", "Spicy", "Earthy", "Bright", "Funky", "Smoky", "Citrus", "Berry", "Stone Fruit", "Herbal", "Jasmine", "Rose", "Tropical", "Winey", "Juicy", "Clean", "Complex", "Savory"];
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

// Core call: posts to the Anthropic Messages API (browser-direct, user's own key)
// and parses the trailing JSON object out of the response.
async function callExtraction({ content, tools, maxTokens = 1200 }) {
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
      max_tokens: maxTokens,
      tools,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const textBlocks = (data.content || []).filter((b) => b.type === "text");
  const raw = textBlocks[textBlocks.length - 1]?.text || "";
  const match = raw.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

// Read a coffee package photo and extract structured fields.
export async function extractBeanFromImage(base64) {
  const prompt = `You are a specialty coffee expert. Examine this coffee packaging image carefully.
Extract everything visible on the package, then use web_search to look up this specific coffee to fill in details not visible on the package.
${FIELD_SPEC}`;
  return callExtraction({
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
      { type: "text", text: prompt },
    ],
  });
}

// Read a roaster's product page URL and extract structured fields.
export async function extractBeanFromUrl(url) {
  const prompt = `You are a specialty coffee expert. Fetch the coffee product page at ${url} using web_fetch and read it carefully.
Extract the coffee's details from the page. If anything important is missing, you may use web_search to fill gaps.
${FIELD_SPEC}`;
  return callExtraction({
    maxTokens: 1500,
    tools: [
      { type: "web_fetch_20250910", name: "web_fetch", max_uses: 3 },
      { type: "web_search_20250305", name: "web_search", max_uses: 3 },
    ],
    content: prompt,
  });
}

// Average + per-person breakdown for a coffee's tastings (array of {user, score, expand}).
export function scoreSummary(tastings = []) {
  const scores = tastings.map((t) => Number(t.score)).filter((s) => !isNaN(s) && s > 0);
  const avg = scores.length ? scores.reduce((a, x) => a + x, 0) / scores.length : null;
  return { avg, count: tastings.length };
}
