import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL       = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY  = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const GEMINI_API_KEY     = Deno.env.get("GEMINI_API_KEY") ?? "";
const OPENAI_API_KEY     = Deno.env.get("OPENAI_API_KEY") ?? "";
const DEV_BYPASS_SECRET  = Deno.env.get("HV_DEV_BYPASS_SECRET") ?? "";
const CRON_CALLER_HEADER = "x-harbourview-cron-caller";
const EXPECTED_CRON_CALLERS = new Set([
  "pg_cron_hv_extract",
  "79cf9af4da7fd08d06c010239443d100081ee43e10dfe93fab4f7471b765f81c",
]);
const HV_WORKSPACE_ID   = "a85840b4-c522-4cb8-9097-2f6c30a78417";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "api" },
});

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

const BACKEND_MODEL: Record<string, string> = {
  anthropic: "claude-haiku-4-5",
  gemini: "gemini-3.5-flash",
  openai: "gpt-4o-mini",
};

type Snapshot = {
  id: string; source_id: string; captured_url: string;
  captured_title: string | null; captured_text: string | null;
  signal_candidates: Record<string, unknown> | null;
  raw_html_hash: string | null; language_detected: string | null;
  source_type?: string | null; source_country?: string | null; source_region?: string | null;
  captured_at?: string | null; published_at?: string | null;
};

type ExtractionResult = {
  signal_type: string; jurisdiction: string | null; country_iso: string | null;
  key_entities: string[]; effective_date: string | null; summary: string;
  relevance_score: number; confidence: "high" | "medium" | "low";
  keywords_matched: string[];
};

type EditorialResult = {
  is_cannabis_relevant: boolean;
  headline: string; summary: string; why_it_matters: string;
  tone: "news" | "opinion" | "feature" | "investigative" | "other";
  country: string | null; language: string | null;
};

const EXTRACTION_SYSTEM = `You are a cannabis industry intelligence extractor. Extract structured signal data from the provided content and return ONLY a valid JSON object -- no prose, no markdown, no explanation, no code fences.

Return exactly this structure:
{"signal_type":"regulatory_change|enforcement_action|market_entry|policy_update|licensing|recall|research|other|none","jurisdiction":"string or null","country_iso":"ISO 3166-1 alpha-2 or null","key_entities":["array of named organizations, regulators, or persons -- max 8"],"effective_date":"YYYY-MM-DD or null","summary":"1-2 sentence plain English summary of the cannabis-relevant signal","relevance_score":0,"confidence":"high|medium|low","keywords_matched":["cannabis-relevant keywords found -- max 10"]}

If the content contains no cannabis-relevant signal, return: {"signal_type":"none","relevance_score":0,"confidence":"high","summary":"","key_entities":[],"keywords_matched":[],"jurisdiction":null,"country_iso":null,"effective_date":null}`;

const EDITORIAL_SYSTEM = `You are an editor curating a global cannabis news digest for a general audience, sourced from mainstream (non-cannabis-industry) news outlets. Read the article and return ONLY a valid JSON object -- no prose, no markdown, no code fences.

Return exactly this structure:
{"is_cannabis_relevant":true|false,"headline":"a sharp original headline, max 110 chars, in your own words -- never copy the source's headline verbatim","summary":"1-2 sentence plain-language summary IN YOUR OWN WORDS, no direct quotes","why_it_matters":"one editorial sentence on why a globally-minded reader would care","tone":"news|opinion|feature|investigative|other","country":"country the story is primarily about, or null","language":"ISO 639-1 code of the original article, or null"}

Set is_cannabis_relevant to false or reject if: the piece is a press release, sponsored content, or reads like industry trade coverage (e.g. product launches, company financials, B2B marketplace activity) rather than general-audience news, editorial, or cultural coverage. If not cannabis-relevant, return: {"is_cannabis_relevant":false,"headline":"","summary":"","why_it_matters":"","tone":"other","country":null,"language":null}`;

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function authorizeCaller(req: Request): Response | null {
  const cronCaller = req.headers.get(CRON_CALLER_HEADER) ?? "";
  const devBypass  = req.headers.get("x-hv-dev-bypass") ?? "";
  if (!EXPECTED_CRON_CALLERS.has(cronCaller) && !(DEV_BYPASS_SECRET && devBypass === DEV_BYPASS_SECRET)) {
    return respond(403, { ok: false, error: "forbidden" });
  }
  return null;
}

function buildUserContent(snapshot: Snapshot): string {
  return [
    snapshot.captured_title ? `TITLE: ${snapshot.captured_title}` : null,
    snapshot.captured_text  ? `CONTENT:\n${snapshot.captured_text.slice(0, 8000)}` : null,
    `SOURCE URL: ${snapshot.captured_url}`,
    snapshot.source_type    ? `SOURCE TYPE: ${snapshot.source_type}`    : null,
    snapshot.source_country ? `COUNTRY: ${snapshot.source_country}`    : null,
    snapshot.source_region  ? `REGION: ${snapshot.source_region}`      : null,
  ].filter(Boolean).join("\n\n");
}

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

async function extractGemini(snapshot: Snapshot): Promise<ExtractionResult> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildUserContent(snapshot) }] }],
        systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM }] },
        generationConfig: { temperature: 0, maxOutputTokens: 800, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

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

async function extractSignal(snapshot: Snapshot): Promise<{ result: ExtractionResult; backend: string } | null> {
  // 2026-07-21: OpenAI tried first. Anthropic/Gemini keys exist but are
  // billing-blocked (won't be funded until the product makes money --
  // Tyler's call); trying them first wasted a guaranteed-fail round trip
  // on every single extraction. See matching note in hv-classify/index.ts.
  const attempts: Array<[string, () => Promise<ExtractionResult>]> = [];
  if (OPENAI_API_KEY)    attempts.push(["openai",    () => extractOpenAI(snapshot)]);
  if (ANTHROPIC_API_KEY) attempts.push(["anthropic", () => extractAnthropic(snapshot)]);
  if (GEMINI_API_KEY)    attempts.push(["gemini",    () => extractGemini(snapshot)]);

  const errors: string[] = [];
  for (const [backend, fn] of attempts) {
    try { return { result: await fn(), backend }; }
    catch (e) { errors.push(`${backend}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  if (attempts.length === 0) errors.push("no_llm_api_key: set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY");
  (extractSignal as any)._lastError = errors.join(" | ");
  return null;
}

async function extractEditorialAnthropic(snapshot: Snapshot): Promise<EditorialResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      temperature: 0,
      system: EDITORIAL_SYSTEM,
      messages: [{ role: "user", content: buildUserContent(snapshot) }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse((data?.content?.[0]?.text ?? "").replace(/```json|```/g, "").trim());
}

async function extractEditorialGemini(snapshot: Snapshot): Promise<EditorialResult> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildUserContent(snapshot) }] }],
        systemInstruction: { parts: [{ text: EDITORIAL_SYSTEM }] },
        generationConfig: { temperature: 0, maxOutputTokens: 600, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function extractEditorialOpenAI(snapshot: Snapshot): Promise<EditorialResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 600,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EDITORIAL_SYSTEM },
        { role: "user",   content: buildUserContent(snapshot) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
}

async function extractEditorial(snapshot: Snapshot): Promise<{ result: EditorialResult; backend: string } | null> {
  // 2026-07-21: OpenAI first -- see extractSignal above for why.
  const attempts: Array<[string, () => Promise<EditorialResult>]> = [];
  if (OPENAI_API_KEY)    attempts.push(["openai",    () => extractEditorialOpenAI(snapshot)]);
  if (ANTHROPIC_API_KEY) attempts.push(["anthropic", () => extractEditorialAnthropic(snapshot)]);
  if (GEMINI_API_KEY)    attempts.push(["gemini",    () => extractEditorialGemini(snapshot)]);

  const errors: string[] = [];
  for (const [backend, fn] of attempts) {
    try { return { result: await fn(), backend }; }
    catch (e) { errors.push(`${backend}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  if (attempts.length === 0) errors.push("no_llm_api_key: set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY");
  (extractEditorial as any)._lastError = errors.join(" | ");
  return null;
}

function isMainstreamMediaSnapshot(snapshot: Snapshot): boolean {
  return snapshot.source_type === "mainstream_media";
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
  if (!ANTHROPIC_API_KEY && !GEMINI_API_KEY && !OPENAI_API_KEY) return respond(500, { ok: false, error: "no_llm_api_key", detail: "set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY (at least one)" });

  const rejection = authorizeCaller(req);
  if (rejection) return rejection;

  const url         = new URL(req.url);
  const dryRun      = url.searchParams.get("dry_run") === "true";
  const snapshotId  = url.searchParams.get("snapshot_id");
  const rawLimit    = Number(url.searchParams.get("limit") ?? "10");
  const limit       = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 10, 25));
  const minRelevance = Number(url.searchParams.get("min_relevance") ?? "30");
  const llmBackend  = ANTHROPIC_API_KEY ? "claude-haiku-4-5" : GEMINI_API_KEY ? "gemini-3.5-flash" : "gpt-4o-mini";

  let query = supabase
    .from("source_snapshots")
    .select("id,source_id,captured_url,captured_title,captured_text,signal_candidates,raw_html_hash,language_detected,captured_at,published_at")
    .eq("fetch_status", "success")
    .not("captured_text", "is", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (snapshotId) query = query.eq("id", snapshotId);

  const { data: rawSnapshots, error: fetchErr } = await query;
  if (fetchErr) return respond(500, { ok: false, error: "snapshot_query_failed", detail: fetchErr.message });

  const sourceIds = [...new Set((rawSnapshots ?? []).map((s: any) => s.source_id).filter(Boolean))];
  const registryById = new Map<string, { source_type: string | null; source_name: string | null; country: string | null; region: string | null }>();
  if (sourceIds.length > 0) {
    const { data: registryRows, error: registryErr } = await supabase
      .from("source_registry")
      .select("id,source_type,source_name,country,region")
      .in("id", sourceIds);
    if (registryErr) return respond(500, { ok: false, error: "source_registry_query_failed", detail: registryErr.message });
    for (const r of registryRows ?? []) registryById.set(r.id, r);
  }

  const snapshots = (rawSnapshots ?? []).map((s: any) => {
    const reg = registryById.get(s.source_id);
    return {
      ...s,
      source_type:    reg?.source_type   ?? null,
      source_country: reg?.country       ?? null,
      source_region:  reg?.region        ?? null,
      _source_name:   reg?.source_name   ?? null,
    };
  });

  const results: Record<string, unknown>[] = [];
  let extracted = 0, staged = 0, skippedLowRelevance = 0, failed = 0;
  const batchId = crypto.randomUUID();

  for (const snapshot of (snapshots ?? []) as Snapshot[]) {
    try {
      if (isMainstreamMediaSnapshot(snapshot)) {
        const outcome = await extractEditorial(snapshot);
        extracted++;

        if (!outcome) {
          const reason = (extractEditorial as any)._lastError ?? "no_llm_provider_available";
          if (!dryRun) {
            await supabase.from("editorial_items").insert({
              source_id: snapshot.source_id,
              snapshot_id: snapshot.id,
              headline: (snapshot.captured_title ?? "Untitled -- needs manual review").slice(0, 300),
              summary: (snapshot.captured_text ?? "").slice(0, 500),
              why_it_matters: null,
              outlet_name: (snapshot as any)._source_name ?? null,
              source_url: snapshot.captured_url,
              country: snapshot.source_country ?? null,
              region: snapshot.source_region ?? null,
              language: snapshot.language_detected ?? "en",
              tone: "other",
              stage: "needs_review",
              published_at: snapshot.published_at ?? new Date().toISOString(),
            });
            await supabase.from("source_snapshots").update({ fetch_status: "extract_failed", error_message: reason.slice(0, 500) }).eq("id", snapshot.id);
          }
          failed++;
          results.push({ snapshot_id: snapshot.id, status: "needs_review", pipeline: "editorial", reason });
          continue;
        }

        const editorial = outcome.result;

        if (!editorial.is_cannabis_relevant || !editorial.headline) {
          skippedLowRelevance++;
          if (!dryRun) await supabase.from("source_snapshots").update({ fetch_status: "extracted" }).eq("id", snapshot.id);
          results.push({ snapshot_id: snapshot.id, status: "skipped", reason: "not_cannabis_relevant" });
          continue;
        }

        if (!dryRun) {
          const { error: editErr } = await supabase.from("editorial_items").insert({
            source_id: snapshot.source_id,
            snapshot_id: snapshot.id,
            headline: editorial.headline.slice(0, 300),
            summary: editorial.summary,
            why_it_matters: editorial.why_it_matters,
            outlet_name: (snapshot as any)._source_name ?? null,
            source_url: snapshot.captured_url,
            country: editorial.country ?? snapshot.source_country ?? null,
            region: snapshot.source_region ?? null,
            language: editorial.language ?? snapshot.language_detected ?? "en",
            tone: editorial.tone,
            stage: "qualified",
            published_at: snapshot.published_at ?? new Date().toISOString(),
          });
          if (editErr) throw new Error(`editorial_insert_failed: ${editErr.message}`);
          await supabase.from("source_snapshots").update({ fetch_status: "extracted" }).eq("id", snapshot.id);
          staged++;
        }

        results.push({ snapshot_id: snapshot.id, status: dryRun ? "dry_run" : "staged", pipeline: "editorial", headline: editorial.headline, country: editorial.country, backend: outcome.backend });
        continue;
      }

      const outcome = await extractSignal(snapshot);
      extracted++;

      if (!outcome) {
        const reason = (extractSignal as any)._lastError ?? "no_llm_provider_available";
        if (!dryRun) {
          await supabase.from("hv_import_staging").insert({
            workspace_id: HV_WORKSPACE_ID,
            source_system: "source_engine",
            source_record_id: snapshot.id,
            source_url: snapshot.captured_url,
            import_batch_id: batchId,
            importer_version: "hv-extract@1.6.1+needs_review",
            transform_version: "none",
            raw_payload: { snapshot_id: snapshot.id, captured_title: snapshot.captured_title, captured_text: snapshot.captured_text?.slice(0, 2000), error: reason },
            raw_payload_hash: await sha256(`needs_review|${snapshot.id}`),
            normalized_payload: { needs_review: true, reason },
            normalized_hash: await sha256(`needs_review|${snapshot.id}|${Date.now()}`),
            proposed_object_class: "source_document",
            proposed_classification: "public",
            proposed_title: (snapshot.captured_title ?? "Untitled -- needs manual review").slice(0, 500),
            content_hash: await sha256(snapshot.captured_url),
            is_duplicate_candidate: false,
            status: "pending",
            retry_count: 0,
            review_note: `Auto-extraction failed on all configured providers: ${reason.slice(0, 300)}`,
          });
          await supabase.from("source_snapshots").update({ fetch_status: "extract_failed", error_message: reason.slice(0, 500) }).eq("id", snapshot.id);
        }
        failed++;
        results.push({ snapshot_id: snapshot.id, status: "needs_review", pipeline: "signal", reason });
        continue;
      }

      const extraction = outcome.result;

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
          importer_version: `hv-extract@1.6.1+${outcome.backend}`,
          transform_version: BACKEND_MODEL[outcome.backend] ?? outcome.backend,
          raw_payload: rawPayload,
          raw_payload_hash: rawPayloadHash,
          normalized_payload: { signal_type: extraction.signal_type, jurisdiction: extraction.jurisdiction, country_iso: extraction.country_iso, key_entities: extraction.key_entities, effective_date: extraction.effective_date, summary: extraction.summary, relevance_score: extraction.relevance_score, confidence: extraction.confidence, keywords_matched: extraction.keywords_matched, source_type: snapshot.source_type ?? null, source_country: snapshot.source_country ?? null, source_region: snapshot.source_region ?? null, language: snapshot.language_detected ?? "en" },
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

      results.push({ snapshot_id: snapshot.id, status: dryRun ? "dry_run" : "staged", signal_type: extraction.signal_type, relevance_score: extraction.relevance_score, confidence: extraction.confidence, jurisdiction: extraction.jurisdiction, country_iso: extraction.country_iso, summary: extraction.summary, backend: outcome.backend });

    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      if (!dryRun) await supabase.from("source_snapshots").update({ fetch_status: "extract_failed", error_message: msg.slice(0, 500) }).eq("id", snapshot.id);
      results.push({ snapshot_id: snapshot.id, status: "error", error: msg.slice(0, 200) });
    }
  }

  return respond(200, { ok: true, function: "hv-extract", version: "1.6.1", mode: dryRun ? "dry_run" : "live", llm_backend: llmBackend, batch_id: dryRun ? null : batchId, snapshots_considered: snapshots?.length ?? 0, extracted, staged, skipped_low_relevance: skippedLowRelevance, failed, min_relevance_threshold: minRelevance, results });
});
