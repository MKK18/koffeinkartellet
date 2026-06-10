/// <reference path="../pb_data/types.d.ts" />
//
// Rate-limit the AI endpoints. /api/ai/scan spends the shared (server-owned)
// API key, and fetch-image/page-meta make outbound requests — without a cap a
// single authed user could run up unbounded cost or hammer third-party sites.
// Enabling the limiter with only these rules leaves every other route
// unthrottled (PocketBase applies no implicit default rules).
//
// Configurable via env:
//   AI_RATE_MAX       default 40 requests
//   AI_RATE_WINDOW    default 60 seconds
onBootstrap((e) => {
  e.next();
  try {
    const s = $app.settings();
    const max = Number($os.getenv("AI_RATE_MAX") || 40);
    const window = Number($os.getenv("AI_RATE_WINDOW") || 60);

    s.rateLimits.enabled = true;
    // Prepend our rule. PocketBase keeps default rules (e.g. "/api/" at 300/10s)
    // and findRateLimitRule returns the FIRST match — so our stricter AI rule
    // must come before the broad "/api/" rule to actually take effect.
    const rest = (s.rateLimits.rules || []).filter((r) => r.label !== "/api/ai/");
    s.rateLimits.rules = [
      { label: "/api/ai/", audience: "@auth", duration: window, maxRequests: max },
    ].concat(rest);

    $app.save(s);
    console.log("[ratelimits] /api/ai/ capped at", max, "req /", window, "s per user");
  } catch (err) {
    console.log("[ratelimits] configuration failed:", err);
  }
});
