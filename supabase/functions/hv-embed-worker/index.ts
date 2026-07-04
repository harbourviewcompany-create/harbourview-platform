import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CRON_CALLER_HEADER = "x-harbourview-cron-caller";
const WORKER_ID          = "hv-embed-worker";
const WORKER_VERSION     = "5.0.0";
const BATCH_SIZE         = 10;

// Native Supabase ONNX runtime — zero tokens, zero cost, ~100-200ms CPU per call
const LOCAL_MODEL    = "gte-small";
const LOCAL_DIM      = 384;

// OpenAI optional upgrade — used only if key present AND no quota error
const OAI_MODEL      = "text-embedding-3-small";
const OAI_DIM        = 1536;

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function sha256Hex(text: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
    .then((h) => Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join(""));
}

// ── OpenAI (optional upgrade path) ───────────────────────────────────────
async function embedOpenAI(apiKey: string, texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OAI_MODEL, input: texts, dimensions: OAI_DIM }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.data as { index: number; embedding: number[] }[])
    .sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

// ── Native local ONNX via Supabase.ai ─────────────────────────────────────
// Session is module-level so it's reused across warm invocations
const _session = new Supabase.ai.Session(LOCAL_MODEL);

async function embedLocal(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const output = await _session.run(text, { mean_pool: true, normalize: true });
    results.push(Array.from(output as number[]));
  }
  return results;
}

// ── Main handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { ...jsonHeaders, "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-harbourview-cron-caller" },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), { status: 405, headers: jsonHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiKey   = Deno.env.get("OPENAI_API_KEY"); // optional

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: "Missing Supabase env" }), { status: 500, headers: jsonHeaders });
  }

  const caller   = req.headers.get(CRON_CALLER_HEADER) ?? "unknown";
  // PostgREST on this project only exposes the `api` schema (not `public`).
  // Without db.schema set, every query below 406'd with PGRST106 and this
  // function failed on every invocation.
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false }, db: { schema: "api" } });
  const startedAt = Date.now();
  const results: object[] = [];
  let processed = 0, errored = 0;

  // Claim batch
  const { data: jobs, error: claimErr } = await supabase
    .from("hv_processing_jobs")
    .select("id, artifact_id, attempt_count, max_attempts")
    .eq("job_type", "embed")
    .eq("status", "pending")
    .order("priority", { ascending: true })
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (claimErr) return new Response(JSON.stringify({ ok: false, error: claimErr.message }), { status: 500, headers: jsonHeaders });
  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: "No pending embed jobs", processed: 0 }), { status: 200, headers: jsonHeaders });
  }

  const jobIds = jobs.map((j: { id: string }) => j.id);
  await supabase.from("hv_processing_jobs")
    .update({ status: "claimed", claimed_at: new Date().toISOString(), claimed_by: WORKER_ID, worker_version: WORKER_VERSION })
    .in("id", jobIds).eq("status", "pending");

  for (const job of jobs as { id: string; artifact_id: string; attempt_count: number; max_attempts: number }[]) {
    const attemptNum   = (job.attempt_count ?? 0) + 1;
    const attemptStart = Date.now();

    await supabase.from("hv_job_attempts").insert({
      job_id: job.id, attempt_num: attemptNum, status: "started",
      worker_id: WORKER_ID, worker_version: WORKER_VERSION,
    });
    await supabase.from("hv_processing_jobs")
      .update({ status: "running", started_at: new Date().toISOString(), attempt_count: attemptNum })
      .eq("id", job.id);

    try {
      const { data: artifact, error: artErr } = await supabase
        .from("hv_artifacts").select("id, title, body, workspace_id")
        .eq("id", job.artifact_id).single();
      if (artErr || !artifact) throw new Error(`Artifact not found: ${job.artifact_id}`);

      type Chunk = { index: number; text: string; field: string };
      const chunks: Chunk[] = [];
      if (artifact.title?.trim()) chunks.push({ index: 0, text: artifact.title.trim(), field: "title" });
      if (artifact.body?.trim())  chunks.push({ index: chunks.length, text: artifact.body.trim().slice(0, 8000), field: "body" });
      if (chunks.length === 0) throw new Error("No embeddable text");

      const texts = chunks.map((c) => c.text);

      // Strategy: OpenAI if key present → fallback to local on quota error → local always if no key
      let vectors: number[][];
      let modelId: string, provider: string, dimensions: number;
      let useCol: "embedding" | "embedding_384";

      if (openaiKey) {
        try {
          vectors = await embedOpenAI(openaiKey, texts);
          modelId = OAI_MODEL; provider = "openai"; dimensions = OAI_DIM; useCol = "embedding";
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("429") || msg.includes("insufficient_quota") || msg.includes("billing")) {
            vectors = await embedLocal(texts);
            modelId = LOCAL_MODEL; provider = "supabase_onnx"; dimensions = LOCAL_DIM; useCol = "embedding_384";
          } else throw e;
        }
      } else {
        vectors = await embedLocal(texts);
        modelId = LOCAL_MODEL; provider = "supabase_onnx"; dimensions = LOCAL_DIM; useCol = "embedding_384";
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkHash = await sha256Hex(chunk.text);

        await supabase.from("hv_embeddings")
          .update({ is_current: false, superseded_at: new Date().toISOString() })
          .eq("artifact_id", artifact.id).eq("source_field", chunk.field).eq("is_current", true);

        const row: Record<string, unknown> = {
          artifact_id: artifact.id, workspace_id: artifact.workspace_id,
          model_id: modelId, model_provider: provider,
          model_version: provider === "openai" ? "text-embedding-3-small-v1" : "gte-small-onnx-quantized",
          dimensions, chunk_index: chunk.index, chunk_text: chunk.text,
          chunk_tokens: Math.ceil(chunk.text.length / 4),
          source_field: chunk.field, content_hash: chunkHash, is_current: true,
        };
        row[useCol] = `[${vectors[i].join(",")}]`;
        await supabase.from("hv_embeddings").insert(row);
      }

      const durationMs = Date.now() - attemptStart;
      await supabase.from("hv_processing_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        output_payload: { chunks_embedded: chunks.length, model: modelId, provider, dimensions },
      }).eq("id", job.id);
      await supabase.from("hv_job_attempts")
        .update({ status: "completed", ended_at: new Date().toISOString(), duration_ms: durationMs })
        .eq("job_id", job.id).eq("attempt_num", attemptNum);
      await supabase.from("hv_artifacts")
        .update({ lifecycle_stage: "evidence_check" })
        .eq("id", artifact.id).eq("lifecycle_stage", "normalized");

      results.push({ job_id: job.id, artifact_id: job.artifact_id, status: "completed", chunks: chunks.length, provider, dimensions });
      processed++;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const durationMs = Date.now() - attemptStart;
      const nextStatus = attemptNum >= (job.max_attempts ?? 3) ? "dead_letter" : "failed";
      await supabase.from("hv_processing_jobs").update({
        status: nextStatus, failed_at: new Date().toISOString(), last_error: msg, attempt_count: attemptNum,
        dead_lettered_at:   nextStatus === "dead_letter" ? new Date().toISOString() : null,
        dead_letter_reason: nextStatus === "dead_letter" ? msg : null,
      }).eq("id", job.id);
      await supabase.from("hv_job_attempts")
        .update({ status: "failed", ended_at: new Date().toISOString(), duration_ms: durationMs, error: msg })
        .eq("job_id", job.id).eq("attempt_num", attemptNum);
      results.push({ job_id: job.id, artifact_id: job.artifact_id, status: nextStatus, error: msg });
      errored++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, caller, processed, errored, total_jobs: jobs.length, duration_ms: Date.now() - startedAt, results }),
    { status: 200, headers: jsonHeaders }
  );
});
