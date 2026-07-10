import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// hv-pipeline-orchestrator v1
// Runs the full signal engine pipeline in sequence:
//   1. source-engine-fetch  (fetch → source_snapshots)
//   2. hv-extract           (snapshot → hv_import_staging)
//   3. hv-score             (staging → hv_artifacts)
// Writes one record to source_import_batches per run
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DEV_BYPASS_SECRET = Deno.env.get("HV_DEV_BYPASS_SECRET") ?? "";
const CRON_CALLER_HEADER = "x-harbourview-cron-caller";
const EXPECTED_CRON_CALLER = "pg_cron_hv_pipeline";

// PostgREST on this project only exposes the `api` schema (not `public`).
// Without db.schema set, the source_import_batches writes below 406'd with
// PGRST106 on every run.
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "api" },
});

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function authorizeCaller(req: Request): Response | null {
  const cronCaller = req.headers.get(CRON_CALLER_HEADER) ?? "";
  const devBypass = req.headers.get("x-hv-dev-bypass") ?? "";
  if (cronCaller !== EXPECTED_CRON_CALLER && !(DEV_BYPASS_SECRET && devBypass === DEV_BYPASS_SECRET)) {
    return respond(403, { ok: false, error: "forbidden" });
  }
  return null;
}

async function callFunction(
  slug: string,
  params: Record<string, string>,
  devBypass: string
): Promise<{ ok: boolean; data: Record<string, unknown>; durationMs: number }> {
  const qs = new URLSearchParams(params).toString();
  const url = `${SUPABASE_URL}/functions/v1/${slug}${qs ? `?${qs}` : ""}`;
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "x-harbourview-cron-caller": `pg_cron_${slug.replace(/-/g, "_")}`,
      ...(devBypass ? { "x-hv-dev-bypass": devBypass } : {}),
    },
  });
  const data = await res.json();
  return { ok: res.ok && data?.ok === true, data, durationMs: Date.now() - start };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return respond(405, { ok: false, error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return respond(500, { ok: false, error: "missing_env" });

  const authRejection = authorizeCaller(req);
  if (authRejection) return authRejection;

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "true";
  const devBypass = req.headers.get("x-hv-dev-bypass") ?? "";
  const adapter = url.searchParams.get("adapter") ?? "rss";
  const tier = url.searchParams.get("tier") ?? "";
  const fetchLimit = url.searchParams.get("fetch_limit") ?? "20";
  const extractLimit = url.searchParams.get("extract_limit") ?? "10";
  const scoreLimit = url.searchParams.get("score_limit") ?? "25";

  const batchId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const runLog: Record<string, unknown>[] = [];

  // Write batch record as 'running'
  if (!dryRun) {
    await supabase.from("source_import_batches").insert({
      id: crypto.randomUUID(),
      batch_id: batchId,
      source_version: "pipeline-orchestrator@1.0.0",
      source_count_expected: Number(fetchLimit),
      records_received: 0,
      records_inserted: 0,
      records_updated: 0,
      records_rejected: 0,
      status: "running",
      started_at: startedAt,
      created_at: startedAt,
    });
  }

  let totalFetched = 0;
  let totalExtracted = 0;
  let totalStaged = 0;
  let totalPromoted = 0;
  let totalRejected = 0;
  let pipelineStatus = "completed";
  let errorSummary: string | null = null;

  try {
    // Stage 1: Fetch
    const fetchParams: Record<string, string> = {
      adapter,
      limit: fetchLimit,
      ...(dryRun ? { dry_run: "true" } : {}),
      ...(tier ? { tier } : {}),
    };
    const fetchResult = await callFunction("source-engine-fetch", fetchParams, devBypass);
    runLog.push({ stage: "fetch", ...fetchResult });
    if (!fetchResult.ok) throw new Error(`fetch_stage_failed: ${JSON.stringify(fetchResult.data).slice(0, 200)}`);
    totalFetched = (fetchResult.data.inserted as number) ?? 0;

    // Stage 2: Extract
    const extractResult = await callFunction("hv-extract", {
      limit: extractLimit,
      ...(dryRun ? { dry_run: "true" } : {}),
    }, devBypass);
    runLog.push({ stage: "extract", ...extractResult });
    if (!extractResult.ok) throw new Error(`extract_stage_failed: ${JSON.stringify(extractResult.data).slice(0, 200)}`);
    totalExtracted = (extractResult.data.extracted as number) ?? 0;
    totalStaged = (extractResult.data.staged as number) ?? 0;

    // Stage 3: Score
    const scoreResult = await callFunction("hv-score", {
      limit: scoreLimit,
      ...(dryRun ? { dry_run: "true" } : {}),
    }, devBypass);
    runLog.push({ stage: "score", ...scoreResult });
    if (!scoreResult.ok) throw new Error(`score_stage_failed: ${JSON.stringify(scoreResult.data).slice(0, 200)}`);
    totalPromoted = (scoreResult.data.promoted as number) ?? 0;
    totalRejected = (scoreResult.data.rejected as number) ?? 0;

  } catch (err) {
    pipelineStatus = "failed";
    errorSummary = err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500);
  }

  const completedAt = new Date().toISOString();

  // Update batch record
  if (!dryRun) {
    await supabase
      .from("source_import_batches")
      .update({
        records_received: totalFetched + totalExtracted,
        records_inserted: totalPromoted,
        records_updated: 0,
        records_rejected: totalRejected,
        status: pipelineStatus,
        error_summary: errorSummary,
        completed_at: completedAt,
      })
      .eq("batch_id", batchId);
  }

  return respond(pipelineStatus === "failed" ? 500 : 200, {
    ok: pipelineStatus !== "failed",
    function: "hv-pipeline-orchestrator",
    version: "1.0.0",
    mode: dryRun ? "dry_run" : "live",
    batch_id: batchId,
    pipeline_status: pipelineStatus,
    started_at: startedAt,
    completed_at: completedAt,
    totals: {
      fetched: totalFetched,
      extracted: totalExtracted,
      staged: totalStaged,
      promoted: totalPromoted,
      rejected: totalRejected,
    },
    error_summary: errorSummary,
    stage_log: runLog,
  });
});
