// supabase/functions/ingest-source/index.ts
// Deno Edge Function — fetches one regulatory source URL, creates a
// source_snapshot, and updates the source's health state.
//
// Called by:
//   • The /api/admin/signals/trigger-ingest Next.js API route (on-demand)
//   • Future pg_net triggers from the DB
//
// Request body: { source_id: string }
// Response:     { ok, source_id, changed, snapshot_id, response_time_ms } | { ok: false, error }
//
// Required Supabase secrets (set in Dashboard → Settings → Edge Functions):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const SUPABASE_URL            = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const FETCH_TIMEOUT_MS = 25_000
const MAX_TEXT_BYTES   = 200_000

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`DB ${res.status} for ${path}: ${text.slice(0, 300)}`)
  return (text ? JSON.parse(text) : null) as T
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405)

  let body: { source_id?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const { source_id } = body
  if (!source_id) return json({ error: 'source_id required' }, 400)

  // Load source
  const sources = await db<Record<string, unknown>[]>(
    `/rest/v1/regulatory_signals.sources?id=eq.${encodeURIComponent(source_id)}&select=id,source_name,base_url,watch_url,rss_url,access_method,last_content_hash,consecutive_failures&limit=1`,
  ).catch(() => [])

  const source = sources[0]
  if (!source) return json({ error: 'Source not found', source_id }, 404)

  const fetchUrl = String(source.watch_url || source.rss_url || source.base_url || '')
  if (!fetchUrl) return json({ error: 'No URL configured', source_id }, 422)

  const t0 = Date.now()
  let rawText = ''
  let httpStatus = 0
  let errorMessage: string | null = null

  try {
    const resp = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Harbourview Signal Watcher/1.0 (+https://harbourview.co)',
        Accept: 'text/html,application/xhtml+xml,application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    httpStatus = resp.status
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const buf = await resp.arrayBuffer()
    rawText = new TextDecoder().decode(buf).slice(0, MAX_TEXT_BYTES)
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err)
    const prevFailures = Number(source.consecutive_failures ?? 0)
    await db(`/rest/v1/regulatory_signals.sources?id=eq.${encodeURIComponent(source_id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        last_checked_at: new Date().toISOString(),
        last_error: errorMessage,
        consecutive_failures: prevFailures + 1,
      }),
    }).catch(() => {})
    await db('/rest/v1/regulatory_signals.source_check_runs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        source_id, status: 'error', http_status: httpStatus,
        response_time_ms: Date.now() - t0, error_message: errorMessage,
      }),
    }).catch(() => {})
    return json({ ok: false, source_id, error: errorMessage })
  }

  // Normalise: strip scripts/styles, collapse whitespace
  const cleaned = rawText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const contentHash = await sha256(cleaned)
  const previousHash = source.last_content_hash as string | null
  const changed = contentHash !== (previousHash ?? '')
  const responseTimeMs = Date.now() - t0

  // Create snapshot only when content actually changed
  let snapshotId: string | null = null
  if (changed) {
    const rows = await db<{ id: string }[]>(
      '/rest/v1/regulatory_signals.source_snapshots?select=id',
      {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          source_id,
          source_url: fetchUrl,
          raw_text: cleaned.slice(0, 100_000),
          content_hash: contentHash,
          previous_hash: previousHash,
          changed: true,
        }),
      },
    ).catch(() => [])
    snapshotId = rows[0]?.id ?? null
  }

  // Persist check run and update source state
  await Promise.all([
    db('/rest/v1/regulatory_signals.source_check_runs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        source_id, status: 'ok', http_status: httpStatus,
        response_time_ms: responseTimeMs, content_hash: contentHash,
        previous_hash: previousHash, changed, snapshot_id: snapshotId,
      }),
    }).catch(() => {}),
    db(`/rest/v1/regulatory_signals.sources?id=eq.${encodeURIComponent(source_id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        last_checked_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error: null,
        consecutive_failures: 0,
        last_content_hash: contentHash,
        ...(changed ? { last_changed_at: new Date().toISOString(), watch_status: 'changed' } : { watch_status: 'healthy' }),
      }),
    }).catch(() => {}),
  ])

  return json({ ok: true, source_id, changed, snapshot_id: snapshotId, response_time_ms: responseTimeMs })
})
