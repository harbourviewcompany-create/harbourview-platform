import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL       = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY  = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const OPENAI_API_KEY     = Deno.env.get("OPENAI_API_KEY") ?? "";
const DEV_BYPASS_SECRET  = Deno.env.get("HV_DEV_BYPASS_SECRET") ?? "";
const CRON_CALLER_HEADER = "x-harbourview-cron-caller";
const EXPECTED_CRON_CALLER = "pg_cron_hv_extract";
const HV_WORKSPACE_ID   = "a85840b4-c522-4cb8-9097-2f6c30a78417";

// PostgREST on this project only exposes the `api` schema (not `public`).
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "api" },
});

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

type Snapshot = {
  id: string; source_id: string; captured_url: string;
  captured_title: string | null; captured_text: string | null;
  signal_candidates: Record<string, unknown> | null;
  raw_html_hash: string | null; language_detected: string | null;
};

type ExtractionResult = {
  signal_type: string; jurisdiction: string | null; country_iso: string | null;
  key_entities: string[]; effective_date: string | null; summary: string;
  relevance_score: number; confidence: "high" | "medium" | "low";
  keywords_matched: string[];
};

const EXTRACTION_SYSTEM = `You are a cannabis industry intelligence extractor. Extract structured signal data from the provided content and return ONLY a valid JSON object — no prose, no markdown, no explanation, no code fences.

Return exactly this structure:
{"signal_type":"regulatory_change|enforcement_action|market_entry|policy_update|licensing|recall|research|other|none","jurisdiction":"string or null","country_iso":"ISO 3166-1 alpha-2 or null","key_entities":["array of named organizations, regulators, or persons — max 8"],"effective_date":"YYYY-MM-DD or null","summary":"1-2 sentence plain English summary of the cannabis-relevant signal","relevance_score":0,"confidence":"high|medium|low","keywords_matched":["cannabis-relevant keywords found — max 10"]}

If the content contains no cannabis-relevant signal, return: {"signal_type":"none","relevance_score":0,"confidence":"high","summary":"","key_entities":[],"keywords_matched":[],"jurisdiction":null,"country_iso":null,"effective_date":null}`;

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function authorizeCaller(req: Request): Response | null {
  const cronCaller = req.headers.get(CRON_CALLER_HEADER) ?? "";
  const devBypass  = req.headers.get("x-hv-dev-bypass") ?? "";
  if (cronCaller !== EXPECTED_CRON_CALLER && !(DEV_BYPASS_SECRET && devBypass === DEV_BYPASS_SECRET)) {
    return respond(403, { ok: false, error: "forbidden" });
  }
  return null;
}

function buildUserContent(snapshot: Snapshot): string {
  return [
    snapshot.captured_title ? `TITLE: ${snapshot.captured_title}` : null,
    snapshot.captured_text  ? `CONTENT:\n${snapshot.captured_text.slice(0, 8000)}` : null,
    `SOURCE URL: ${snapshot.captured_url}`,
    snapshot.signal_candidates?.source_type    ? `SOURCE TYPE: ${snapshot.signal_candidates.source_type}`    : null,
    snapshot.signal_candidates?.source_country ? `COUNTRY: ${snapshot.signal_candidates.source_country}`    : null,
    snapshot.signal_candidates?.source_region  ? `REGION: ${snapshot.signal_candidates.source_region}`     : null,
  ].filter(Boolean).join("\n\n");
}

// ── Extraction via Anthropic (primary) ───────────────────────────────────────
async function extractAnthropic(snapshot: Snapshot): Promise<ExtractionResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      temperature: 0,
      system: EXTRACTION_SYSTEM,
      messages: [{ role: "user", content: buildUserContent(snapshot) }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse((data?.content?.[0]?.text ?? "").replace(/```json|```/g, "").trim());
}

// ── Extraction via OpenAI (fallback when ANTHROPIC_API_KEY absent) ────────────
async function extractOpenAI(snapshot: Snapshot): Promise<ExtractionResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 800,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM },
        { role: "user",   content: buildUserContent(snapshot) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
}

async function extractSignal(snapshot: Snapshot): Promise<ExtractionResult> {
  if (ANTHROPIC_API_KEY) return extractAnthropic(snapshot);
  if (OPENAI_API_KEY)    return extractOpenAI(snapshot);
  throw new Error("no_llm_api_key: set ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY");
}

async function sha256(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function mapSignalTypeToObjectClass(t: string): string {
  return ({ regulatory_change:"regulatory_event", enforcement_action:"regulatory_event",
    policy_update:"regulatory_event", licensing:"licence", market_entry:"regulatory_event",
    recall:"regulatory_event", research:"source_document", other:"source_document",
    none:"source_document" } as Record<string,string>)[t] ?? "source_document";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST")    return respond(405, { ok: false, error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return respond(500, { ok: false, error: "missing_supabase_env" });
  if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) return respond(500, { ok: false, error: "no_llm_api_key", detail: "set ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY" });

  const rejection = authorizeCaller(req);
  if (rejection) return rejection;

  const url         = new URL(req.url);
  const dryRun      = url.searchParams.get("dry_run") === "true";
  const snapshotId  = url.searchParams.get("snapshot_id");
  const rawLimit    = Number(url.searchParams.get("limit") ?? "10");
  const limit       = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 10, 25));
  const minRelevance = Number(url.searchParams.get("min_relevance") ?? "30");
  const llmBackend  = ANTHROPIC_API_KEY ? "claude-haiku-4-5" : "gpt-4o-mini";

  let query = supabase
    .from("source_snapshots")
    .select("id,source_id,captured_url,captured_title,captured_text,signal_candidates,raw_html_hash,language_detected")
    .eq("fetch_status", "success")
    .not("captured_text", "is", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (snapshotId) query = query.eq("id", snapshotId);

  const { data: snapshots, error: fetchErr } = await query;
  if (fetchErr) return respond(500, { ok: false, error: "snapshot_query_failed", detail: fetchErr.message });

  const results: Record<string, unknown>[] = [];
  let extracted = 0, staged = 0, skippedLowRelevance = 0, failed = 0;
  const batchId = crypto.randomUUID();

  for (const snapshot of (snapshots ?? []) as Snapshot[]) {
    try {
      const extraction = await extractSignal(snapshot);
      extracted++;

      if (extraction.signal_type === "none" || extraction.relevance_score < minRelevance) {
        skippedLowRelevance++;
        if (!dryRun) await supabase.from("source_snapshots").update({ fetch_status: "extracted" }).eq("id", snapshot.id);
        results.push({ snapshot_id: snapshot.id, status: "skipped", reason: "low_relevance", signal_type: extraction.signal_type, relevance_score: extraction.relevance_score });
        continue;
      }

      const rawPayload    = { snapshot_id: snapshot.id, source_id: snapshot.source_id, captured_url: snapshot.captured_url, captured_title: snapshot.captured_title, extraction, signal_candidates: snapshot.signal_candidates };
      const rawPayloadHash  = await sha256(JSON.stringify(rawPayload));
      const normalizedHash  = await sha256(`${extraction.signal_type}|${extraction.jurisdiction ?? ""}|${extraction.summary}`);
      const contentHash     = await sha256(`${snapshot.captured_url}|${extraction.summary}`);

      if (!dryRun) {
        const { data: dupCheck } = await supabase.from("hv_import_staging").select("id").eq("normalized_hash", normalizedHash).limit(1);
        const isDuplicate = Boolean(dupCheck?.length);

        const { error: stageErr } = await supabase.from("hv_import_staging").insert({
          workspace_id: HV_WORKSPACE_ID,
          source_system: "source_engine",
          source_record_id: snapshot.id,
          source_url: snapshot.captured_url,
          import_batch_id: batchId,
          importer_version: `hv-extract@1.1.0+${ANTHROPIC_API_KEY ? "anthropic" : "openai"}`,
          transform_version: llmBackend,
          raw_payload: rawPayload,
          raw_payload_hash: rawPayloadHash,
          normalized_payload: { signal_type: extraction.signal_type, jurisdiction: extraction.jurisdiction, country_iso: extraction.country_iso, key_entities: extraction.key_entities, effective_date: extraction.effective_date, summary: extraction.summary, relevance_score: extraction.relevance_score, confidence: extraction.confidence, keywords_matched: extraction.keywords_matched, source_type: snapshot.signal_candidates?.source_type ?? null, source_country: snapshot.signal_candidates?.source_country ?? null, source_region: snapshot.signal_candidates?.source_region ?? null, tier: snapshot.signal_candidates?.tier ?? null, language: snapshot.language_detected ?? "en" },
          normalized_hash: normalizedHash,
          proposed_object_class: mapSignalTypeToObjectClass(extraction.signal_type),
          proposed_classification: "public",
          proposed_title: (snapshot.captured_title ?? extraction.summary).slice(0, 500),
          proposed_jurisdiction: extraction.jurisdiction,
          proposed_country_iso: extraction.country_iso,
          content_hash: contentHash,
          is_duplicate_candidate: isDuplicate,
          duplicate_confidence: isDuplicate ? 0.95 : null,
          status: "pending",
          retry_count: 0,
        });
        if (stageErr) throw new Error(`staging_insert_failed: ${stageErr.message}`);
        await supabase.from("source_snapshots").update({ fetch_status: "extracted" }).eq("id", snapshot.id);
        staged++;
      }

      results.push({ snapshot_id: snapshot.id, status: dryRun ? "dry_run" : "staged", signal_type: extraction.signal_type, relevance_score: extraction.relevance_score, confidence: extraction.confidence, jurisdiction: extraction.jurisdiction, country_iso: extraction.country_iso, summary: extraction.summary });

    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      if (!dryRun) await supabase.from("source_snapshots").update({ fetch_status: "extract_failed", error_message: msg.slice(0, 500) }).eq("id", snapshot.id);
      results.push({ snapshot_id: snapshot.id, status: "error", error: msg.slice(0, 200) });
    }
  }

  return respond(200, { ok: true, function: "hv-extract", version: "1.1.0", mode: dryRun ? "dry_run" : "live", llm_backend: llmBackend, batch_id: dryRun ? null : batchId, snapshots_considered: snapshots?.length ?? 0, extracted, staged, skipped_low_relevance: skippedLowRelevance, failed, min_relevance_threshold: minRelevance, results });
});
