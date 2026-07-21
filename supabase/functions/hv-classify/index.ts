import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
// 2026-07-21: default changed from "openai,gemini,anthropic" to "openai"
// only. Gemini and Anthropic keys exist in vault but are billing-blocked
// ("prepayment credits depleted" / "credit balance too low") and won't be
// funded until the product is making money (Tyler's call, 2026-07-21) --
// cascading through them on every OpenAI failure was pure wasted latency
// against two guaranteed-fail calls. Set CLASSIFY_PROVIDER_ORDER to
// re-include them the moment they're funded again; no code change needed.
const PROVIDER_ORDER = (Deno.env.get("CLASSIFY_PROVIDER_ORDER") ?? "openai").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const MODELS = { anthropic: "claude-haiku-4-5", gemini: "gemini-3.5-flash", openai: "gpt-4o-mini" };
const QUALITY = ["signal", "boilerplate", "spam", "nav", "duplicate"];
const CONTENT = ["regulatory", "market", "story", "research", "noise"];
const IMPACT = ["high", "medium", "low"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shared-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };

const CLASSIFY_SYSTEM = `You classify cannabis-industry web content for a B2B regulatory intelligence pipeline.
Given a headline and extracted body text from a web page, output STRICT JSON only, with keys:
- quality_label: one of signal|boilerplate|spam|nav|duplicate
    signal = a discrete real-world development (a specific actor doing a specific thing: a law, ruling, licence, price move, launch, study result). Real news counts even if the text is short.
    boilerplate = generic repeated site chrome (footers, contact/address blocks, author bylines).
    spam = selling/affiliate/SEO-bait content, OR an article entirely off-topic to cannabis (obituary, unrelated crime, air-quality data, travel).
    nav = menus, breadcrumbs, pagination, link/report lists, login/register.
    duplicate = only when explicitly told of a specific other item; otherwise do not use.
- content_type: one of regulatory|market|story|research|noise. Use noise if and only if quality_label != signal.
- impact: high|medium|low
- confidence: number 0.0-1.0
- reason: under 12 words
Judge by MEANING, not keyword density. A page dense with cannabis keywords that is only a navigation menu or a list of report links is nav, not signal. A short genuine headline about a real event is a signal. Text not about cannabis at all is spam. Output ONLY the JSON object, no prose.`;

const TITLE_SYSTEM = `You are a news editor for a cannabis-industry intelligence brief. You are given messy extracted web text (often a mid-article sentence fragment, not a headline). Rewrite it into a clean, specific news headline plus a one-sentence summary.
Output STRICT JSON only: {"title": string, "blurb": string}.
- title: 6 to 14 words. A real news headline: specific actor + specific action. Present tense where natural. NO outlet name, NO trailing ellipsis, NO truncation, NO surrounding quotes. Do not copy a sentence fragment verbatim - rewrite it as a headline.
- blurb: ONE sentence, 30 words max, factual, summarising the development.
If the text does not actually describe a real cannabis-industry development (it is navigation, boilerplate, or off-topic), return {"title":"","blurb":""}.
Output ONLY the JSON object, no prose.`;

const buildUser = (h, s) => `HEADLINE: ${h ?? ""}\n\nBODY: ${s ?? ""}`;

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "");
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function rawProvider(name, system, user, opts = {}) {
  if (name === "anthropic") {
    if (!ANTHROPIC_API_KEY) return null;
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: MODELS.anthropic, max_tokens: 350, temperature: 0, system, messages: [{ role: "user", content: user }] }) });
    if (!res.ok) throw new Error(`anthropic_${res.status}`);
    const d = await res.json(); return extractJson(d?.content?.[0]?.text ?? "");
  }
  if (name === "openai") {
    if (!OPENAI_API_KEY) return null;
    const body = { model: MODELS.openai, temperature: 0, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
    if (!opts.noJsonMode) body.response_format = { type: "json_object" };
    let res = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify(body) });
    if (res.status === 429) {
      // 2026-07-21: with Anthropic/Gemini billing-blocked, OpenAI carries
      // 100% of classification traffic -- a burst of sequential calls (eval
      // batches, or this function's own noJsonMode re-attempt below) can
      // now trip its rate limit where it previously never would have,
      // since load used to spread across 3 providers. One backoff-retry
      // before giving up.
      await new Promise((r) => setTimeout(r, 1500));
      res = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify(body) });
    }
    if (!res.ok) throw new Error(`openai_${res.status}`);
    const d = await res.json();
    const parsed = extractJson(d?.choices?.[0]?.message?.content ?? "");
    if (parsed) return parsed;
    // 2026-07-21: same-provider retry, once, without forced JSON mode.
    // Observed a persistent (not transient -- same rows failed identically
    // across repeated invocations over 2 days) empty/unparseable response
    // from OpenAI's response_format=json_object path on a subset of inputs.
    // Plain chat-completion mode + our own regex extraction is a genuinely
    // different code path that can succeed where json_object mode returns
    // empty content. With Anthropic/Gemini billing-blocked, this retry is
    // the real fallback now, not a formality.
    if (!opts.noJsonMode) return rawProvider(name, system, user, { noJsonMode: true });
    return null;
  }
  if (name === "gemini") {
    if (!GEMINI_API_KEY) return null;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent`, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: user }] }], systemInstruction: { parts: [{ text: system }] }, generationConfig: { temperature: 0, maxOutputTokens: 350, responseMimeType: "application/json" } }) });
    if (!res.ok) throw new Error(`gemini_${res.status}`);
    const d = await res.json(); return extractJson(d?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
  }
  return null;
}
async function llmJson(system, user) {
  const errors = [];
  for (const name of PROVIDER_ORDER) {
    try { const r = await rawProvider(name, system, user); if (r) return { r, backend: name }; }
    catch (e) { errors.push(e instanceof Error ? e.message : String(e)); }
  }
  return { errors: errors.length ? errors : ["no_llm_provider_configured"] };
}
function coerceClass(raw) {
  if (!raw) return null;
  const q = String(raw.quality_label ?? "").toLowerCase();
  if (!QUALITY.includes(q)) return null;
  const c = String(raw.content_type ?? "").toLowerCase();
  const i = String(raw.impact ?? "").toLowerCase();
  return { quality_label: q, content_type: CONTENT.includes(c) ? c : q === "signal" ? "story" : "noise", impact: IMPACT.includes(i) ? i : "low", confidence: typeof raw.confidence === "number" ? raw.confidence : null, reason: typeof raw.reason === "string" ? raw.reason.slice(0, 200) : null };
}
async function classifyOne(h, s) {
  const out = await llmJson(CLASSIFY_SYSTEM, buildUser(h, s));
  if (out.errors) return { errors: out.errors };
  const c = coerceClass(out.r);
  return c ? { result: c, backend: out.backend } : { errors: ["invalid_json"] };
}
async function generateTitle(h, s) {
  const out = await llmJson(TITLE_SYSTEM, buildUser(h, s));
  if (out.errors) return { err: out.errors.join(" | ") };
  const t = String(out.r.title ?? "").trim();
  const b = String(out.r.blurb ?? "").trim();
  if (!t) return { err: "empty_title" };
  return { title: t.slice(0, 200), blurb: b.slice(0, 400) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const json = (p, status = 200) => new Response(JSON.stringify(p), { status, headers: { ...CORS, "content-type": "application/json" } });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: "api" } });
  const routeToManualReview = async (signalId, headline, summary, reason) => { await supabase.from("intel_classify_review_queue").upsert({ signal_id: signalId, headline, summary, reason, created_at: new Date().toISOString() }, { onConflict: "signal_id" }); };

  if (body.mode === "titles") {
    const limit = Math.min(Number(body.limit ?? 25), 60);
    const { data: rows, error } = await supabase.rpc("rows_needing_titles", { p_limit: limit });
    if (error) return json({ ok: false, error: "titles_query_failed", detail: error.message }, 500);
    let titled = 0, failed = 0, lastErr = null;
    for (const r of rows ?? []) {
      const t = await generateTitle(r.headline ?? "", r.summary ?? "");
      if (t.err) { failed++; lastErr = t.err; continue; }
      const { error: rpcErr } = await supabase.rpc("apply_editorial_title", { p_signal_id: r.signal_id, p_title: t.title, p_blurb: t.blurb });
      if (rpcErr) { failed++; lastErr = rpcErr.message; } else titled++;
    }
    return json({ ok: true, mode: "titles", titled, failed, requested: rows?.length ?? 0, lastErr });
  }

  if (body.mode === "pool") {
    const limit = Math.min(Number(body.limit ?? 50), 200);
    const { data: rows, error } = await supabase.rpc("pool_rows_needing_classification", { p_limit: limit });
    if (error) return json({ ok: false, error: "pool_query_failed", detail: error.message }, 500);
    let done = 0, manualReview = 0;
    for (const r of rows ?? []) {
      const out = await classifyOne(r.headline ?? "", r.summary ?? "");
      if ("result" in out) {
        const { error: insErr } = await supabase.from("signal_classifications").insert({ signal_id: r.signal_id, quality_label: out.result.quality_label, content_type: out.result.content_type, impact: out.result.impact, confidence: out.result.confidence, model: out.backend });
        if (insErr) { await routeToManualReview(r.signal_id, r.headline, r.summary, `insert_failed: ${insErr.message}`); manualReview++; } else done++;
      } else { await routeToManualReview(r.signal_id, r.headline, r.summary, out.errors.join(" | ")); manualReview++; }
    }
    return json({ ok: true, mode: "pool", classified: done, manual_review: manualReview, requested: rows?.length ?? 0 });
  }

  if (body.mode === "eval") {
    const runId = String(body.runId ?? `run-${new Date().toISOString().slice(0, 19)}`);
    const limit = Math.min(Number(body.limit ?? 250), 500);
    const { data: rows, error } = await supabase.rpc("intel_eval_rows_needing_prediction", { p_run_id: runId, p_limit: limit });
    if (error) return json({ ok: false, error: "eval_query_failed", detail: error.message }, 500);
    let done = 0, manualReview = 0;
    for (const r of rows ?? []) {
      const out = await classifyOne(r.headline ?? "", r.summary ?? "");
      if ("result" in out) {
        const { error: insErr } = await supabase.from("intel_eval_predictions").insert({ run_id: runId, signal_id: r.signal_id, quality_label: out.result.quality_label, content_type: out.result.content_type, impact: out.result.impact, confidence: out.result.confidence, reason: out.result.reason, model: out.backend });
        if (insErr) { await routeToManualReview(r.signal_id, r.headline, r.summary, `insert_failed: ${insErr.message}`); manualReview++; } else done++;
      } else { await routeToManualReview(r.signal_id, r.headline, r.summary, out.errors.join(" | ")); manualReview++; }
    }
    return json({ ok: true, runId, classified: done, manual_review: manualReview, requested: rows?.length ?? 0 });
  }

  if (body.text || body.signalId) {
    let headline = body.text?.headline ?? ""; let summary = body.text?.summary ?? "";
    if (body.signalId) {
      const { data, error } = await supabase.from("signals").select("headline,summary").eq("id", body.signalId).maybeSingle();
      if (error) return json({ ok: false, error: "signal_query_failed", detail: error.message }, 500);
      if (!data) return json({ ok: false, error: "signal_not_found" }, 404);
      headline = data.headline ?? ""; summary = data.summary ?? "";
    }
    const out = await classifyOne(headline, summary);
    if ("result" in out) return json({ ok: true, backend: out.backend, classification: out.result });
    return json({ ok: true, routed: "manual_review", reason: out.errors.join(" | ") });
  }
  return json({ ok: false, error: "bad_request", hint: "mode=pool|eval|titles, or text/signalId" }, 400);
});
