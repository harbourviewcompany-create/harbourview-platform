import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const HEADER = "x-harbourview-cron-caller";
const EXPECTED = "pg_cron_hv_private_pipeline_runner";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

async function callFunction(slug: string, caller: string, params: Record<string, string>) {
  const url = `${SUPABASE_URL}/functions/v1/${slug}?${new URLSearchParams(params).toString()}`;
  const started = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      [HEADER]: caller,
    },
  });
  const data = await res.json().catch(() => ({ ok: false, error: "non_json_response" }));
  return { slug, ok: res.ok && data?.ok === true, status: res.status, ms: Date.now() - started, data };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { ok: false, error: "missing_env" });
  if ((req.headers.get(HEADER) ?? "") !== EXPECTED) return json(403, { ok: false, error: "forbidden" });

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "true";
  const extractLimit = Math.max(1, Math.min(Number(url.searchParams.get("extract_limit") ?? "5"), 10));
  const scoreLimit = Math.max(1, Math.min(Number(url.searchParams.get("score_limit") ?? "10"), 25));
  const minRelevance = url.searchParams.get("min_relevance") ?? "30";
  const threshold = url.searchParams.get("threshold") ?? "40";

  const extract = await callFunction("hv-extract", "pg_cron_hv_extract", {
    limit: String(extractLimit),
    min_relevance: minRelevance,
    ...(dryRun ? { dry_run: "true" } : {}),
  });
  if (!extract.ok) return json(500, { ok: false, stage: "extract", extract });

  const score = await callFunction("hv-score", "pg_cron_hv_score", {
    limit: String(scoreLimit),
    threshold,
    ...(dryRun ? { dry_run: "true" } : {}),
  });
  if (!score.ok) return json(500, { ok: false, stage: "score", extract, score });

  return json(200, { ok: true, function: "hv-private-pipeline-runner", mode: dryRun ? "dry_run" : "live", extract, score });
});
