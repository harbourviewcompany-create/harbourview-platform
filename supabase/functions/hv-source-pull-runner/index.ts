import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("HV_SOURCE_PULL_RUNNER_SECRET") ?? "";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { ok: false, error: "missing_env" });
  if (!CRON_SECRET) return json(503, { ok: false, error: "service_not_configured" });
  if ((req.headers.get("x-harbourview-cron-secret") ?? "") !== CRON_SECRET) {
    return json(403, { ok: false, error: "forbidden" });
  }

  const url = new URL(req.url);
  const adapter = url.searchParams.get("adapter") ?? "";
  const tier = url.searchParams.get("tier") ?? "1";
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") ?? "8"), 20));
  const dryRun = url.searchParams.get("dry_run") === "true";

  const params: Record<string, string> = { limit: String(limit), tier };
  if (adapter) params.adapter = adapter;
  if (dryRun) params.dry_run = "true";

  const qs = new URLSearchParams(params).toString();
  const target = `${SUPABASE_URL}/functions/v1/source-engine-fetch?${qs}`;
  const res = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "x-harbourview-cron-caller": "pg_cron_source_engine_fetch",
    },
  });

  const data = await res.json().catch(() => ({ ok: false, error: "non_json_response" }));
  return json(res.ok ? 200 : 500, {
    ok: res.ok && data?.ok === true,
    function: "hv-source-pull-runner",
    called: "source-engine-fetch",
    filter: { adapter: adapter || "all_active_adapters", tier, limit, dry_run: dryRun },
    result: data,
  });
});
