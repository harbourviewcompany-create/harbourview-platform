// app/api/cron/meltwater-enrich/route.ts
// Vercel Cron — pulls fresh media mentions from Meltwater and stages them
// into source_snapshots (processing_status='pending_extraction') so the
// existing intelligence-extract + trg_promote_snapshot path processes them
// like any other source.
//
// Canonical pipeline:
//   Meltwater API → source_snapshots (pending_extraction)
//     → intelligence-extract / promote → signals → digests / briefings
//
// Required env:
//   CRON_SECRET
//   MELTWATER_API_KEY
//   MELTWATER_SEARCH_IDS          (comma-separated saved-search IDs)
//
// Strongly recommended:
//   MELTWATER_SOURCE_ID           (source_registry.id for this connector)
//
// Optional:
//   MELTWATER_LOOKBACK_HOURS      (default 48)
//   MELTWATER_MAX_PER_SEARCH      (default 40, max 100)

import { NextRequest, NextResponse } from 'next/server'
import {
  createMeltwaterClient,
  mentionToSnapshotRow,
  type MeltwaterSnapshotRow,
} from '@/lib/connectors/meltwater'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const DEFAULT_LOOKBACK_HOURS = 48
const DEFAULT_MAX_PER_SEARCH = 40

function getSupabaseAdmin(): SupabaseClient<any, 'api'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin credentials missing')
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })
}

/**
 * Resolve the source_registry id used for Meltwater snapshots.
 * Prefer an explicit MELTWATER_SOURCE_ID. If absent, attempt to find a
 * registry row tagged as meltwater; otherwise skip writes (safe no-op).
 */
async function resolveSourceId(
  supabase: SupabaseClient<any, 'api'>,
): Promise<{ sourceId: string | null; reason?: string }> {
  const configured = process.env.MELTWATER_SOURCE_ID?.trim()
  if (configured) return { sourceId: configured }

  // Best-effort lookup: source_name / adapter / metadata containing meltwater
  const { data, error } = await supabase
    .from('source_registry')
    .select('id')
    .or('source_name.ilike.%meltwater%,adapter.eq.api')
    .limit(1)
    .maybeSingle()

  if (error) {
    return { sourceId: null, reason: `source_registry lookup failed: ${error.message}` }
  }
  if (data?.id) return { sourceId: data.id }

  return {
    sourceId: null,
    reason:
      'MELTWATER_SOURCE_ID not set and no meltwater row found in source_registry — staging skipped',
  }
}

/**
 * Insert snapshots, skipping any whose content hash already exists for this source.
 * Returns count of newly inserted rows.
 */
async function stageSnapshots(
  supabase: SupabaseClient<any, 'api'>,
  rows: MeltwaterSnapshotRow[],
): Promise<{ inserted: number; skipped: number; error?: string }> {
  if (rows.length === 0) return { inserted: 0, skipped: 0 }

  const hashes = rows.map((r) => r.raw_html_hash)
  const sourceId = rows[0].source_id

  // Dedupe against recent snapshots for this source
  const { data: existing, error: lookupError } = await supabase
    .from('source_snapshots')
    .select('raw_html_hash')
    .eq('source_id', sourceId)
    .in('raw_html_hash', hashes)

  if (lookupError) {
    return { inserted: 0, skipped: 0, error: lookupError.message }
  }

  const existingSet = new Set((existing ?? []).map((r) => r.raw_html_hash))
  const novel = rows.filter((r) => !existingSet.has(r.raw_html_hash))

  if (novel.length === 0) {
    return { inserted: 0, skipped: rows.length }
  }

  // Insert only novel rows. metadata column may or may not exist depending
  // on migration state — strip it if the insert fails on that column.
  const payload = novel.map((r) => ({
    source_id: r.source_id,
    captured_url: r.captured_url,
    captured_at: r.captured_at,
    captured_text: r.captured_text,
    raw_html_hash: r.raw_html_hash,
    processing_status: r.processing_status,
    fetch_status: r.fetch_status,
    changed: r.changed,
    error_message: r.error_message,
    // metadata is best-effort; some deployments may not have the column yet
    metadata: r.metadata,
  }))

  let { error } = await supabase.from('source_snapshots').insert(payload)

  if (error && /metadata|column/i.test(error.message)) {
    // Retry without metadata
    const stripped = payload.map(({ metadata: _m, ...rest }) => rest)
    const retry = await supabase.from('source_snapshots').insert(stripped)
    error = retry.error
  }

  if (error) {
    return { inserted: 0, skipped: rows.length - novel.length, error: error.message }
  }

  return {
    inserted: novel.length,
    skipped: rows.length - novel.length,
  }
}

export async function GET(req: NextRequest) {
  const started = Date.now()
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(req.url).searchParams.get('dry') === '1'
  const lookbackHours = Number(process.env.MELTWATER_LOOKBACK_HOURS ?? DEFAULT_LOOKBACK_HOURS)
  const maxPerSearch = Math.min(
    Number(process.env.MELTWATER_MAX_PER_SEARCH ?? DEFAULT_MAX_PER_SEARCH),
    100,
  )
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)

  const searchIds = (process.env.MELTWATER_SEARCH_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (searchIds.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'MELTWATER_SEARCH_IDS not configured',
      durationMs: Date.now() - started,
    })
  }

  let supabase: SupabaseClient<any, 'api'>
  try {
    supabase = getSupabaseAdmin()
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Supabase init failed' },
      { status: 503 },
    )
  }

  const { sourceId, reason: sourceReason } = await resolveSourceId(supabase)
  if (!sourceId) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: sourceReason,
      durationMs: Date.now() - started,
    })
  }

  const client = createMeltwaterClient()
  let totalMentions = 0
  let inserted = 0
  let skippedDupe = 0
  const errors: string[] = []
  const perSearch: Array<{ searchId: string; mentions: number; inserted: number }> = []

  for (const searchId of searchIds) {
    try {
      const mentions = await client.fetchNewMentions({
        searchId,
        since,
        limit: maxPerSearch,
      })
      totalMentions += mentions.length

      if (mentions.length === 0) {
        perSearch.push({ searchId, mentions: 0, inserted: 0 })
        continue
      }

      const rows = mentions.map((m) =>
        mentionToSnapshotRow(m, { sourceId, searchId }),
      )

      if (dryRun) {
        perSearch.push({ searchId, mentions: mentions.length, inserted: 0 })
        continue
      }

      const result = await stageSnapshots(supabase, rows)
      inserted += result.inserted
      skippedDupe += result.skipped
      if (result.error) errors.push(`${searchId}: ${result.error}`)
      perSearch.push({
        searchId,
        mentions: mentions.length,
        inserted: result.inserted,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${searchId}: ${msg}`)
      console.error('meltwater-enrich: search failed', searchId, msg)
    }
  }

  const summary = {
    ok: true,
    dryRun,
    sourceId,
    searchIds: searchIds.length,
    totalMentions,
    inserted,
    skippedDupe,
    perSearch,
    errors: errors.slice(0, 8),
    durationMs: Date.now() - started,
  }

  console.info('meltwater-enrich: run complete', summary)
  return NextResponse.json(summary)
}
