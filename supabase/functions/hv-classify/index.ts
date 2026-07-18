import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * hv-classify — Stage 2 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md.
 *
 * Section 6.1 contract:  input { headline, summary } -> { quality_label,
 * content_type, impact, confidence, reason }.
 *
 * FALLBACK BY DESIGN (there is always a plan for fallbacks):
 *   provider chain (configurable via CLASSIFY_PROVIDER_ORDER, default openai,gemini,anthropic)
 *   -> each is only attempted if its key is set; a failing/exhausted provider is skipped
 *   -> if ALL LLM providers fail, the row falls back to MANUAL REVIEW: it is written to
 *      intel_classify_review_queue for a human to label. Nothing is ever silently dropped.
 * Anthropic is ordered LAST so a dead/unfunded Anthropic key never blocks or is hit first.
 *
 * VALIDATION-ONLY (spec §6.2 / guardrail #2): wired to nothing in the promotion path.
 * Its only writes are intel_eval_predictions (grading) and intel_classify_review_queue
 * (manual-review fallback). source-engine-promote and the orchestrator are untouched.
 *
 * Modes (POST):
 *   { text:{headline,summary} }        -> classify ad-hoc, return JSON (no write)
 *   { signalId }                       -> fetch signal, classify; on total failure route to manual review
 *   { mode:"eval", runId?, limit? }    -> classify eval rows -> intel_eval_predictions; failures -> manual review
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const SHARED_SECRET = Deno.env.get("HV_PIPELINE_CRON_SHARED_SECRET") ?? "";
// Default order puts the providers we actually fund first; Anthropic last.
const PROVIDER_ORDER = (Deno.env.get("CLASSIFY_PROVIDER_ORDER") ?? "openai,gemini,anthropic")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const MODELS = { anthropic: "claude-haiku-4-5", gemini: "gemini-3.5-flash", openai: "gpt-4o-mini" } as const;
const QUALITY = ["signal", "boilerplate", "spam", "nav", "duplicate"];
const CONTENT = ["regulatory", "market", "story", "research", "noise"];
const IMPACT = ["high", "medium", "low"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shared-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You classify cannabis-industry web content for a B2B regulatory intelligence pipeline.
Given a headline and extracted body text from a web page, output STRICT JSON only, with keys:
- quality_label: one of signal|boilerplate|spam|nav|duplicate
    signal = a discrete real-world development (a specific actor doing a specific thing: a law, ruling, licence, price move, launch, study result). Real news counts even if the text is short.
    boilerplate = generic repeated site chrome (footers, contact/address blocks, author bylines).
    spam = selling/affiliate/SEO-bait content, OR an article entirely off-topic to cannabis (obituary, unrelated crime, air-quality data, travel).
    nav = menus, breadcrumbs, pagination, link/report lists, login/register.
    duplicate = only when explicitly told of a specific other item; otherwise do not use.
- content_type: one of regulatory|market|story|research|noise. Use noise if and only if quality_label != signal.
    regulatory = government/agency action, law, ruling, licence, gazette notice.
    market = pricing, supply/demand, M&A, funding, trade flows, market data.
    story = general news/culture/business/seizure/politics not fitting the above.
    research = academic/scientific findings, trials, registries.
- impact: high|medium|low
- confidence: number 0.0-1.0
- reason: under 12 words
Judge by MEANING, not keyword density. A page dense with cannabis keywords that is only a navigation menu or a list of report links is nav, not signal. A short genuine headline about a real event is a signal. Text not about cannabis at all is spam. Output ONLY the JSON object, no prose.`;

const buildUser = (h: string, s: string) => `HEADLINE: ${h ?? ""}\n\nBODY: ${s ?? ""}`;

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json|```/g, "");
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
function coerce(raw: Record<string, unknown> | null) {
  if (!raw) return null;
  const q = String(raw.quality_label ?? "").toLowerCase();
  if (!QUALITY.includes(q)) return null;
  const c = String(raw.content_type ?? "").toLowerCase();
  const i = String(raw.impact ?? "").toLowerCase();
  return {
    quality_label: q,
    content_type: CONTENT.includes(c) ? c : q === "signal" ? "story" : "noise",
    impact: IMPACT.includes(i) ? i : "low",
    confidence: typeof raw.confidence === "number" ? raw.confidence : null,
    reason: typeof raw.reason === "string" ? raw.reason.slice(0, 200) : null,
  };
}

// --- providers: each throws on failure so the chain can catch and fall through ---
async function viaAnthropic(h: string, s: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODELS.anthropic, max_tokens: 300, temperature: 0, system: SYSTEM,
      messages: [{ role: "user", content: buildUser(h, s) }] }),
  });
  if (!res.ok) throw new Error(`anthropic_${res.status}: ${(await res.text()).slice(0, 160)}`);
  const d = await res.json();
  return coerce(extractJson(d?.content?.[0]?.text ?? ""));
}
async function viaOpenAI(h: string, s: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: MODELS.openai, temperature: 0, response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: buildUser(h, s) }] }),
  });
  if (!res.ok) throw new Error(`openai_${res.status}: ${(await res.text()).slice(0, 160)}`);
  const d = await res.json();
  return coerce(extractJson(d?.choices?.[0]?.message?.content ?? ""));
}
async function viaGemini(h: string, s: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent`,
    { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: buildUser(h, s) }] }],
        systemInstruction: { parts: [{ text: SYSTEM }] },
        generationConfig: { temperature: 0, maxOutputTokens: 300, responseMimeType: "application/json" } }) },
  );
  if (!res.ok) throw new Error(`gemini_${res.status}: ${(await res.text()).slice(0, 160)}`);
  const d = await res.json();
  return coerce(extractJson(d?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""));
}

const PROVIDERS: Record<string, { key: string; fn: (h: string, s: string) => Promise<ReturnType<typeof coerce>> }> = {
  anthropic: { key: ANTHROPIC_API_KEY, fn: viaAnthropic },
  openai: { key: OPENAI_API_KEY, fn: viaOpenAI },
  gemini: { key: GEMINI_API_KEY, fn: viaGemini },
};

/** Try each configured+keyed provider in order. Returns {result,backend} or {errors}. */
async function classifyOne(h: string, s: string) {
  const errors: string[] = [];
  for (const name of PROVIDER_ORDER) {
    const p = PROVIDERS[name];
    if (!p || !p.key) continue;
    try {
      const result = await p.fn(h, s);
      if (result) return { result, backend: name };
      errors.push(`${name}: empty_or_invalid_json`);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  if (errors.length === 0) errors.push("no_llm_provider_configured");
  return { errors };
}

function authorized(req: Request): boolean {
  if (!SHARED_SECRET) return true;
  return (req.headers.get("x-shared-secret") ?? "") === SHARED_SECRET;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const json = (p: unknown, status = 200) =>
    new Response(JSON.stringify(p), { status, headers: { ...CORS, "content-type": "application/json" } });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!authorized(req)) return json({ ok: false, error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // manual-review fallback: never drop a row that no provider could classify.
  const routeToManualReview = async (signalId: string, headline: string, summary: string, reason: string) => {
    await supabase.from("intel_classify_review_queue").upsert(
      { signal_id: signalId, headline, summary, reason, created_at: new Date().toISOString() },
      { onConflict: "signal_id" },
    );
  };

  // ---- ad-hoc / single-signal ----
  if (body.text || body.signalId) {
    let headline = body.text?.headline ?? "";
    let summary = body.text?.summary ?? "";
    if (body.signalId) {
      const { data, error } = await supabase.from("signals").select("headline,summary").eq("id", body.signalId).maybeSingle();
      if (error) return json({ ok: false, error: "signal_query_failed", detail: error.message }, 500);
      if (!data) return json({ ok: false, error: "signal_not_found" }, 404);
      headline = data.headline ?? ""; summary = data.summary ?? "";
    }
    const out = await classifyOne(headline, summary);
    if ("result" in out) return json({ ok: true, backend: out.backend, classification: out.result });
    if (body.signalId) await routeToManualReview(body.signalId, headline, summary, out.errors.join(" | "));
    return json({ ok: true, routed: "manual_review", reason: out.errors.join(" | ") });
  }

  // ---- eval mode ----
  if (body.mode === "eval") {
    const runId = String(body.runId ?? `run-${new Date().toISOString().slice(0, 19)}`);
    const limit = Math.min(Number(body.limit ?? 250), 500);
    const { data: rows, error } = await supabase.rpc("intel_eval_rows_needing_prediction", { p_run_id: runId, p_limit: limit });
    if (error) return json({ ok: false, error: "eval_query_failed", detail: error.message }, 500);

    let done = 0, manualReview = 0;
    for (const r of rows ?? []) {
      const out = await classifyOne(r.headline ?? "", r.summary ?? "");
      if ("result" in out) {
        const { error: insErr } = await supabase.from("intel_eval_predictions").insert({
          run_id: runId, signal_id: r.signal_id, quality_label: out.result.quality_label,
          content_type: out.result.content_type, impact: out.result.impact,
          confidence: out.result.confidence, reason: out.result.reason, model: out.backend,
        });
        if (insErr) { await routeToManualReview(r.signal_id, r.headline, r.summary, `insert_failed: ${insErr.message}`); manualReview++; }
        else done++;
      } else {
        await routeToManualReview(r.signal_id, r.headline, r.summary, out.errors.join(" | "));
        manualReview++;
      }
    }
    return json({ ok: true, runId, classified: done, manual_review: manualReview, requested: rows?.length ?? 0 });
  }

  return json({ ok: false, error: "bad_request", hint: "provide text, signalId, or mode=eval" }, 400);
});
