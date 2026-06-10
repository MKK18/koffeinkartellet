/// <reference path="../pb_data/types.d.ts" />
//
// Server-side proxy for the AI scan features.
// Lets the admin configure ONE shared API key (Railway env var) so individual
// users don't need their own. Set ANTHROPIC_API_KEY and/or OPENAI_API_KEY.

// Public: tells the client which providers are globally available.
routerAdd("GET", "/api/ai/status", (e) => {
  return e.json(200, {
    anthropic: !!$os.getenv("ANTHROPIC_API_KEY"),
    openai: !!$os.getenv("OPENAI_API_KEY"),
  });
});

// Base64 encoder. Accepts either a binary-safe string (older PocketBase) or
// an Array<number> of byte values (PocketBase 0.20+, per the JSVM types).
function bytesToBase64(input) {
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const isArr = Array.isArray(input);
  const len = isArr ? input.length : (input ? input.length : 0);
  const at = isArr ? (i) => input[i] & 0xff : (i) => input.charCodeAt(i) & 0xff;
  let out = "";
  for (let i = 0; i < len; i += 3) {
    const a = at(i);
    const b = (i + 1 < len) ? at(i + 1) : 0;
    const c = (i + 2 < len) ? at(i + 2) : 0;
    const t = (a << 16) | (b << 8) | c;
    out += ABC[(t >> 18) & 63] + ABC[(t >> 12) & 63];
    out += (i + 1 < len) ? ABC[(t >> 6) & 63] : "=";
    out += (i + 2 < len) ? ABC[t & 63] : "=";
  }
  return out;
}

// Read $http.send result body as a UTF-8 string. PocketBase 0.20+ returns
// body as Array<number>; older versions returned a string. The deprecated
// `raw` field still holds the string form on current versions.
function bodyToString(res) {
  if (!res) return "";
  if (typeof res.raw === "string" && res.raw.length) return res.raw;
  if (typeof res.body === "string") return res.body;
  if (Array.isArray(res.body)) {
    // Build a string from byte values (works for ASCII/UTF-8 latin range,
    // which covers everything we regex against — meta tags, JSON-LD).
    let s = "";
    for (let i = 0; i < res.body.length; i++) s += String.fromCharCode(res.body[i] & 0xff);
    return s;
  }
  return "";
}

// Authed: server-side image fetcher. Used when the browser can't cross-fetch a
// roaster's product image (CORS). Body: { url }. Returns { base64, contentType }.
routerAdd("POST", "/api/ai/fetch-image", (e) => {
  if (!e.auth || !e.auth.id) throw new ForbiddenError("Sign in required");
  const body = e.requestInfo().body || {};
  const url = String(body.url || "");
  if (!/^https?:\/\//i.test(url)) throw new BadRequestError("Invalid URL");
  // SSRF guard: block loopback/private/link-local/cloud-metadata hosts so an
  // authed user can't turn this fetcher into an internal-network proxy.
  // (Inlined — file-scope helpers aren't reliably visible in this VM, see below.
  // Residual risk: a public hostname that DNS-resolves to a private IP, or a
  // redirect into one, since $http.send follows redirects.)
  {
    const hm = url.match(/^https?:\/\/([^\/:?#]+)/i);
    let host = (hm ? hm[1] : "").toLowerCase().replace(/^\[|\]$/g, "");
    const isV6 = host.indexOf(":") !== -1;
    let blocked = !host
      || host === "localhost" || host.endsWith(".localhost")
      || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".lan")
      || host === "metadata" || host === "metadata.google.internal"
      || (isV6 && (host === "::1" || host === "::" || host.indexOf("fe80:") === 0 || host.indexOf("fc") === 0 || host.indexOf("fd") === 0));
    const ip = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ip) {
      const a = +ip[1], b = +ip[2];
      if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254)
        || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
        || (a === 100 && b >= 64 && b <= 127) || a >= 224) blocked = true;
    }
    if (blocked) throw new BadRequestError("That URL isn't allowed.");
  }
  let res;
  try {
    res = $http.send({
      url: url,
      method: "GET",
      timeout: 30,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": (url.match(/^(https?:\/\/[^\/]+)/) || [null, ""])[1] + "/",
      },
    });
  } catch (err) {
    throw new BadRequestError("HTTP fetch threw: " + String(err));
  }
  if (res.statusCode >= 400) throw new BadRequestError("Image fetch failed: " + res.statusCode);
  const ct = (res.headers && res.headers["Content-Type"] && res.headers["Content-Type"][0]) || "application/octet-stream";
  if (!ct.startsWith("image/")) throw new BadRequestError("Not an image (" + ct + ")");
  // Inline base64 encode of byte array. PB returns body as Array<number>; we
  // can't rely on file-scope helpers being visible inside the route handler
  // (see bodyToString scoping issue in page-meta).
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const input = res.body || [];
  const isArr = Array.isArray(input);
  const len = isArr ? input.length : (input.length || 0);
  let base64 = "";
  try {
    for (let i = 0; i < len; i += 3) {
      const a = (isArr ? input[i] : input.charCodeAt(i)) & 0xff;
      const b = (i + 1 < len) ? ((isArr ? input[i + 1] : input.charCodeAt(i + 1)) & 0xff) : 0;
      const c = (i + 2 < len) ? ((isArr ? input[i + 2] : input.charCodeAt(i + 2)) & 0xff) : 0;
      const t = (a << 16) | (b << 8) | c;
      base64 += ABC[(t >> 18) & 63] + ABC[(t >> 12) & 63];
      base64 += (i + 1 < len) ? ABC[(t >> 6) & 63] : "=";
      base64 += (i + 2 < len) ? ABC[t & 63] : "=";
    }
  } catch (err) {
    throw new BadRequestError("Encode threw (bodyType=" + typeof res.body + " isArr=" + isArr + " len=" + len + "): " + String(err));
  }
  return e.json(200, { base64: base64, contentType: ct });
});

// Authed: server-side page-meta scraper. Fetches a page's HTML and extracts
// the og:image / twitter:image / JSON-LD product image deterministically
// (no LLM, no guessing). Used as a fallback when the AI's image_url 404s
// (because the model hallucinated a Shopify CDN path) or comes back empty.
// Body: { url }. Returns { image_url }.
routerAdd("POST", "/api/ai/page-meta", (e) => {
  if (!e.auth || !e.auth.id) throw new ForbiddenError("Sign in required");
  const body = e.requestInfo().body || {};
  const pageUrl = String(body.url || "");
  if (!/^https?:\/\//i.test(pageUrl)) throw new BadRequestError("Invalid URL");
  // SSRF guard (see /api/ai/fetch-image for rationale + residual risk).
  {
    const hm = pageUrl.match(/^https?:\/\/([^\/:?#]+)/i);
    let host = (hm ? hm[1] : "").toLowerCase().replace(/^\[|\]$/g, "");
    const isV6 = host.indexOf(":") !== -1;
    let blocked = !host
      || host === "localhost" || host.endsWith(".localhost")
      || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".lan")
      || host === "metadata" || host === "metadata.google.internal"
      || (isV6 && (host === "::1" || host === "::" || host.indexOf("fe80:") === 0 || host.indexOf("fc") === 0 || host.indexOf("fd") === 0));
    const ip = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ip) {
      const a = +ip[1], b = +ip[2];
      if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254)
        || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
        || (a === 100 && b >= 64 && b <= 127) || a >= 224) blocked = true;
    }
    if (blocked) throw new BadRequestError("That URL isn't allowed.");
  }
  let html = "";
  try {
    const res = $http.send({
      url: pageUrl,
      method: "GET",
      timeout: 30,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (res.statusCode >= 400) return e.json(200, { image_url: "" });
    // Inline body→string decode (file-scope helpers don't appear to be visible
    // inside this route handler's goja VM — keep it self-contained).
    if (res && typeof res.raw === "string" && res.raw.length) {
      html = res.raw;
    } else if (typeof res.body === "string") {
      html = res.body;
    } else if (Array.isArray(res.body)) {
      const parts = [];
      const b = res.body;
      for (let i = 0; i < b.length; i++) parts.push(String.fromCharCode(b[i] & 0xff));
      html = parts.join("");
    } else {
      html = "";
    }
  } catch (err) {
    // Don't echo fetched content or internal error detail back to the client.
    return e.json(200, { image_url: "" });
  }
  // Try og:image, twitter:image, and JSON-LD image fields in that order.
  // Tolerate either attribute order (content="…" property="…" or vice versa).
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /"image"\s*:\s*"([^"]+)"/i,
    /"image"\s*:\s*\[\s*"([^"]+)"/i,
  ];
  let found = "";
  for (let i = 0; i < patterns.length; i++) {
    const m = html.match(patterns[i]);
    if (m && m[1]) { found = m[1]; break; }
  }
  if (found) {
    // Resolve protocol-relative + http→https, leave absolute paths alone.
    if (found.indexOf("//") === 0) found = "https:" + found;
    else if (found.indexOf("http://") === 0) found = "https://" + found.slice(7);
  }
  return e.json(200, { image_url: found });
});

// Authed: scan an image or a URL using the configured global key.
// Body: { mode: "image" | "url", prompt: string, base64?: string, url?: string, provider?: "anthropic" | "openai" }
routerAdd("POST", "/api/ai/scan", (e) => {
  if (!e.auth || !e.auth.id) {
    throw new ForbiddenError("Sign in required");
  }
  const body = e.requestInfo().body || {};
  const mode = ["url", "image", "verdict_image", "verdict_url"].includes(body.mode) ? body.mode : "image";
  // Build the prompt server-side for verdict modes (which carry a palate
  // object), so the client doesn't have to duplicate the prompt templates.
  let prompt = String(body.prompt || "");
  if (mode === "verdict_image" || mode === "verdict_url") {
    const palate = body.palate || {};
    const head = mode === "verdict_image"
      ? "You are a specialty coffee expert evaluating a bag for a friend. Examine this coffee packaging image carefully and extract its details. Use web_search if useful."
      : `You are a specialty coffee expert evaluating a coffee at ${body.url} for a friend. Fetch the page; ALSO web_search by name + roaster since most roaster sites are JS-rendered. ALWAYS populate "image_url" with the absolute URL of the og:image / twitter:image / JSON-LD product image when the page exposes one.`;
    prompt = `${head}

process / varietal can be free-text — do NOT restrict to common values; capture the bag's exact words (e.g. "Lactic Anaerobic Natural", "Udaini").
origin and varietal MUST be arrays (one item per origin / per varietal). process is a SINGLE string — never combine values like "WashedNatural".

Respond ONLY with valid JSON, no markdown:
{
  "coffee": { "name": "...", "roaster": "...", "origin": ["..."], "region": "...", "producer": "...", "varietal": ["..."], "process": "...", "roastLevel": "...", "altitude": "...", "harvest": "...", "importer": "...", "tags": [], "notes": "...", "image_url": "" },
  "verdict": "buy" | "maybe" | "skip",
  "confidence": "high" | "medium" | "low",
  "reasoning": "1-2 sentences grounded in the palate numbers",
  "matches":    [ { "attr": "Process"|"Origin"|"Varietal"|"Roast"|"Tag"|"Roaster", "value": "<from this coffee>", "yourAvg": <0-10>, "n": <count> } ],
  "mismatches": [ { "attr": "...", "value": "...", "note": "no history" | "you average X.X" } ]
}

The user's palate (tags/origins/processes/varietals/roasts, each with avg score and count):
${JSON.stringify(palate, null, 2)}

matches: up to 4 attrs where their avg ≥ 7. mismatches: up to 3 attrs where avg < 6 or no history. If zero tastings, empty arrays. Confidence: low (<10 tastings or no overlap), high (lots), medium (otherwise).`;
  }
  if (!prompt) throw new BadRequestError("Missing prompt");

  const anthropicKey = $os.getenv("ANTHROPIC_API_KEY");
  const openaiKey = $os.getenv("OPENAI_API_KEY");
  // Pick provider: explicit > anthropic > openai
  let provider = body.provider;
  if (!provider) provider = anthropicKey ? "anthropic" : (openaiKey ? "openai" : null);
  if (!provider) throw new BadRequestError("No global AI key configured on the server");

  let url, headers, payload, parseText;

  if (provider === "anthropic") {
    if (!anthropicKey) throw new BadRequestError("Anthropic key not configured");
    url = "https://api.anthropic.com/v1/messages";
    headers = {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    };
    if (mode === "image" || mode === "verdict_image") {
      const base64 = String(body.base64 || "");
      if (!base64) throw new BadRequestError("Missing base64");
      payload = {
        model: "claude-sonnet-4-5", max_tokens: mode === "verdict_image" ? 2000 : 1200,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            { type: "text", text: prompt },
          ],
        }],
      };
    } else {
      payload = {
        model: "claude-sonnet-4-5", max_tokens: 2000,
        tools: [
          { type: "web_fetch_20250910", name: "web_fetch", max_uses: 5 },
          { type: "web_search_20250305", name: "web_search", max_uses: 5 },
        ],
        messages: [{ role: "user", content: prompt }],
      };
    }
    parseText = (data) => {
      const blocks = (data && data.content) || [];
      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].type === "text") return blocks[i].text || "";
      }
      return "";
    };
  } else {
    // OpenAI
    if (!openaiKey) throw new BadRequestError("OpenAI key not configured");
    headers = { "Content-Type": "application/json", "Authorization": "Bearer " + openaiKey };
    if (mode === "image") {
      // Basic catalog scan: vision only, no web search needed.
      const base64 = String(body.base64 || "");
      if (!base64) throw new BadRequestError("Missing base64");
      url = "https://api.openai.com/v1/chat/completions";
      payload = {
        model: "gpt-4o",
        max_tokens: 1200,
        // Do NOT use response_format: json_object — causes content:null on
        // any refusal instead of a real error. Prompt already demands JSON.
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: "data:image/jpeg;base64," + base64 } },
          ],
        }],
      };
      parseText = (data) => {
        const choice = data && data.choices && data.choices[0];
        if (!choice) return "";
        if (choice.finish_reason === "content_filter" || (choice.message && choice.message.refusal)) {
          throw new BadRequestError("OpenAI content filter — try a clearer photo");
        }
        return (choice.message && choice.message.content) || "";
      };
    } else if (mode === "verdict_image") {
      // Buy-verdict scan: two-step approach.
      // Step 1 — extract coffee details from the image (chat completions, vision).
      // Step 2 — web-search verdict using those details (Responses API + web_search_preview).
      // This avoids relying on an uncertain combined vision+web_search API format.
      const base64 = String(body.base64 || "");
      if (!base64) throw new BadRequestError("Missing base64");

      const step1 = $http.send({
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Read this coffee bag carefully. Reply with ONLY a JSON object (no markdown): {\"name\": \"...\", \"roaster\": \"...\", \"origin\": \"...\", \"process\": \"...\", \"varietal\": \"...\", \"notes\": \"...\"}" },
              { type: "image_url", image_url: { url: "data:image/jpeg;base64," + base64 } },
            ],
          }],
        }),
        timeout: 30,
      });
      if (step1.statusCode >= 400) throw new BadRequestError("Image read failed: " + step1.statusCode);
      const imageDetails = (step1.json && step1.json.choices && step1.json.choices[0] && step1.json.choices[0].message && step1.json.choices[0].message.content) || "{}";

      // Step 2: build verdict prompt with extracted details, then web-search.
      url = "https://api.openai.com/v1/responses";
      payload = {
        model: "gpt-4o",
        tools: [{ type: "web_search_preview" }],
        input: prompt + "\n\nDetails extracted from the bag photo:\n" + imageDetails,
      };
      parseText = (data) => {
        if (data && data.output_text) return data.output_text;
        const parts = [];
        ((data && data.output) || []).forEach((o) => {
          ((o && o.content) || []).forEach((c) => { if (c.type === "output_text" && c.text) parts.push(c.text); });
        });
        return parts.join("\n");
      };
    } else {
      // verdict_url and plain url: text prompt + web search.
      url = "https://api.openai.com/v1/responses";
      payload = { model: "gpt-4o", tools: [{ type: "web_search_preview" }], input: prompt };
      parseText = (data) => {
        if (data && data.output_text) return data.output_text;
        const parts = [];
        ((data && data.output) || []).forEach((o) => {
          ((o && o.content) || []).forEach((c) => { if (c.type === "output_text" && c.text) parts.push(c.text); });
        });
        return parts.join("\n");
      };
    }
  }

  const res = $http.send({
    url: url,
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
    timeout: 90,
  });
  if (res.statusCode >= 400) {
    throw new BadRequestError("Provider error " + res.statusCode);
  }
  const text = parseText(res.json);
  if (!text) {
    const finishReason = (res.json && res.json.choices && res.json.choices[0] && res.json.choices[0].finish_reason) || "unknown";
    throw new BadRequestError("AI returned empty response (finish_reason=" + finishReason + ") — try again or use a clearer photo");
  }
  return e.json(200, { text: text, provider: provider });
});
