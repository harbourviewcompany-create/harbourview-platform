import fs from "node:fs";

const projectRef = process.env.SUPABASE_PROJECT_REF || "zvxdgdkukjrrwamdpqrg";
const expectedProjectRef = "zvxdgdkukjrrwamdpqrg";
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sourceVersion = process.env.SOURCE_IMPORT_VERSION || "phase1_uploaded_5359_20260528";

if (projectRef !== expectedProjectRef) throw new Error(`Unexpected project ref: ${projectRef}`);
if (!supabaseUrl || !supabaseUrl.includes(expectedProjectRef)) throw new Error("Missing or unexpected Supabase URL");
if (!serviceKey) throw new Error("Missing service key env value");

const authHeader = ["Bearer", serviceKey].join(" ");

async function rest(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: serviceKey as string,
      Authorization: authHeader,
      "Content-Type": "application/json",
      ...headers
    }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`REST ${res.status} ${path}: ${text}`);
  return { res, data: JSON.parse(text) };
}

function normalizeUrl(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase().replace(/\/+$/, "");
  return normalized || null;
}

function increment(target: Record<string, number>, value: unknown) {
  const key = String(value || "").trim() || "__NULL_OR_EMPTY__";
  target[key] = (target[key] || 0) + 1;
}

async function fetchAllSources() {
  const rows: Array<Record<string, unknown>> = [];
  let total: number | null = null;
  for (let from = 0; ; from += 1000) {
    const to = from + 999;
    const { res, data } = await rest(
      "/rest/v1/source_registry?select=source_name,source_url,country,adapter,fetch_method&order=id.asc",
      { Prefer: "count=exact", Range: `${from}-${to}` }
    );
    rows.push(...data);
    const matched = res.headers.get("content-range")?.match(/\/(\d+)$/);
    if (matched) total = Number(matched[1]);
    if (!data.length || (total !== null && rows.length >= total)) break;
  }
  return { rows, total: total ?? rows.length };
}

function distribution(map: Record<string, number>, label: string) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ [label]: key, count }));
}

async function main() {
  const [{ rows, total }, batchResult, rejectionResult] = await Promise.all([
    fetchAllSources(),
    rest(`/rest/v1/source_import_batches?select=*&source_version=eq.${encodeURIComponent(sourceVersion)}&order=batch_id.asc`),
    rest(`/rest/v1/source_import_rejections?select=rejection_reason&source_version=eq.${encodeURIComponent(sourceVersion)}&limit=10000`)
  ]);

  const countries: Record<string, number> = {};
  const adapters: Record<string, number> = {};
  const fetchMethods: Record<string, number> = {};
  const normalizedUrls: Record<string, number> = {};
  const malformed = {
    missing_source_name: 0,
    missing_source_url: 0,
    non_http_url: 0,
    missing_country: 0,
    missing_adapter: 0,
    missing_fetch_method: 0,
    missing_normalized_url: 0
  };

  for (const row of rows) {
    increment(countries, row.country);
    increment(adapters, row.adapter);
    increment(fetchMethods, row.fetch_method);
    const name = String(row.source_name || "").trim();
    const url = String(row.source_url || "").trim();
    const normalized = normalizeUrl(row.source_url);
    if (!name) malformed.missing_source_name += 1;
    if (!url) malformed.missing_source_url += 1;
    if (url && !/^https?:\/\//i.test(url)) malformed.non_http_url += 1;
    if (!String(row.country || "").trim()) malformed.missing_country += 1;
    if (!String(row.adapter || "").trim()) malformed.missing_adapter += 1;
    if (!String(row.fetch_method || "").trim()) malformed.missing_fetch_method += 1;
    if (!normalized) malformed.missing_normalized_url += 1;
    if (normalized) normalizedUrls[normalized] = (normalizedUrls[normalized] || 0) + 1;
  }

  const duplicateGroups = Object.entries(normalizedUrls)
    .filter(([, count]) => count > 1)
    .map(([normalized_url, count]) => ({ normalized_url, count }));
  const batches = batchResult.data as Array<Record<string, unknown>>;
  const rejections = rejectionResult.data as Array<Record<string, unknown>>;
  const totals = {
    import_batch_count: batches.length,
    total_records_received: batches.reduce((sum, row) => sum + Number(row.records_received || 0), 0),
    total_records_inserted: batches.reduce((sum, row) => sum + Number(row.records_inserted || 0), 0),
    total_records_updated: batches.reduce((sum, row) => sum + Number(row.records_updated || 0), 0),
    total_records_rejected: batches.reduce((sum, row) => sum + Number(row.records_rejected || 0), 0),
    failed_batches: batches.filter((row) => row.status === "failed").length,
    incomplete_batches: batches.filter((row) => row.status !== "completed").length
  };
  const go = total >= 5359 && totals.total_records_received >= 5359 && totals.failed_batches === 0 && totals.incomplete_batches === 0 && duplicateGroups.length === 0 && malformed.missing_source_name === 0 && malformed.missing_source_url === 0 && malformed.non_http_url === 0;
  const report = {
    verified_at: new Date().toISOString(),
    project_ref: projectRef,
    source_version: sourceVersion,
    go_hold: go ? "GO" : "HOLD",
    source_registry_count: total,
    ...totals,
    malformed,
    duplicate_normalized_url_groups: duplicateGroups.length,
    duplicate_normalized_url_sample: duplicateGroups.slice(0, 100),
    country_distribution: distribution(countries, "country"),
    adapter_distribution: distribution(adapters, "adapter"),
    fetch_method_distribution: distribution(fetchMethods, "fetch_method"),
    rejection_rows_sampled: rejections.length
  };

  fs.mkdirSync("docs/control/source-import", { recursive: true });
  fs.writeFileSync("docs/control/source-import/phase1_actions_verification.json", JSON.stringify(report, null, 2));
  fs.writeFileSync("docs/control/source-import/phase1_actions_verification.md", `# Phase 1 Source Import Verification\n\nDecision: **${report.go_hold}**\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!go) process.exit(1);
}

main();

