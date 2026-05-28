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

// Base64 encoder that works on any byte-as-string input (no btoa dependency).
function bytesToBase64(s) {
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  const len = s.length;
  for (let i = 0; i < len; i += 3) {
    const a = s.charCodeAt(i) & 0xff;
    const b = (i + 1 < len) ? s.charCodeAt(i + 1) & 0xff : 0;
    const c = (i + 2 < len) ? s.charCodeAt(i + 2) & 0xff : 0;
    const t = (a << 16) | (b << 8) | c;
    out += ABC[(t >> 18) & 63] + ABC[(t >> 12) & 63];
    out += (i + 1 < len) ? ABC[(t >> 6) & 63] : "=";
    out += (i + 2 < len) ? ABC[t & 63] : "=";
  }
  return out;
}

// Authed: server-side image fetcher. Used when the browser can't cross-fetch a
// roaster's product image (CORS). Body: { url }. Returns { base64, contentType }.
routerAdd("POST", "/api/ai/fetch-image", (e) => {
  if (!e.auth || !e.auth.id) throw new ForbiddenError("Sign in required");
  const body = e.requestInfo().body || {};
  const url = String(body.url || "");
  if (!/^https?:\/\//i.test(url)) throw new BadRequestError("Invalid URL");
  const res = $http.send({ url: url, method: "GET", timeout: 30 });
  if (res.statusCode >= 400) throw new BadRequestError("Image fetch failed: " + res.statusCode);
  const ct = (res.headers && res.headers["Content-Type"] && res.headers["Content-Type"][0]) || "application/octet-stream";
  if (!ct.startsWith("image/")) throw new BadRequestError("Not an image (" + ct + ")");
  // res.body is the raw response string (bytes as a binary-safe string in JSVM).
  return e.json(200, { base64: bytesToBase64(res.body || ""), contentType: ct });
});

// Authed: scan an image or a URL using the configured global key.
// Body: { mode: "image" | "url", prompt: string, base64?: string, url?: string, provider?: "anthropic" | "openai" }
routerAdd("POST", "/api/ai/scan", (e) => {
  if (!e.auth || !e.auth.id) {
    throw new ForbiddenError("Sign in required");
  }
  const body = e.requestInfo().body || {};
  const mode = body.mode === "url" ? "url" : "image";
  const prompt = String(body.prompt || "");
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
    if (mode === "image") {
      const base64 = String(body.base64 || "");
      if (!base64) throw new BadRequestError("Missing base64");
      payload = {
        model: "claude-sonnet-4-5", max_tokens: 1200,
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
      const base64 = String(body.base64 || "");
      if (!base64) throw new BadRequestError("Missing base64");
      url = "https://api.openai.com/v1/chat/completions";
      payload = {
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: "data:image/jpeg;base64," + base64 } },
          ],
        }],
      };
      parseText = (data) => (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    } else {
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
  return e.json(200, { text: text, provider: provider });
});
