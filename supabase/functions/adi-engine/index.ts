import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ADI_SECRET  = Deno.env.get("ADI_ENGINE_SECRET")  ?? "";
const ODDS_KEY    = Deno.env.get("THE_ODDS_API_KEY")   ?? "";

const SPORTS: Record<string, string> = {
  nfl:  "americanfootball_nfl",
  nba:  "basketball_nba",
  mlb:  "baseball_mlb",
  nhl:  "icehockey_nhl",
  nba_preseason: "basketball_nba_preseason",
};

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };
function resp(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return resp(405, { error: "POST only" });

  const secret = req.headers.get("x-adi-secret") ?? "";
  if (!ADI_SECRET || secret !== ADI_SECRET) return resp(401, { error: "unauthorized" });

  const params = new URL(req.url).searchParams;
  const sport  = params.get("sport") ?? "nfl";
  const key    = SPORTS[sport];
  if (!key) return resp(400, { error: "unknown_sport", valid: Object.keys(SPORTS) });

  if (!ODDS_KEY) return resp(500, { error: "THE_ODDS_API_KEY not set" });

  // PostgREST on this project only exposes the `api` schema (not `public`).
  // The adi_cache and adi_source_log tables live in `public` but are accessed
  // through api.* views. Without db.schema set, writes 406'd with PGRST106.
  // Note: adi_cache and adi_source_log must have corresponding views in the api
  // schema (GRANT already applied to service_role in migration 20260629220100).
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    db:   { schema: "api" },
  });

  // Check cache (15-min TTL)
  const cacheKey = `odds:${sport}`;
  const { data: cached } = await sb
    .from("adi_cache")
    .select("payload, fetched_at")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetched_at as string).getTime();
    if (ageMs < 15 * 60 * 1000) {
      return resp(200, { ok: true, sport, source: "cache", age_ms: ageMs, data: cached.payload });
    }
  }

  // Fetch fresh from The Odds API
  const oddsUrl = `https://api.the-odds-api.com/v4/sports/${key}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
  const oddsRes = await fetch(oddsUrl);
  if (!oddsRes.ok) {
    await sb.from("adi_source_log").insert({
      sport, status: "error", http_status: oddsRes.status,
      error_message: await oddsRes.text().then(t => t.slice(0, 500)),
    });
    return resp(502, { error: "odds_api_error", http_status: oddsRes.status });
  }

  const odds = await oddsRes.json();
  const now  = new Date().toISOString();

  // Upsert cache
  await sb.from("adi_cache").upsert(
    { cache_key: cacheKey, payload: odds, fetched_at: now },
    { onConflict: "cache_key" }
  );

  // Log the successful fetch
  await sb.from("adi_source_log").insert({
    sport, status: "ok", http_status: 200, game_count: Array.isArray(odds) ? odds.length : 0, fetched_at: now,
  });

  return resp(200, { ok: true, sport, source: "live", fetched_at: now, data: odds });
});
