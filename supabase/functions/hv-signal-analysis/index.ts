import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// hv-signal-analysis: generates the per-signal synthesis layer (what
// changed, who's affected, deadline, recommended action) for signals
// already live in public.signals -- the table the Intel tab actually
// reads (via signals_quality / fetchDashboardSignals). Additive; does not
// touch hv_import_staging/hv_artifacts, regulatory_signals, or ia_signals.
//
// Uses RPC functions (get_signals_pending_analysis / save_signal_analysis)
// rather than raw REST table access -- PostgREST's column-level schema
// cache did not pick up the new analysis columns after both a NOTIFY
// reload and a DDL comment change. RPC calls access columns via direct
// SQL inside the function body, sidestepping that cache layer entirely.
//
// 2026-08-11: both RPCs live in the `api` schema, not `public`. This file
// was never sending Content-Profile: api, so PostgREST looked in the
// default public schema and 404'd (PGRST202) on every single call since
// deploy -- invisible to cron monitoring because the pg_cron trigger fires
// net.http_post and never inspects the response. Also found & fixed:
// service_role had no EXECUTE grant on either RPC (separate bug, same
// day). Both are now fixed.
//
// 2026-08-11 (2): added a third caller path -- x-hv-manual-trigger, gated
// by its own vault secret -- for the admin dashboard's on-demand "Analyze"
// button (api.request_signal_analysis RPC). Kept distinct from the cron
// caller header so logs/audit honestly show which path triggered a given
// analysis; scoped to single-signal requests only (signal_id required,
// limit forced to 1) so it can't be used to mass-trigger the whole backlog
// from the edge.

const SUPABASE_URL       = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY  = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const GEMINI_API_KEY     = Deno.env.get("GEMINI_API_KEY") ?? "";
const OPENAI_API_KEY     = Deno.env.get("OPENAI_API_KEY") ?? "";
const DEV_BYPASS_SECRET  = Deno.env.get("HV_DEV_BYPASS_SECRET") ?? "";
const MANUAL_TRIGGER_SECRET = Deno.env.get("HV_SIGNAL_ANALYSIS_MANUAL_TRIGGER_SECRET") ?? "";
const CRON_CALLER_HEADER = "x-harbourview-cron-caller";
const EXPECTED_CRON_CALLER = "pg_cron_hv_signal_analysis";
const MANUAL_TRIGGER_HEADER = "x-hv-manual-trigger";

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

type SignalRow = {
  id: string;
  date: string | null;
  cat: string | null;
  headline: string | null;
  summary: string | null;
  source: string | null;
  country: string | null;
  score: number | null;
  verification: string | null;
};

type AnalysisResult = {
  what_changed: string;
  who_is_affected: string;
  deadline: string | null;
  recommended_action: string;
  confidence_rationale: string;
};

const ANALYSIS_SYSTEM = `You are a cannabis regulatory and market intelligence analyst writing for operators (growers, processors, importers/exporters, distributors) who need to act on information, not just read headlines. Given a signal's headline, summary, source, and country, produce a short, concrete synthesis. Return ONLY a valid JSON object -- no prose, no markdown, no code fences.

Return exactly this structure:
{"what_changed":"1-2 plain sentences on the specific, concrete change -- not a restatement of the headline","who_is_affected":"1 sentence naming the specific operator type(s) affected (e.g. 'importers seeking GMP certification', 'medical cannabis patients and their prescribing physicians') -- be specific, never say 'the cannabis industry' or 'stakeholders'","deadline":"a specific date or timeframe if the signal mentions or implies one, otherwise null -- do not invent a deadline that isn't supported by the content","recommended_action":"1 concrete sentence on what an operator should do in response -- 'monitor', 'no action needed', or a specific step, whichever is honestly warranted","confidence_rationale":"1 short sentence on why this signal is or isn't well-supported (e.g. 'single source, not yet corroborated' or 'official regulator publication, high reliability')"}

If the content is too thin or generic to support real analysis (e.g. a vague headline with no real detail), be honest about that limitation in the fields rather than inventing specifics. Never fabricate a deadline, statistic, or named entity that is not present in the source content.`;

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function authorizeCaller(req: Request, isSingleSignalRequest: boolean): Response | null {
  const cronCaller = req.headers.get(CRON_CALLER_HEADER) ?? "";
  const devBypass = req.headers.get("x-hv-dev-bypass") ?? "";
  const manualTrigger = req.headers.get(MANUAL_TRIGGER_HEADER) ?? "";
  const isCron = cronCaller === EXPECTED_CRON_CALLER;
  const isDev = Boolean(DEV_BYPASS_SECRET) && devBypass === DEV_BYPASS_SECRET;
  const isManual = Boolean(MANUAL_TRIGGER_SECRET) && manualTrigger === MANUAL_TRIGGER_SECRET;

  // Manual runs are explicitly gated by the vault secret, but may process a bounded
  // batch so the Intel/briefing pipeline can recover when LLM providers are out of credit.
  if (isManual && !isSingleSignalRequest) {
    return null;
  }
  if (!isCron && !isDev && !isManual) {
    return respond(403, { ok: false, error: "forbidden", reason: "Requires cron caller, dev bypass, or manual-trigger header" });
  }
  return null;
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Content-Profile": "api",
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: `rpc_${name}_${res.status}: ${text.slice(0, 300)}` };
  return { ok: true, data: (text ? JSON.parse(text) : null) as T };
}

function buildUserContent(signal: SignalRow): string {
  return [
    `HEADLINE: ${signal.headline ?? ""}`,
    signal.summary ? `SUMMARY: ${signal.summary}` : null,
    `COUNTRY: ${signal.country ?? "unspecified"}`,
    `SOURCE: ${signal.source ?? "unknown"}`,
    signal.date ? `DATE: ${signal.date}` : null,
    `SIGNAL VERIFICATION LEVEL: ${signal.verification ?? "unverified"}`,
  ].filter(Boolean).join("\n");
}

async function analyzeAnthropic(signal: SignalRow): Promise<AnalysisResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      temperature: 0,
      system: ANALYSIS_SYSTEM,
      messages: [{ role: "user", content: buildUserContent(signal) }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse((data?.content?.[0]?.text ?? "").replace(/```json|```/g, "").trim());
}

async function analyzeGemini(signal: SignalRow): Promise<AnalysisResult> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildUserContent(signal) }] }],
        systemInstruction: { parts: [{ text: ANALYSIS_SYSTEM }] },
        generationConfig: { temperature: 0, maxOutputTokens: 500, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function analyzeOpenAI(signal: SignalRow): Promise<AnalysisResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM },
        { role: "user", content: buildUserContent(signal) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
}

function buildDeterministicFallback(signal: SignalRow): AnalysisResult {
  const headline = (signal.headline ?? "").trim();
  const summary = (signal.summary ?? "").trim();
  const verification = (signal.verification ?? "").trim();
  const source = (signal.source ?? "").trim();
  const cat = (signal.cat ?? "").trim();
  const whatChanged = summary ? summary.slice(0, 500) : headline ? `Reported development: ${headline}` : "A new signal was recorded, but the available source text is limited.";
  const whoAffected = /licen|regulat|compliance|law|policy|government|permit|rule/i.test(`${headline} ${summary} ${cat}`)
    ? "Operators, compliance teams, and businesses subject to the affected regulatory or market requirements."
    : "Operators and market participants directly exposed to the reported development.";
  const recommendedAction = signal.score !== null && signal.score >= 80
    ? "Review the source and assess whether the development requires an operational or compliance response."
    : "Monitor the source and verify the development before taking operational action.";
  const confidence = verification
    ? `Fallback synthesis based on the recorded signal fields; source verification is marked "${verification}".`
    : source
      ? "Fallback synthesis based on the recorded signal fields; source verification metadata is limited."
      : "Fallback synthesis based only on the available signal text; source verification is limited.";
  return { what_changed: whatChanged, who_is_affected: whoAffected, deadline: null, recommended_action: recommendedAction, confidence_rationale: confidence };
}
function isCreditOrQuotaFailure(message: string): boolean {
  return /credit|quota|balance|depleted|insufficient[_ ]fund|billing|payment required|rate[_ -]?limit/i.test(message);
}

async function analyzeSignal(signal: SignalRow): Promise<{ result: AnalysisResult; backend: string } | null> {
  const attempts: Array<[string, () => Promise<AnalysisResult>]> = [];
  if (ANTHROPIC_API_KEY) attempts.push(["anthropic", () => analyzeAnthropic(signal)]);
  if (GEMINI_API_KEY)    attempts.push(["gemini",    () => analyzeGemini(signal)]);
  if (OPENAI_API_KEY)    attempts.push(["openai",    () => analyzeOpenAI(signal)]);

  const errors: string[] = [];
  for (const [backend, fn] of attempts) {
    try { return { result: await fn(), backend }; }
    catch (e) { errors.push(`${backend}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  if (attempts.length === 0) errors.push("no_llm_api_key: set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY");
  const combinedError = errors.join(" | ");
  (analyzeSignal as any)._lastError = combinedError;
  if (errors.length > 0 && errors.every(isCreditOrQuotaFailure)) {
    return { result: buildDeterministicFallback(signal), backend: "rules-v1" };
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return respond(405, { ok: false, error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return respond(500, { ok: false, error: "missing_supabase_env" });
  if (!ANTHROPIC_API_KEY && !GEMINI_API_KEY && !OPENAI_API_KEY) return respond(500, { ok: false, error: "no_llm_api_key" });

  const url        = new URL(req.url);
  const dryRun     = url.searchParams.get("dry_run") === "true";
  const fallbackOnly = url.searchParams.get("fallback_only") === "true";
  const signalId   = url.searchParams.get("signal_id");

  const authRejection = authorizeCaller(req, Boolean(signalId));
  if (authRejection) return authRejection;

  const rawLimit   = Number(url.searchParams.get("limit") ?? "20");
  const limit      = signalId ? 1 : Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 20, 50));
  const llmBackend = ANTHROPIC_API_KEY ? "claude-haiku-4-5" : GEMINI_API_KEY ? "gemini-3.5-flash" : "gpt-4o-mini";

  const fetchResult = await rpc<SignalRow[]>("get_signals_pending_analysis", {
    p_limit: limit,
    p_signal_id: signalId ?? null,
  });
  if (!fetchResult.ok) return respond(500, { ok: false, error: "signals_query_failed", detail: fetchResult.error });
  const signals = fetchResult.data ?? [];

  const results: Record<string, unknown>[] = [];
  let analyzed = 0, failed = 0;

  for (const signal of signals) {
    try {
      const outcome = fallbackOnly
        ? { result: buildDeterministicFallback(signal), backend: "rules-v1" }
        : await analyzeSignal(signal);
      if (!outcome) {
        failed++;
        results.push({ signal_id: signal.id, status: "failed", reason: (analyzeSignal as any)._lastError });
        continue;
      }

      if (!dryRun) {
        const saveResult = await rpc<boolean>("save_signal_analysis", {
          p_signal_id: signal.id,
          p_analysis: outcome.result,
          p_backend: outcome.backend,
        });
        if (!saveResult.ok) throw new Error(saveResult.error);
      }

      analyzed++;
      results.push({ signal_id: signal.id, status: dryRun ? "dry_run" : "analyzed", backend: outcome.backend, analysis: outcome.result });

    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ signal_id: signal.id, status: "error", error: msg.slice(0, 200) });
    }
  }

  return respond(200, {
    ok: true,
    function: "hv-signal-analysis",
    version: "1.2.0",
    mode: dryRun ? "dry_run" : "live",
    llm_backend: llmBackend,
    signals_considered: signals.length,
    analyzed,
    failed,
    results,
  });
});
