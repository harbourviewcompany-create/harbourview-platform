import {
  buildDraftSignalSlug,
  buildPrivateSummary,
  checkRegulatorySource,
  publicSignalSourceFields,
  type WatchableRegulatorySource,
} from '../lib/regulatory-sources/watcher'

type Config = { url: string; key: string }

function config(): Config {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  return { url, key }
}

async function db<T>(cfg: Config, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${cfg.url}${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${res.status} for ${path}: ${text.slice(0, 300)}`)
  return (text ? JSON.parse(text) : null) as T
}

async function createSnapshot(cfg: Config, source: WatchableRegulatorySource, result: Awaited<ReturnType<typeof checkRegulatorySource>>) {
  const rows = await db<{ id: string }[]>(cfg, '/rest/v1/regulatory_signals.source_snapshots?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      source_id: source.id,
      source_url: result.source_url,
      title: result.title,
      raw_text: result.raw_text,
      content_hash: result.content_hash,
      previous_hash: result.previous_hash,
      changed: result.changed,
    }),
  })
  return rows[0]?.id ?? null
}

async function createDraftSignal(cfg: Config, source: WatchableRegulatorySource, item: Awaited<ReturnType<typeof checkRegulatorySource>>['items'][number]) {
  if (!item.relevant) return null
  const slug = buildDraftSignalSlug(source, item)
  const existing = await db<{ id: string }[]>(cfg, `/rest/v1/regulatory_signals.signals?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`)
  if (existing[0]?.id) return existing[0].id

  const rows = await db<{ id: string }[]>(cfg, '/rest/v1/regulatory_signals.signals?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      slug,
      headline: item.title.slice(0, 240),
      signal_type: item.signal_type,
      review_status: 'captured',
      confidence: 'medium',
      impact_level: 'moderate',
      ...publicSignalSourceFields(source),
      signal_date: (item.published_at || new Date().toISOString()).slice(0, 10),
      source_published_at: item.published_at,
      source_url: item.url,
      canonical_source_url: item.url,
      source_id: source.id,
      private_summary: buildPrivateSummary(source, item),
      public_safe: false,
      publish_to_public: false,
      private_notes: 'Draft created by Fresh Regulatory Sources watcher. Requires review before publication.',
    }),
  })
  return rows[0]?.id ?? null
}

async function persistRun(
  cfg: Config,
  source: WatchableRegulatorySource,
  result: Awaited<ReturnType<typeof checkRegulatorySource>>,
  snapshotId: string | null,
  signalId: string | null,
) {
  const now = new Date().toISOString()
  await db(cfg, `/rest/v1/regulatory_signals.sources?id=eq.${source.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      watch_status: result.status,
      last_checked_at: now,
      last_success_at: result.error_message ? null : now,
      last_changed_at: result.changed ? now : null,
      last_error: result.error_message,
      last_content_hash: result.content_hash,
    }),
  })
  await db(cfg, '/rest/v1/regulatory_signals.source_check_runs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      source_id: source.id,
      status: result.status,
      http_status: result.http_status,
      response_time_ms: result.response_time_ms,
      content_hash: result.content_hash,
      previous_hash: result.previous_hash,
      changed: result.changed,
      snapshot_id: snapshotId,
      signal_id: signalId,
      error_message: result.error_message,
    }),
  })
}

async function main() {
  const cfg = config()
  const limit = Number(process.env.HARBOURVIEW_SOURCE_CHECK_LIMIT || process.argv[2] || 20)
  const params = new URLSearchParams({
    select: 'id,source_name,source_type,source_tier,country_code,country_name,region,jurisdiction,regulator_name,base_url,watch_url,rss_url,language_code,access_method,watch_frequency,watch_status,last_content_hash',
    is_active: 'eq.true',
    watcher_enabled: 'eq.true',
    order: 'last_checked_at.asc.nullsfirst',
    limit: String(limit),
  })
  const sources = await db<WatchableRegulatorySource[]>(cfg, `/rest/v1/regulatory_signals.sources?${params}`)
  const evidence = []

  for (const source of sources) {
    const result = await checkRegulatorySource(source)
    const snapshotId = await createSnapshot(cfg, source, result)
    const signalIds: string[] = []
    for (const item of result.items.filter((row) => row.relevant).slice(0, 5)) {
      const id = await createDraftSignal(cfg, source, item)
      if (id) signalIds.push(id)
    }
    await persistRun(cfg, source, result, snapshotId, signalIds[0] || null)
    evidence.push({ source: source.source_name, status: result.status, http_status: result.http_status, changed: result.changed, relevant: result.relevant, snapshot_id: snapshotId, signal_ids: signalIds, error: result.error_message })
  }

  console.log(JSON.stringify({ ok: true, checked: evidence.length, successful: evidence.filter((row) => !row.error).length, snapshots_created: evidence.filter((row) => row.snapshot_id).length, draft_signals_created_or_existing: evidence.reduce((sum, row) => sum + row.signal_ids.length, 0), evidence }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
