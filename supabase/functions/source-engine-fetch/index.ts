import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseStructuredJson, type StructuredSourceMetadata } from "../_shared/structured-json.ts";
import {
  parseStructuredTabular,
  type StructuredTabularFormat,
  type StructuredTabularMetadata,
} from "../_shared/structured-tabular.ts";

type SourceRow = {
  id: string;
  source_name: string | null;
  source_url: string;
  adapter: string | null;
  tier: number | null;
  language: string | null;
  requires_translation: boolean | null;
  requires_auth: boolean | null;
  metadata: Record<string, unknown> | null;
};

type SnapshotCandidate = {
  captured_url: string;
  captured_title: string;
  captured_text: string;
};

type PreparedSnapshot = SnapshotCandidate & {
  hash: string;
  word_count: number;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_CALLER_HEADER = "x-harbourview-cron-caller";
const EXPECTED_CRON_CALLER = "pg_cron_source_engine_fetch";
const DEV_BYPASS_SECRET = Deno.env.get("HV_DEV_BYPASS_SECRET") ?? "";

const THIN_TEXT_THRESHOLD = 400;
const MAX_ENRICH_PER_SOURCE = 6;
const ENRICH_TIMEOUT_MS = 8000;
const ENRICHMENT_BLOCKED_HOSTS = ["news.google.com"];
const SNAPSHOT_LOOKUP_BATCH = 40;
const SNAPSHOT_INSERT_BATCH = 100;

// source-engine-fetch is an internal service-role worker. It must read the canonical
// source tables directly: the public base table carries ingestion metadata that the
// redacted api.source_registry projection intentionally does not expose.
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "public" },
});

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const CORS_HEADERS = {
  ...JSON_HEADERS,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": `authorization, content-type, ${CRON_CALLER_HEADER}, x-hv-dev-bypass`,
};

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    const encoded = JSON.stringify(error);
    if (encoded && encoded !== "{}") return encoded;
  } catch {
    // Fall through to String for non-serializable upstream errors.
  }
  return String(error);
}

function authorizeCaller(req: Request): Response | null {
  const cronCaller = req.headers.get(CRON_CALLER_HEADER) ?? "";
  const devBypass = req.headers.get("x-hv-dev-bypass") ?? "";
  const isCron = cronCaller === EXPECTED_CRON_CALLER;
  const isDev = DEV_BYPASS_SECRET && devBypass === DEV_BYPASS_SECRET;
  if (!isCron && !isDev) {
    return respond(403, { ok: false, error: "forbidden", reason: "Requires approved scheduler or operator bypass header" });
  }
  return null;
}

function isEnrichmentBlocked(url: string): boolean {
  try {
    return ENRICHMENT_BLOCKED_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function decodeEntities(input: string): string {
  const map: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => map[n] ?? m);
}

function stripTags(input: string): string {
  return decodeEntities(input)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  return stripTags(xml.match(re)?.[1] ?? "");
}

function extractAtomLink(entry: string): string {
  return decodeEntities(entry.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] ?? "").trim();
}

function parseFeed(raw: string, fallbackUrl: string): SnapshotCandidate[] {
  const items = [...raw.matchAll(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi)]
    .map((m) => ({ kind: "rss_item", block: m[0] }));
  const entries = [...raw.matchAll(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi)]
    .map((m) => ({ kind: "atom_entry", block: m[0] }));

  return [...items, ...entries].slice(0, 12).map(({ kind, block }) => {
    const title = extractTag(block, "title") || "Untitled feed item";
    const link = kind === "atom_entry" ? extractAtomLink(block) : extractTag(block, "link");
    const summary = extractTag(block, "description") || extractTag(block, "summary") || extractTag(block, "content") || "";
    return {
      captured_url: link || fallbackUrl,
      captured_title: title.slice(0, 500),
      captured_text: [title, summary].filter(Boolean).join("\n\n").slice(0, 24000),
    };
  });
}

function parseHtml(raw: string, url: string): SnapshotCandidate[] {
  const title = stripTags(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || "Untitled source snapshot";
  const meta = raw.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] ?? "";
  const text = stripTags(raw).slice(0, 24000);
  return [{
    captured_url: url,
    captured_title: title.slice(0, 500),
    captured_text: [stripTags(meta), text].filter(Boolean).join("\n\n").slice(0, 24000),
  }];
}

function looksLikeFeed(raw: string, contentType: string, adapter: string | null): boolean {
  const a = (adapter ?? "").toLowerCase();
  return a === "rss" || contentType.includes("rss") || contentType.includes("atom") || contentType.includes("xml") || /^\s*<\?xml/i.test(raw) || /<rss[\s>]/i.test(raw) || /<feed[\s>]/i.test(raw);
}

function looksLikeJson(raw: string, contentType: string, adapter: string | null): boolean {
  if ((adapter ?? "").toLowerCase() === "api") return true;
  if (contentType.includes("json")) return true;
  const trimmed = raw.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function structuredMetadata(source: SourceRow): StructuredSourceMetadata {
  const metadata = source.metadata ?? {};
  return {
    records_path: typeof metadata.records_path === "string" ? metadata.records_path : undefined,
    identity_path: typeof metadata.identity_path === "string" ? metadata.identity_path : undefined,
    title_path: typeof metadata.title_path === "string" ? metadata.title_path : undefined,
    url_path: typeof metadata.url_path === "string" ? metadata.url_path : undefined,
    record_url_template: typeof metadata.record_url_template === "string" ? metadata.record_url_template : undefined,
    max_records: typeof metadata.max_records === "number" ? metadata.max_records : undefined,
  };
}

function tabularFormat(source: SourceRow): StructuredTabularFormat | null {
  const value = source.metadata?.structured_format;
  return value === "csv" || value === "html_table" ? value : null;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  return rows.length > 0 ? rows : undefined;
}

function tabularMetadata(source: SourceRow, format: StructuredTabularFormat): StructuredTabularMetadata {
  const metadata = source.metadata ?? {};
  return {
    structured_format: format,
    delimiter: typeof metadata.delimiter === "string" ? metadata.delimiter : undefined,
    table_index: typeof metadata.table_index === "number" ? metadata.table_index : undefined,
    header_rows: typeof metadata.header_rows === "number" ? metadata.header_rows : undefined,
    columns: stringArray(metadata.columns),
    identity_columns: stringArray(metadata.identity_columns),
    title_column: typeof metadata.title_column === "string" ? metadata.title_column : undefined,
    url_column: typeof metadata.url_column === "string" ? metadata.url_column : undefined,
    record_url_template: typeof metadata.record_url_template === "string" ? metadata.record_url_template : undefined,
    max_records: typeof metadata.max_records === "number" ? metadata.max_records : undefined,
    record_offset: typeof metadata.record_offset === "number" ? metadata.record_offset : undefined,
  };
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

function uniquePreparedSnapshots(prepared: PreparedSnapshot[]): { unique: PreparedSnapshot[]; duplicates: number } {
  const seen = new Set<string>();
  const unique: PreparedSnapshot[] = [];
  let duplicates = 0;
  for (const candidate of prepared) {
    const key = `${candidate.captured_url}\n${candidate.hash}`;
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    unique.push(candidate);
  }
  return { unique, duplicates };
}

async function existingSnapshotKeys(sourceId: string, prepared: PreparedSnapshot[]): Promise<Set<string>> {
  const existing = new Set<string>();
  const uniqueUrls = [...new Set(prepared.map((candidate) => candidate.captured_url))];

  for (const urls of chunk(uniqueUrls, SNAPSHOT_LOOKUP_BATCH)) {
    const { data, error } = await supabase
      .from("source_snapshots")
      .select("captured_url,raw_html_hash")
      .eq("source_id", sourceId)
      .in("captured_url", urls);
    if (error) throw error;

    for (const row of data ?? []) {
      const capturedUrl = typeof row.captured_url === "string" ? row.captured_url : "";
      const hash = typeof row.raw_html_hash === "string" ? row.raw_html_hash : "";
      if (capturedUrl && hash) existing.add(`${capturedUrl}\n${hash}`);
    }
  }

  return existing;
}

async function insertSnapshots(source: SourceRow, prepared: PreparedSnapshot[]): Promise<void> {
  const rows = prepared.map((candidate) => ({
    source_id: source.id,
    captured_url: candidate.captured_url,
    captured_title: candidate.captured_title,
    captured_text: candidate.captured_text,
    raw_html_hash: candidate.hash,
    fetch_status: "success",
    language_detected: source.language ?? null,
    word_count: candidate.word_count,
    requires_translation: Boolean(source.requires_translation),
    processing_status: "pending",
  }));

  for (const batch of chunk(rows, SNAPSHOT_INSERT_BATCH)) {
    const { error } = await supabase.from("source_snapshots").insert(batch);
    if (error) throw error;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "HarbourviewSourceEngine/2.3 (+official-source-monitoring)",
        "Accept": "application/json,text/csv,application/csv,application/rss+xml,application/atom+xml,application/xml,text/xml,text/html,*/*;q=0.5",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function tryEnrichThinText(url: string, existingLength: number): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, ENRICH_TIMEOUT_MS);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("html") && !contentType.includes("text")) return null;
    const raw = await res.text();
    const [candidate] = parseHtml(raw, url);
    const capturedText = candidate?.captured_text ?? "";
    if (!capturedText || capturedText.length <= Math.max(existingLength, THIN_TEXT_THRESHOLD)) return null;
    return capturedText;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return respond(405, { ok: false, error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return respond(500, { ok: false, error: "missing_env" });
  const authRejection = authorizeCaller(req);
  if (authRejection) return authRejection;

  const requestUrl = new URL(req.url);
  const dryRun = requestUrl.searchParams.get("dry_run") === "true";
  const adapterParam = requestUrl.searchParams.get("adapter");
  const tierParam = requestUrl.searchParams.get("tier");
  const sourceIdParam = requestUrl.searchParams.get("source_id");
  const rawLimit = Number(requestUrl.searchParams.get("limit") ?? "20");
  const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 20, 50));

  const validAdapters = ["rss", "html_snapshot", "api"];
  if (adapterParam && !validAdapters.includes(adapterParam)) {
    return respond(400, { ok: false, error: "invalid_adapter", valid: validAdapters });
  }

  let query = supabase
    .from("source_registry")
    .select("id,source_name,source_url,adapter,tier,language,requires_translation,requires_auth,metadata")
    .eq("is_active", true)
    .eq("relevance_status", "active")
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (sourceIdParam) query = query.eq("id", sourceIdParam);
  if (adapterParam) query = query.eq("adapter", adapterParam);
  if (tierParam) query = query.eq("tier", Number(tierParam));

  const { data: sources, error: sourceError } = await query;
  if (sourceError) return respond(500, { ok: false, error: "source_query_failed", detail: sourceError.message });

  let inserted = 0;
  let skippedDuplicate = 0;
  let failed = 0;
  let enriched = 0;
  let structuredRecords = 0;
  const results: Record<string, unknown>[] = [];

  for (const source of (sources ?? []) as SourceRow[]) {
    if (source.requires_auth) {
      results.push({ source_id: source.id, source_name: source.source_name, status: "skipped", reason: "requires_auth" });
      continue;
    }

    try {
      const response = await fetchWithTimeout(source.source_url);
      const finalUrl = response.url || source.source_url;
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok) throw new Error(`http_${response.status}`);
      const raw = await response.text();
      const isFeed = looksLikeFeed(raw, contentType, source.adapter);
      const sourceTabularFormat = !isFeed ? tabularFormat(source) : null;
      const isTabular = sourceTabularFormat !== null;
      const isJson = !isFeed && !isTabular && looksLikeJson(raw, contentType, source.adapter);
      let candidates: SnapshotCandidate[];

      if (isFeed) {
        candidates = parseFeed(raw, finalUrl);
      } else if (isTabular && sourceTabularFormat) {
        try {
          candidates = parseStructuredTabular(raw, finalUrl, tabularMetadata(source, sourceTabularFormat));
          structuredRecords += candidates.length;
        } catch (error) {
          throw new Error(`invalid_tabular: ${errorMessage(error)}`);
        }
      } else if (isJson) {
        try {
          candidates = parseStructuredJson(raw, finalUrl, structuredMetadata(source));
          structuredRecords += candidates.length;
        } catch (error) {
          throw new Error(`invalid_json: ${errorMessage(error)}`);
        }
      } else {
        candidates = parseHtml(raw, finalUrl);
      }

      let sourceSkipped = 0;
      let sourceEnriched = 0;

      for (const candidate of candidates) {
        if (
          isFeed &&
          candidate.captured_text.length < THIN_TEXT_THRESHOLD &&
          candidate.captured_url !== finalUrl &&
          sourceEnriched < MAX_ENRICH_PER_SOURCE &&
          !isEnrichmentBlocked(candidate.captured_url)
        ) {
          sourceEnriched++;
          const richer = await tryEnrichThinText(candidate.captured_url, candidate.captured_text.length);
          if (richer) {
            candidate.captured_text = [candidate.captured_title, richer].filter(Boolean).join("\n\n").slice(0, 24000);
            enriched++;
          }
        }
      }

      const usable = candidates.filter((candidate) => {
        const keep = Boolean(candidate.captured_text && candidate.captured_text.length >= 2);
        if (!keep) sourceSkipped++;
        return keep;
      });

      const prepared = await Promise.all(usable.map(async (candidate): Promise<PreparedSnapshot> => ({
        ...candidate,
        hash: await sha256(`${candidate.captured_url}\n${candidate.captured_title}\n${candidate.captured_text}`),
        word_count: candidate.captured_text.split(/\s+/).filter(Boolean).length,
      })));

      const batchDedup = uniquePreparedSnapshots(prepared);
      skippedDuplicate += batchDedup.duplicates;
      sourceSkipped += batchDedup.duplicates;

      const existing = await existingSnapshotKeys(source.id, batchDedup.unique);
      const fresh = batchDedup.unique.filter((candidate) => {
        const duplicate = existing.has(`${candidate.captured_url}\n${candidate.hash}`);
        if (duplicate) {
          skippedDuplicate++;
          sourceSkipped++;
        }
        return !duplicate;
      });

      if (!dryRun && fresh.length > 0) await insertSnapshots(source, fresh);
      const sourceInserted = dryRun ? 0 : fresh.length;
      inserted += sourceInserted;

      if (!dryRun) {
        await supabase
          .from("source_registry")
          .update({ last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", source.id);
      }

      results.push({
        source_id: source.id,
        source_name: source.source_name,
        status: "ok",
        response_kind: isFeed ? "feed" : isTabular ? sourceTabularFormat : isJson ? "json" : "html",
        final_url: finalUrl,
        candidates: candidates.length,
        fresh: fresh.length,
        inserted: sourceInserted,
        skipped: sourceSkipped,
        enriched: sourceEnriched,
      });
    } catch (error) {
      failed++;
      const message = errorMessage(error);
      if (!dryRun) {
        await supabase.from("source_snapshots").insert({
          source_id: source.id,
          captured_url: source.source_url,
          captured_title: source.source_name ?? "Source fetch failed",
          captured_text: "",
          raw_html_hash: await sha256(`${source.id}:${message}:${Date.now()}`),
          fetch_status: "error",
          error_message: message.slice(0, 1000),
          language_detected: source.language ?? null,
          requires_translation: Boolean(source.requires_translation),
          processing_status: "skipped",
        });
        await supabase
          .from("source_registry")
          .update({ last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", source.id);
      }
      results.push({ source_id: source.id, source_name: source.source_name, status: "error", error: message });
    }
  }

  return respond(200, {
    ok: true,
    function: "source-engine-fetch",
    version: "2.3",
    dry_run: dryRun,
    limit,
    selected: sources?.length ?? 0,
    inserted,
    structured_records: structuredRecords,
    skipped_duplicate: skippedDuplicate,
    failed,
    enriched,
    results,
  });
});