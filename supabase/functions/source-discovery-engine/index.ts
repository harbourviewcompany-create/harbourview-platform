/**
 * source-discovery-engine v6 (2026-08-12) -- attempt-tracking fix
 *
 * Fills the remaining depth gaps in source_registry: for every viable country
 * in source_expansion_coverage_queue, it needs up to 7 regulator_class
 * sources (health_authority, drug_control_authority, official_gazette,
 * legislature, customs_import_export, procurement, medicine_license_registry).
 * This function finds the next batch of missing (country, class) pairs,
 * asks a grounded search provider to find the single best official
 * government URL for each, independently re-verifies that URL is live with
 * its own fetch() call, and only then inserts it into source_registry.
 *
 * FAIL-CLOSED BY DESIGN: this function never falls back to an ungrounded
 * text-completion guess at a government URL. Every candidate, from every
 * provider, gets its own live-fetch check from this function (not just the
 * provider's say-so) before it's written.
 *
 * Provider order: Anthropic (claude-haiku-4-5 + web_search tool) -> OpenAI
 * (gpt-4o-mini-search-preview, native web search) -> Wikidata (free, no key,
 * no billing -- public API, full-text search + wbgetentities). As of
 * 2026-08-12 both paid keys are credit-exhausted (confirmed live), so
 * Wikidata is the effective primary path; it's kept last in priority so the
 * higher-quality paid paths are preferred automatically the moment either is
 * funded, with zero code change needed.
 *
 * ATTEMPT-TRACKING (added 2026-08-12, source_discovery_attempts table):
 * without this, the pair-selection step re-picks the same permanently-
 * failing (country, class) pairs every run forever, since a failure never
 * removes a pair from the "missing" set. Confirmed live: 5 straight cron
 * runs barely advanced past Afghanistan before this fix. Selection now
 * sorts never-attempted pairs first, then oldest-attempted-first, so the
 * engine provably advances through the full country list and only revisits
 * old failures on a rotating basis (e.g. in case Wikidata coverage improves,
 * or paid billing is restored).
 *
 * Scheduled via pg_cron: small batches, a few times a day, to keep gov-site
 * load low and (for the paid paths, once funded) provider spend low.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MODEL = "claude-haiku-4-5";
const OPENAI_SEARCH_MODEL = "gpt-4o-mini-search-preview";

const CLASSES = [
  "health_authority",
  "drug_control_authority",
  "official_gazette",
  "legislature",
  "customs_import_export",
  "procurement",
  "medicine_license_registry",
] as const;

// Non-viable entities: no normal public-facing government regulator exists
// (confirmed via manual research, 2026-08-11 -- see intelligence-pipeline notes).
const NON_VIABLE_ISO = new Set(["GL", "VA", "NR", "KP", "TV", "EH"]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json|```/g, "");
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
  health_authority: "the national Ministry of Health (or equivalent) official website",
  drug_control_authority: "the national narcotics/drug control authority (the body that issues narcotic drug import/export/cultivation authorizations) official website",
  official_gazette: "the national official gazette / official legal publication portal",
  legislature: "the national parliament / legislature official website",
  customs_import_export: "the national customs authority official website",
  procurement: "the national government procurement / public tenders portal",
  medicine_license_registry: "the national medicine/pharmaceutical regulatory authority or drug licensing registry official website",
};

interface Candidate {
  url: string;
  official_body_name: string;
  confidence: number;
}

async function findCandidateAnthropic(country: string, cls: string): Promise<{ candidate?: Candidate; error?: string }> {
  if (!ANTHROPIC_API_KEY) return { error: "no_anthropic_api_key" };

  const desc = CLASS_DESCRIPTIONS[cls] ?? cls;
  const system = `You find official government website URLs for a B2B regulatory-intelligence source registry. You will be asked to find one specific class of official source for one specific country. Use web search to confirm the URL is real and currently live before answering. If you cannot find a confident, verifiable, official (government-owned, not a news article about it) URL, say so.
Output STRICT JSON only, no prose, no markdown fences:
{"found": true, "url": "https://...", "official_body_name": "...", "confidence": 0.0-1.0}
or
{"found": false, "reason": "..."}`;
  const user = `Country: ${country}\nSource class needed: ${cls} -- ${desc}\nFind the single best, current, official URL.`;

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: user }],
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
      }),
    });
  } catch (e) {
    return { error: `fetch_threw: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    return { error: `anthropic_${res.status}: ${bodyText.slice(0, 300)}` };
  }

  const data = await res.json();
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const lastText = [...blocks].reverse().find((b: Record<string, unknown>) => b.type === "text") as
    | { text?: string }
    | undefined;
  if (!lastText?.text) return { error: "no_text_block_in_response" };

  const parsed = extractJson(lastText.text);
  if (!parsed) return { error: "unparseable_json" };
  if (parsed.found !== true) return { error: `model_reported_not_found: ${String(parsed.reason ?? "")}`.slice(0, 200) };

  const url = String(parsed.url ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return { error: "invalid_url_shape" };

  return {
    candidate: {
      url,
      official_body_name: String(parsed.official_body_name ?? "").slice(0, 200),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    },
  };
}

// Fallback grounded-search provider. Anthropic and Gemini keys in this
// project's vault are billing-blocked as of 2026-08-11 (confirmed live);
// openai_api_key is the one currently-funded key (it already carries all
// hv-classify traffic). gpt-4o-mini-search-preview has native web search
// built into Chat Completions -- no separate search-API signup needed,
// which matters because this function can wire up a code-level fallback
// but cannot itself create a brand-new third-party account/key.
async function findCandidateOpenAI(country: string, cls: string): Promise<{ candidate?: Candidate; error?: string }> {
  if (!OPENAI_API_KEY) return { error: "no_openai_api_key" };

  const desc = CLASS_DESCRIPTIONS[cls] ?? cls;
  const system = `You find official government website URLs for a B2B regulatory-intelligence source registry. Use your web search capability to confirm the URL is real and currently live before answering. If you cannot find a confident, verifiable, official (government-owned, not a news article about it) URL, say so.
Reply with STRICT JSON only, no prose, no markdown fences, no citations outside the JSON:
{"found": true, "url": "https://...", "official_body_name": "...", "confidence": 0.0-1.0}
or
{"found": false, "reason": "..."}`;
  const user = `Country: ${country}\nSource class needed: ${cls} -- ${desc}\nFind the single best, current, official URL.`;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_SEARCH_MODEL,
        web_search_options: {},
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch (e) {
    return { error: `fetch_threw: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    return { error: `openai_${res.status}: ${bodyText.slice(0, 300)}` };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) return { error: "no_text_in_openai_response" };

  const parsed = extractJson(text);
  if (!parsed) return { error: "unparseable_json" };
  if (parsed.found !== true) return { error: `model_reported_not_found: ${String(parsed.reason ?? "")}`.slice(0, 200) };

  const url = String(parsed.url ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return { error: "invalid_url_shape" };

  return {
    candidate: {
      url,
      official_body_name: String(parsed.official_body_name ?? "").slice(0, 200),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    },
  };
}

// Provider-selecting wrapper. Order: Anthropic (best tool-use fit) -> OpenAI
// (paid fallback) -> Wikidata (free, no-key fallback, tried whenever the paid
// providers are absent/erroring -- not just when both keys are missing
// entirely). This means the pipeline produces real, live-verified results
// even when every paid key is at $0 balance, which is the actual state of
// this project's vault as of 2026-08-12.
async function findCandidate(
  country: string,
  cls: string,
): Promise<{ candidate?: Candidate; error?: string; provider?: string }> {
  const attempts: string[] = [];

  if (ANTHROPIC_API_KEY) {
    const a = await findCandidateAnthropic(country, cls);
    if (a.candidate) return { ...a, provider: "anthropic" };
    if (a.error && a.error.startsWith("model_reported_not_found")) {
      return { ...a, provider: "anthropic" };
    }
    attempts.push(`anthropic: ${a.error}`);
  }

  if (OPENAI_API_KEY) {
    const o = await findCandidateOpenAI(country, cls);
    if (o.candidate) return { ...o, provider: "openai_fallback" };
    if (o.error && o.error.startsWith("model_reported_not_found")) {
      return { ...o, provider: "openai_fallback" };
    }
    attempts.push(`openai: ${o.error}`);
  }

  // Always try the free path last, regardless of whether paid keys exist --
  // this is the "works even at $0 spend" guarantee.
  const w = await findCandidateWikidata(country, cls);
  if (w.candidate) return { ...w, provider: "wikidata_free" };
  attempts.push(`wikidata: ${w.error}`);

  return { error: attempts.join(" | ") || "no_provider_configured", provider: "all_failed" };
}

// Free, no-key, no-billing fallback provider. Wikidata's public API requires
// no account, no API key, and no payment of any kind -- it's the one path in
// this function that works regardless of anyone's credit balance. Lower hit
// rate than a real LLM search (many entities lack an official-website claim,
// and search-term matching is fuzzier), but it costs nothing and every
// candidate it returns still goes through the same live verifyLive() check
// before insertion -- same safety bar as the paid providers.
const WIKIDATA_SEARCH_PHRASE: Record<string, string> = {
  health_authority: "Ministry of Health of",
  drug_control_authority: "narcotics control agency of",
  official_gazette: "official gazette of",
  legislature: "parliament of",
  customs_import_export: "customs authority of",
  procurement: "public procurement agency of",
  medicine_license_registry: "medicines regulatory authority of",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findCandidateWikidata(country: string, cls: string): Promise<{ candidate?: Candidate; error?: string }> {
  // Pace requests -- confirmed live that unpaced calls trip Wikidata's rate
  // limit (429) partway through a batch of 10 (each pair can make up to 4
  // Wikidata calls: 1 search + up to 3 entity lookups).
  await sleep(300);
  const phrase = WIKIDATA_SEARCH_PHRASE[cls] ?? cls;
  const query = `${phrase} ${country}`;

  // Full-text search (not the prefix-oriented wbsearchentities autocomplete
  // endpoint) -- tolerant of label mismatches like our generic "Ministry of
  // Health of X" query against a real label like "Ministry of Public Health
  // (X)". Returns Wikidata page titles, which for item pages are QIDs.
  let searchRes: Response;
  try {
    searchRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=0&srlimit=3&format=json`,
      { headers: { "User-Agent": "HarbourviewSourceDiscovery/1.0 (contact: ops@harbourview)" } },
    );
  } catch (e) {
    return { error: `wikidata_search_threw: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!searchRes.ok) return { error: `wikidata_search_${searchRes.status}` };
  const searchData = await searchRes.json();
  const hits = Array.isArray(searchData?.query?.search) ? searchData.query.search : [];
  if (hits.length === 0) {
    return { error: `wikidata_no_search_hits (raw: ${JSON.stringify(searchData).slice(0, 200)})` };
  }

  // Try each of the top hits until one has an official-website claim.
  for (const hit of hits) {
    const qid = hit.title;
    if (!qid || !/^Q\d+$/.test(qid)) continue;
    await sleep(200);
    let claimsRes: Response;
    try {
      claimsRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=labels|claims&languages=en&format=json`,
        { headers: { "User-Agent": "HarbourviewSourceDiscovery/1.0 (contact: ops@harbourview)" } },
      );
    } catch {
      continue;
    }
    if (!claimsRes.ok) continue;
    const claimsData = await claimsRes.json();
    const entity = claimsData?.entities?.[qid];
    const url = entity?.claims?.P856?.[0]?.mainsnak?.datavalue?.value;
    const label = entity?.labels?.en?.value;
    if (typeof url === "string" && /^https?:\/\//i.test(url)) {
      return {
        candidate: {
          url,
          official_body_name: String(label ?? `${country} ${cls}`).slice(0, 200),
          confidence: 0.55, // heuristic search match, not reasoned -- flagged lower than LLM picks
        },
      };
    }
  }
  return { error: "wikidata_no_official_website_claim_on_top_hits" };
}

// Independent verification: this function does its own live check, it does
// not trust the LLM's claim that a URL is live. Returns the final resolved
// URL (after redirects) on success.
async function verifyLive(url: string): Promise<{ ok: boolean; resolvedUrl?: string; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HarbourviewSourceDiscovery/1.0)" },
    });
    clearTimeout(timeout);
    if (res.status >= 200 && res.status < 400) {
      return { ok: true, resolvedUrl: res.url || url };
    }
    return { ok: false, error: `http_${res.status}` };
  } catch (e) {
    clearTimeout(timeout);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(Math.max(Number(body.batchSize ?? 6), 1), 15);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: jobRow, error: jobInsertErr } = await supabase
    .from("source_discovery_jobs")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (jobInsertErr) return json({ ok: false, error: "job_log_insert_failed", detail: jobInsertErr.message }, 500);
  const jobId = jobRow.id;

  const errors: string[] = [];
  let candidatesFound = 0;
  let candidatesVerified = 0;
  let sourcesInserted = 0;

  // Note: there's no "no provider configured" early-exit anymore -- the
  // Wikidata path in findCandidate() requires no key at all, so this
  // function always has at least one working, free provider available.

  // 1. Load queue countries (excluding non-viable) and existing coverage.
  const { data: queueRows, error: qErr } = await supabase
    .from("source_expansion_coverage_queue")
    .select("country, iso")
    .order("country", { ascending: true });
  if (qErr) {
    await supabase.from("source_discovery_jobs").update({ finished_at: new Date().toISOString(), status: "error", errors: JSON.stringify([qErr.message]) }).eq("id", jobId);
    return json({ ok: false, error: "queue_query_failed", detail: qErr.message }, 500);
  }

  const { data: existingRows, error: srErr } = await supabase
    .from("source_registry")
    .select("iso, regulator_class")
    .not("regulator_class", "is", null)
    .neq("regulator_class", "other");
  if (srErr) {
    await supabase.from("source_discovery_jobs").update({ finished_at: new Date().toISOString(), status: "error", errors: JSON.stringify([srErr.message]) }).eq("id", jobId);
    return json({ ok: false, error: "registry_query_failed", detail: srErr.message }, 500);
  }

  const existing = new Set((existingRows ?? []).map((r) => `${r.iso}|${r.regulator_class}`));

  // 2a. Load attempt history so we don't re-select the same permanently-
  // failing pairs every run (confirmed live: without this, the engine
  // stalled re-trying Afghanistan's unfillable classes for 5 straight runs
  // instead of advancing through the country list).
  const { data: attemptRows, error: attErr } = await supabase
    .from("source_discovery_attempts")
    .select("iso, regulator_class, last_attempted_at");
  if (attErr) {
    await supabase.from("source_discovery_jobs").update({ finished_at: new Date().toISOString(), status: "error", errors: JSON.stringify([attErr.message]) }).eq("id", jobId);
    return json({ ok: false, error: "attempts_query_failed", detail: attErr.message }, 500);
  }
  const lastAttempted = new Map<string, number>();
  for (const r of attemptRows ?? []) {
    lastAttempted.set(`${r.iso}|${r.regulator_class}`, r.last_attempted_at ? new Date(r.last_attempted_at).getTime() : 0);
  }

  // 2b. Build every missing (country, iso, class) candidate, then sort:
  // never-attempted first, then oldest-attempted-first. This guarantees
  // forward progress across the full space -- permanent failures (e.g. no
  // Wikidata entity exists for a class in a given country) get revisited
  // only after everything else has had a first shot, on a rotating basis,
  // instead of blocking all progress every single run.
  const candidates: { country: string; iso: string; cls: string; lastAttempt: number }[] = [];
  for (const row of queueRows ?? []) {
    if (!row.iso || NON_VIABLE_ISO.has(row.iso)) continue;
    for (const cls of CLASSES) {
      if (existing.has(`${row.iso}|${cls}`)) continue;
      const key = `${row.iso}|${cls}`;
      candidates.push({ country: row.country, iso: row.iso, cls, lastAttempt: lastAttempted.get(key) ?? 0 });
    }
  }
  candidates.sort((a, b) => a.lastAttempt - b.lastAttempt); // 0 (never attempted) sorts first
  const pairs = candidates.slice(0, batchSize).map((c) => ({ country: c.country, iso: c.iso, cls: c.cls }));

  // 3. Work the batch.
  const providersUsed = new Set<string>();
  for (const p of pairs) {
    const { candidate, error, provider } = await findCandidate(p.country, p.cls);
    if (provider) providersUsed.add(provider);

    const recordAttempt = async (succeeded: boolean, errText?: string) => {
      const { data: prior } = await supabase
        .from("source_discovery_attempts")
        .select("attempt_count")
        .eq("iso", p.iso)
        .eq("regulator_class", p.cls)
        .maybeSingle();
      await supabase.from("source_discovery_attempts").upsert(
        {
          iso: p.iso,
          regulator_class: p.cls,
          last_attempted_at: new Date().toISOString(),
          last_provider: provider ?? null,
          last_succeeded: succeeded,
          last_error: errText?.slice(0, 300) ?? null,
          attempt_count: (prior?.attempt_count ?? 0) + 1,
        },
        { onConflict: "iso,regulator_class" },
      );
    };

    if (error) {
      errors.push(`${p.country}/${p.cls} [${provider ?? "?"}]: ${error}`);
      await recordAttempt(false, error);
      continue;
    }
    if (!candidate) continue;
    candidatesFound++;

    const live = await verifyLive(candidate.url);
    if (!live.ok) {
      const errText = `candidate ${candidate.url} failed live check (${live.error})`;
      errors.push(`${p.country}/${p.cls}: ${errText}`);
      await recordAttempt(false, errText);
      continue;
    }
    candidatesVerified++;
    const finalUrl = live.resolvedUrl ?? candidate.url;

    const { error: insErr } = await supabase.from("source_registry").insert({
      source_name: `${p.country} ${candidate.official_body_name || p.cls}`.slice(0, 200),
      source_url: finalUrl,
      adapter: "html_snapshot",
      crawl_cadence: "weekly",
      tier: 2,
      content_type: ["regulatory"],
      country: p.country,
      iso: p.iso,
      regulator_class: p.cls,
      relevance_status: "active",
      notes: `Auto-discovered by source-discovery-engine via ${provider}, verified live (${new Date().toISOString().slice(0, 10)}), model confidence ${candidate.confidence}.`,
    });
    if (insErr) {
      // Likely a source_url unique-constraint conflict -- not a failure worth
      // surfacing loudly, just means it already existed.
      errors.push(`${p.country}/${p.cls}: insert skipped/failed (${insErr.message.slice(0, 150)})`);
      await recordAttempt(false, insErr.message);
      continue;
    }
    sourcesInserted++;
    await recordAttempt(true);

    await supabase
      .from("source_expansion_coverage_queue")
      .update({
        notes: `2026-08-11+: ${p.cls} auto-discovered and verified live by source-discovery-engine.`,
        updated_at: new Date().toISOString(),
      })
      .eq("iso", p.iso);
  }

  await supabase
    .from("source_discovery_jobs")
    .update({
      finished_at: new Date().toISOString(),
      status: "completed",
      provider_used: [...providersUsed].join(",") || "none",
      pairs_attempted: pairs.length,
      candidates_found: candidatesFound,
      candidates_verified_live: candidatesVerified,
      sources_inserted: sourcesInserted,
      errors: JSON.stringify(errors),
      detail: { pairs_requested: pairs.map((p) => `${p.iso}:${p.cls}`) },
    })
    .eq("id", jobId);

  return json({
    ok: true,
    jobId,
    pairsAttempted: pairs.length,
    candidatesFound,
    candidatesVerified,
    sourcesInserted,
    errorCount: errors.length,
    errors: errors.slice(0, 10),
  });
});
