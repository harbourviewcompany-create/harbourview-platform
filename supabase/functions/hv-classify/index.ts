import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * hv-classify — Stage 2 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md.
 *
 * Implements the Section 6.1 classification contract:
 *   input : a signal's { headline, summary }  (or a signal_id to fetch)
 *   output: { quality_label, content_type, impact, confidence, reason }
 *
 * CRITICAL (spec §6.2 / guardrail #2): this classifier is VALIDATION-ONLY. It is
 * wired to nothing in the promotion path. Its only DB write is to
 * intel_eval_predictions, for grading against the human-labelled intel_eval_set.
 * Do not call it from source-engine-promote or the orchestrator until it has
 * cleared the precision/recall bar on the eval set.
 *
 * Modes (POST body):
 *   { text: { headline, summary } }        -> classify ad-hoc, return JSON (no write)
 *   { signalId: "<id>" }                   -> fetch from signals, classify, return JSON
 *   { mode: "eval", runId?, limit? }       -> classify intel_eval_set rows lacking a
 *                                             prediction for runId; write to
 *                                             intel_eval_predictions; return summary
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const SHARED_SECRET = Deno.env.get("HV_PIPELINE_CRON_SHARED_SECRET") ?? "";

const MODELS = {
  anthropic: "claude-haiku-4-5",
  gemini: "gemini-3.5-flash",
  openai: "gpt-4o-mini",
} as const;

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

function buildUser(headline: string, summary: string): string {
  return `HEADLINE: ${headline ?? ""}\n\nBODY: ${summary ?? ""}`;
}

function extractJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function coerce(raw: Record<string, unknown> | null) {
  if (!raw) return null;
  const q = String(raw.quality_label ?? "").toLowerCase();
  const c = String(raw.content_type ?? "").toLowerCase();
  const i = String(raw.impact ?? "").toLowerCase();
  if (!QUALITY.includes(q)) return null;
  return {
    quality_label: q,
    content_type: CONTENT.includes(c) ? c : q === "signal" ? "story" : "noise",
    impact: IMPACT.includes(i) ? i : "low",
    confidence: typeof raw.confidence === "number" ? raw.confidence : null,
    reason: typeof raw.reason === "string" ? raw.reason.slice(0, 200) : null,
  };
}

async function callAnthropic(headline: string, summary: string) {
  if (!ANTHROPIC_API_KEY) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELS.anthropic,
      max_tokens: 300,
      temperature: 0,
      system: SYSTEM,
      messages: [{ role: "user", content: buildUser(headline, summary) }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const parsed = coerce(extractJson(data?.content?.[0]?.text ?? ""));
  return parsed ? { ...parsed, model: MODELS.anthropic } : null;
}

async function callOpenAI(headline: string, summary: string) {
  if (!OPENAI_API_KEY) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODELS.openai,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildUser(headline, summary) },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const parsed = coerce(extractJson(data?.choices?.[0]?.message?.content ?? ""));
  return parsed ? { ...parsed, model: MODELS.openai } : null;
}

/** Provider fallback chain: Anthropic -> OpenAI. Gemini can be added the same way. */
async function classifyOne(headline: string, summary: string) {
  return (await callAnthropic(headline, summary)) ?? (await callOpenAI(headline, summary));
}

function authorized(req: Request): boolean {
  if (!SHARED_SECRET) return true; // if unset, rely on platform gateway auth
  const got = req.headers.get("x-shared-secret") ?? "";
  return got === SHARED_SECRET;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
      status: 405,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
  if (!authorized(req)) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...CORS, "content-type": "application/json" } });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ---- ad-hoc / single-signal classification (no write) ----
  if (body.text || body.signalId) {
    let headline = body.text?.headline ?? "";
    let summary = body.text?.summary ?? "";
    if (body.signalId) {
      const { data, error } = await supabase
        .from("signals")
        .select("headline,summary")
        .eq("id", body.signalId)
        .maybeSingle();
      if (error) return json({ ok: false, error: "signal_query_failed", detail: error.message }, 500);
      if (!data) return json({ ok: false, error: "signal_not_found" }, 404);
      headline = data.headline ?? "";
      summary = data.summary ?? "";
    }
    const result = await classifyOne(headline, summary);
    if (!result) return json({ ok: false, error: "classification_failed" }, 502);
    return json({ ok: true, classification: result });
  }

  // ---- eval mode: classify intel_eval_set rows, write predictions (validation only) ----
  if (body.mode === "eval") {
    const runId = String(body.runId ?? `run-${new Date().toISOString().slice(0, 19)}`);
    const limit = Math.min(Number(body.limit ?? 250), 500);

    // rows in the eval set that don't yet have a prediction for this runId
    const { data: rows, error } = await supabase.rpc("intel_eval_rows_needing_prediction", {
      p_run_id: runId,
      p_limit: limit,
    });
    if (error) return json({ ok: false, error: "eval_query_failed", detail: error.message }, 500);

    let done = 0;
    let failed = 0;
    for (const r of rows ?? []) {
      const result = await classifyOne(r.headline ?? "", r.summary ?? "");
      if (!result) {
        failed++;
        continue;
      }
      const { error: insErr } = await supabase.from("intel_eval_predictions").insert({
        run_id: runId,
        signal_id: r.signal_id,
        quality_label: result.quality_label,
        content_type: result.content_type,
        impact: result.impact,
        confidence: result.confidence,
        reason: result.reason,
        model: result.model,
      });
      if (insErr) failed++;
      else done++;
    }
    return json({ ok: true, runId, classified: done, failed, requested: rows?.length ?? 0 });
  }

  return json({ ok: false, error: "bad_request", hint: "provide text, signalId, or mode=eval" }, 400);
});
