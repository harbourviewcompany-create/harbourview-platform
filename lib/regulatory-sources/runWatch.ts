import {
  buildDraftSignalSlug,
  buildPrivateSummary,
  checkRegulatorySource,
  publicSignalSourceFields,
  type WatchableRegulatorySource,
} from './watcher'

function resolveSupabaseCredentials(): { url: string; key: string } | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim().replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return { url, key }
}

export type RegulatoryWatchEvidence = {
  source: string
  status: string
  http_status: number | null
  changed: boolean
  relevant: boolean
  snapshot_id: string | null
  signal_ids: string[]
  error: string | null
}

export type RegulatoryWatchSummary = {
  ok: boolean
  checked: number
  successful: number
  snapshots_created: number
  draft_signals_created_or_existing: number
  evidence: RegulatoryWatchEvidence[]
  error?: string
}

async function db<T>(url: string, key: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${res.status} for ${path}: ${text.slice(0, 300)}`)
  return (text ? JSON.parse(text) : null) as T
}

async function createSnapshot(
  url: string, key: string,
  source: WatchableRegulatorySource,
  result: Awaited<ReturnType<typeof checkRegulatorySource>>,
) {
  const rows = await db<{ id: string }[]>(url, key, '/rest/v1/regulatory_signals.source_snapshots?select=id', {
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

async function createDraftSignal(
  url: string, key: string,
  source: WatchableRegulatorySource,
  item: Awaited<ReturnType<typeof checkRegulatorySource>>['items'][number],
) {
  if (!item.relevant) return null
  const slug = buildDraftSignalSlug(source, item)
  const existing = await db<{ id: string }[]>(url, key, `/rest/v1/regulatory_signals.signals?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`)
  if (existing[0]?.id) return existing[0].id

  const rows = await db<{ id: string }[]>(url, key, '/rest/v1/regulatory_signals.signals?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      slug,
      headline: item.title.slice(0, 240),
      signal_type: item.signal_type,
      review_status: 'draft',
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
  url: string, key: string,
  source: WatchableRegulatorySource,
  result: Awaited<ReturnType<typeof checkRegulatorySource>>,
  snapshotId: string | null,
  signalId: string | null,
) {
  const now = new Date().toISOString()
  await db(url, key, `/rest/v1/regulatory_signals.sources?id=eq.${source.id}`, {
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
  await db(url, key, '/rest/v1/regulatory_signals.source_check_runs', {
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

/**
 * Runs the Fresh Regulatory Sources watcher against up to `limit` sources,
 * oldest-checked-first, so repeated runs cycle through the full registry.
 * Creates source_snapshots / source_check_runs rows for every source, and
 * draft signals (review_status='captured', public_safe=false) in
 * regulatory_signals.signals for relevant items, awaiting human review at
 * /admin/signals/review.
 */
export async function runRegulatoryWatch(limit = 20): Promise<RegulatoryWatchSummary> {
  const creds = resolveSupabaseCredentials()
  if (!creds) {
    return { ok: false, checked: 0, successful: 0, snapshots_created: 0, draft_signals_created_or_existing: 0, evidence: [], error: 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.' }
  }
  const { url, key } = creds

  const params = new URLSearchParams({
    select: 'id,source_name,source_type,source_tier,country_code,country_name,region,jurisdiction,regulator_name,base_url,watch_url,rss_url,language_code,access_method,watch_frequency,watch_status,last_content_hash',
    is_active: 'eq.true',
    watcher_enabled: 'eq.true',
    order: 'last_checked_at.asc.nullsfirst',
    limit: String(limit),
  })

  const sources = await db<WatchableRegulatorySource[]>(url, key, `/rest/v1/regulatory_signals.sources?${params}`)
  const evidence: RegulatoryWatchEvidence[] = []

  for (const source of sources) {
    let snapshotId: string | null = null
    const signalIds: string[] = []
    try {
      const result = await checkRegulatorySource(source)
      snapshotId = await createSnapshot(url, key, source, result)
      for (const item of result.items.filter((row) => row.relevant).slice(0, 5)) {
        const id = await createDraftSignal(url, key, source, item)
        if (id) signalIds.push(id)
      }
      await persistRun(url, key, source, result, snapshotId, signalIds[0] || null)
      evidence.push({
        source: source.source_name,
        status: result.status,
        http_status: result.http_status,
        changed: result.changed,
        relevant: result.relevant,
        snapshot_id: snapshotId,
        signal_ids: signalIds,
        error: result.error_message,
      })
    } catch (error) {
      // A single source's failure (e.g. a constraint violation on insert) must
      // not abort the whole batch — without this, one bad source blocks
      // last_checked_at from advancing for every source that follows it,
      // since the query orders oldest-checked-first.
      const message = error instanceof Error ? error.message : 'Unknown regulatory watch failure'
      console.error('regulatory_watch: source failed, continuing batch', { source: source.source_name, message })
      evidence.push({
        source: source.source_name,
        status: 'failing',
        http_status: null,
        changed: false,
        relevant: false,
        snapshot_id: snapshotId,
        signal_ids: signalIds,
        error: message,
      })
    }
  }

  return {
    ok: true,
    checked: evidence.length,
    successful: evidence.filter((row) => !row.error).length,
    snapshots_created: evidence.filter((row) => row.snapshot_id).length,
    draft_signals_created_or_existing: evidence.reduce((sum, row) => sum + row.signal_ids.length, 0),
    evidence,
  }
}
