import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Inbound write-back: Airtable "Tier" edit -> Supabase.
// Called by an Airtable automation (Run script action).
// Auth: gateway JWT (verify_jwt) + internal x-hv-sync-key header matched against vault.
// Applies the change via api.apply_airtable_tier, which stamps the loop guard so the
// outbound trigger does not echo it back to Airtable.

const VALID_TIERS = new Set([
  "legal_commercial_access",
  "medical_limited_trade",
  "domestic_only",
  "cbd_hemp_only",
  "prohibited",
]);

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "missing_runtime_env" }, 500);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: cfg, error: cfgErr } = await admin.schema("api").rpc("get_airtable_sync_config");
    if (cfgErr) return json({ error: "config_lookup_failed", detail: cfgErr.message }, 500);
    const syncKey: string | null = cfg?.sync_key ?? null;

    const provided = req.headers.get("x-hv-sync-key") ?? "";
    if (!syncKey || provided !== syncKey) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "bad_body" }, 400);

    const { iso, tier, rationale } = body as Record<string, unknown>;
    if (!iso || typeof iso !== "string") return json({ error: "missing_iso" }, 400);
    if (!tier || typeof tier !== "string" || !VALID_TIERS.has(tier)) {
      return json({ error: "invalid_tier", tier }, 400);
    }

    const { data, error } = await admin.schema("api").rpc("apply_airtable_tier", {
      p_iso: iso,
      p_tier: tier,
      p_rationale: typeof rationale === "string" ? rationale : null,
    });
    if (error) return json({ error: "apply_failed", detail: error.message }, 502);

    return json({ ok: true, iso, tier, applied: data ?? null });
  } catch (e) {
    return json({ error: "unhandled", detail: String(e) }, 500);
  }
});
