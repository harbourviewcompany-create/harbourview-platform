import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// hv-score v1
// Reads pending staged signals from hv_import_staging
// Applies composite score: tier + confidence + relevance + signal_type
// Promotes qualifying signals to hv_artifacts
// Updates hv_import_staging status to 'promoted' or 'rejected'
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DEV_BYPASS_SECRET = Deno.env.get("HV_DEV_BYPASS_SECRET") ?? "";
const CRON_CALLER_HEADER = "x-harbourview-cron-caller";
const EXPECTED_CRON_CALLER = "pg_cron_hv_score";

const HV_WORKSPACE_ID = "a85840b4-c522-4cb8-9097-2f6c30a78417";

// Promotion threshold — composite score must exceed this to become an artifact
const DEFAULT_PROMOTE_THRESHOLD = 40;

// PostgREST on this project only exposes the `api` schema (not `public`).
// Without db.schema set, every query below 406'd with PGRST106 and this
// function failed on every invocation.
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "api" },
});

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

type StagedSignal = {
  id: string;
  source_url: string | null;
  source_record_id: string | null;
  import_batch_id: string;
  content_hash: string | null;
  proposed_object_class: string | null;
  proposed_classification: string | null;
  proposed_title: string | null;
  proposed_jurisdiction: string | null;
  proposed_country_iso: string | null;
  is_duplicate_candidate: boolean;
  normalized_payload: {
    signal_type: string;
    jurisdiction: string | null;
    country_iso: string | null;
    key_entities: string[];
    effective_date: string | null;
    summary: string;
    relevance_score: number;
    confidence: "high" | "medium" | "low";
    keywords_matched: string[];
    source_type: string | null;
    source_country: string | null;
    source_region: string | null;
    tier: number | null;
    language: string | null;
  };
};

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function authorizeCaller(req: Request): Response | null {
  const cronCaller = req.headers.get(CRON_CALLER_HEADER) ?? "";
  const devBypass = req.headers.get("x-hv-dev-bypass") ?? "";
  const isCron = cronCaller === EXPECTED_CRON_CALLER;
  const isDev = DEV_BYPASS_SECRET && devBypass === DEV_BYPASS_SECRET;
  if (!isCron && !isDev) {
    return respond(403, { ok: false, error: "forbidden", reason: "Requires cron caller or dev bypass header" });
  }
  return null;
}

// ── Scoring engine ─────────────────────────────────

function scoreConfidence(confidence: string): number {
  return { high: 30, medium: 20, low: 10 }[confidence] ?? 10;
}

function scoreTier(tier: number | null): number {
  return { 1: 30, 2: 20, 3: 10 }[tier ?? 3] ?? 10;
}

function scoreSignalType(signalType: string): number {
  const weights: Record<string, number> = {
    regulatory_change: 25,
    enforcement_action: 25,
    policy_update: 20,
    licensing: 20,
    recall: 20,
    market_entry: 15,
    research: 10,
    other: 5,
    none: 0,
  };
  return weights[signalType] ?? 5;
}

function scoreRelevance(relevanceScore: number): number {
  // Normalize 0-100 relevance into 0-15 composite points
  return Math.round((Math.min(100, Math.max(0, relevanceScore)) / 100) * 15);
}

// A handful of historical staging rows (bulk-approved 2026-06-09/13, before
// hv-extract v1.1.0's payload shape existed) carry a different, older
// normalized_payload shape (title/body/object_class/authority_level instead
// of summary/signal_type/confidence/tier). Rather than crash on missing
// fields, fall back to sensible defaults so legitimate legacy content still
// promotes instead of permanently erroring.
function summaryOf(p: StagedSignal["normalized_payload"]): string {
  return p.summary ?? (p as unknown as { body?: string }).body ?? (p as unknown as { title?: string }).title ?? "";
}

function confidenceOf(p: StagedSignal["normalized_payload"]): string {
  return p.confidence ?? "medium";
}

function signalTypeOf(p: StagedSignal["normalized_payload"]): string {
  return p.signal_type ?? (p as unknown as { object_class?: string }).object_class ?? "other";
}

function computeCompositeScore(signal: StagedSignal): number {
  const p = signal.normalized_payload;
  return (
    scoreConfidence(confidenceOf(p)) +
    scoreTier(p.tier ?? null) +
    scoreSignalType(signalTypeOf(p)) +
    scoreRelevance(p.relevance_score ?? 50)
  );
  // Max possible: 30 + 30 + 25 + 15 = 100
}

function deriveAuthorityLevel(signal: StagedSignal): string {
  // A = highest authority (government regulator, enforcement)
  // B = trade/industry authority
  // C = news/media
  // D-H = lower tiers
  const p = signal.normalized_payload;
  // Some legacy rows already carry a precomputed authority_level — trust it
  // rather than re-derive from fields that don't exist on that payload shape.
  const precomputed = (p as unknown as { authority_level?: string }).authority_level;
  if (precomputed) return precomputed;

  const { source_type, tier } = p;
  const signal_type = signalTypeOf(p);

  if (source_type === "regulator" || signal_type === "enforcement_action") return "A";
  if (source_type === "regulator" || signal_type === "regulatory_change") return "B";
  if (source_type === "trade" && tier === 1) return "B";
  if (source_type === "trade") return "C";
  if (source_type === "news" && tier === 1) return "C";
  if (source_type === "news") return "D";
  return "E";
}

function derivePublicEligible(signal: StagedSignal, compositeScore: number): boolean {
  const p = signal.normalized_payload;
  return (
    !signal.is_duplicate_candidate &&
    compositeScore >= 50 &&
    p.signal_type !== "none" &&
    p.confidence !== "low" &&
    (signal.proposed_classification === "public")
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return respond(405, { ok: false, error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return respond(500, { ok: false, error: "missing_env" });

  const authRejection = authorizeCaller(req);
  if (authRejection) return authRejection;

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "true";
  const stagedIdParam = url.searchParams.get("staged_id");
  const rawLimit = Number(url.searchParams.get("limit") ?? "25");
  const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 25, 100));
  const promoteThreshold = Number(url.searchParams.get("threshold") ?? DEFAULT_PROMOTE_THRESHOLD);

  // Accept both 'pending' (fresh from hv-extract) and 'approved' (rows a
  // human reviewer already signed off on via a manual pass) — a prior bulk
  // review approved 459 rows on 2026-06-09/13 that were never promoted
  // because this query only ever looked for 'pending'.
  let query = supabase
    .from("hv_import_staging")
    .select("id,source_url,source_record_id,import_batch_id,content_hash,proposed_object_class,proposed_classification,proposed_title,proposed_jurisdiction,proposed_country_iso,is_duplicate_candidate,normalized_payload")
    .in("status", ["pending", "approved"])
    .eq("workspace_id", HV_WORKSPACE_ID)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (stagedIdParam) query = query.eq("id", stagedIdParam);

  const { data: staged, error: stageError } = await query;
  if (stageError) return respond(500, { ok: false, error: "staging_query_failed", detail: stageError.message });

  const results: Record<string, unknown>[] = [];
  let promoted = 0;
  let rejected = 0;
  let duplicateHeld = 0;
  let failed = 0;

  for (const signal of (staged ?? []) as StagedSignal[]) {
    try {
      const compositeScore = computeCompositeScore(signal);
      const authorityLevel = deriveAuthorityLevel(signal);
      const publicEligible = derivePublicEligible(signal, compositeScore);
      const p = signal.normalized_payload;

      // Hold duplicates for manual review instead of promoting or rejecting
      if (signal.is_duplicate_candidate) {
        duplicateHeld++;
        if (!dryRun) {
          await supabase
            .from("hv_import_staging")
            .update({ status: "duplicate_review", updated_at: new Date().toISOString() })
            .eq("id", signal.id);
        }
        results.push({
          staged_id: signal.id,
          status: "duplicate_held",
          composite_score: compositeScore,
        });
        continue;
      }

      // Reject below threshold
      if (compositeScore < promoteThreshold) {
        rejected++;
        if (!dryRun) {
          await supabase
            .from("hv_import_staging")
            .update({
              status: "rejected",
              rejection_reason: `composite_score_${compositeScore}_below_threshold_${promoteThreshold}`,
              rejected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", signal.id);
        }
        results.push({
          staged_id: signal.id,
          status: "rejected",
          composite_score: compositeScore,
          threshold: promoteThreshold,
        });
        continue;
      }

      // Promote to hv_artifacts
      if (!dryRun) {
        const artifactId = crypto.randomUUID();
        const now = new Date().toISOString();

        const { error: artifactError } = await supabase
          .from("hv_artifacts")
          .insert({
            id: artifactId,
            workspace_id: HV_WORKSPACE_ID,
            object_class: signal.proposed_object_class ?? "source_document",
            classification: signal.proposed_classification ?? "public",
            authority_level: authorityLevel,
            title: signal.proposed_title ?? summaryOf(p).slice(0, 500),
            body: summaryOf(p),
            structured_data: {
              signal_type: p.signal_type,
              jurisdiction: p.jurisdiction,
              country_iso: p.country_iso,
              key_entities: p.key_entities,
              effective_date: p.effective_date,
              keywords_matched: p.keywords_matched,
              confidence: p.confidence,
              relevance_score: p.relevance_score,
              composite_score: compositeScore,
              source_type: p.source_type,
              source_region: p.source_region,
              tier: p.tier,
              language: p.language,
            },
            source_system: "source_engine",
            source_record_id: signal.source_record_id,
            source_url: signal.source_url,
            import_batch_id: signal.import_batch_id,
            content_hash: signal.content_hash,
            lifecycle_stage: "normalized",
            review_status: "pending",
            freshness: "fresh",
            public_eligible: publicEligible,
            is_duplicate_candidate: false,
            jurisdiction_code: signal.proposed_jurisdiction,
            country_iso: signal.proposed_country_iso,
            region: p.source_region,
            published_at: p.effective_date ? new Date(p.effective_date).toISOString() : null,
            created_at: now,
            updated_at: now,
          });

        if (artifactError) throw new Error(`artifact_insert_failed: ${artifactError.message}`);

        // Update staging record as promoted
        await supabase
          .from("hv_import_staging")
          .update({
            status: "promoted",
            promoted_artifact_id: artifactId,
            promoted_at: now,
            updated_at: now,
          })
          .eq("id", signal.id);

        promoted++;
      }

      results.push({
        staged_id: signal.id,
        status: dryRun ? "dry_run_would_promote" : "promoted",
        composite_score: compositeScore,
        authority_level: authorityLevel,
        public_eligible: publicEligible,
        signal_type: p.signal_type,
        confidence: p.confidence,
        tier: p.tier,
        jurisdiction: p.jurisdiction,
        summary: summaryOf(p).slice(0, 200),
      });

    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      if (!dryRun) {
        await supabase
          .from("hv_import_staging")
          .update({
            status: "error",
            error_message: message.slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq("id", signal.id);
      }
      results.push({ staged_id: signal.id, status: "error", error: message.slice(0, 200) });
    }
  }

  return respond(200, {
    ok: true,
    function: "hv-score",
    version: "1.0.0",
    mode: dryRun ? "dry_run" : "live",
    promote_threshold: promoteThreshold,
    signals_considered: staged?.length ?? 0,
    promoted,
    rejected,
    duplicate_held: duplicateHeld,
    failed,
    results,
  });
});
