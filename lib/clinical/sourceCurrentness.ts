/**
 * Clinical Evidence — source-metadata currentness orchestrator (Phase B)
 * Modules: Helpers | Ids | Url
 * Source-metadata only. Never publishes clinical-synthesis or bypasses D4.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type EvidenceRow,
  type FreshnessStatus,
  type RunOptions,
  type RunSummary,
  decideFreshness,
  extractDoi,
  extractPmid,
  getServiceSupabase,
  normalizeHtmlForHash,
  sha256Hex,
  titlesLikelyMatch,
} from './sourceCurrentnessHelpers'
import { resolveDoi, resolvePmid, resolveOpenAlex, probeArchiveAvailability } from './sourceCurrentnessIds'
import { checkUrl } from './sourceCurrentnessUrl'

export type { EvidenceRow, FreshnessStatus, RunOptions, RunSummary }
export {
  decideFreshness,
  extractDoi,
  extractPmid,
  getServiceSupabase,
  normalizeHtmlForHash,
  probeArchiveAvailability,
  sha256Hex,
  titlesLikelyMatch,
}

const LOCK_KEY = 'clinical_source_currentness'
const LOCK_TTL_MS = 15 * 60 * 1000
const DEFAULT_CONCURRENCY = 3
const PER_RECORD_DELAY_MS = 250
const STATUS_PRIORITY: Record<FreshnessStatus, number> = {
  'review-required': 0,
  'source-degraded': 1,
  stale: 2,
  current: 3,
}

function contentHash(body: Buffer, contentType: string | null): { hash: string; hashScope: string } {
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('html') || ct.includes('xml') || ct.includes('text')) {
    return { hash: sha256Hex(normalizeHtmlForHash(body.toString('utf8'))), hashScope: 'normalized-text' }
  }
  return { hash: sha256Hex(body), hashScope: 'source-bytes' }
}

async function tryAcquireLock(supabase: SupabaseClient): Promise<boolean> {
  const now = Date.now()
  const expires = new Date(now + LOCK_TTL_MS).toISOString()
  const { data: recent } = await supabase
    .from('clinical_evidence_change_events')
    .select('id, created_at, payload')
    .eq('event_type', 'currentness_lock')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (recent?.created_at) {
    const age = now - new Date(recent.created_at).getTime()
    const payload = recent.payload as { expiresAt?: string } | null
    if (age < LOCK_TTL_MS && payload?.expiresAt && new Date(payload.expiresAt).getTime() > now) return false
  }
  const { error } = await supabase.from('clinical_evidence_change_events').insert({
    evidence_record_id: null,
    event_type: 'currentness_lock',
    payload: { lockKey: LOCK_KEY, expiresAt: expires, acquiredAt: new Date(now).toISOString() },
  })
  if (error) console.warn('[currentness] lock insert skipped:', error.message)
  return true
}

async function persistStatus(
  supabase: SupabaseClient,
  row: EvidenceRow,
  decided: { status: FreshnessStatus; reason: string },
  dryRun: boolean
) {
  if (dryRun) return
  if (row.freshness_status !== decided.status) {
    await supabase.from('clinical_evidence_change_events').insert({
      evidence_record_id: row.id,
      event_type: 'source_currentness_check',
      payload: {
        fromStatus: row.freshness_status,
        toStatus: decided.status,
        reason: decided.reason.slice(0, 1500),
        checkedAt: new Date().toISOString(),
        phase: 'B',
      },
    })
  }
  const { error } = await supabase
    .from('clinical_evidence_records')
    .update({
      freshness_status: decided.status,
      source_currentness_checked_at: new Date().toISOString(),
      freshness_reason: decided.reason.slice(0, 2000),
    })
    .eq('id', row.id)
  if (error) console.error(`[update] ${row.id}:`, error.message)
}

async function processRecord(
  supabase: SupabaseClient,
  row: EvidenceRow,
  dryRun: boolean
): Promise<{ status: FreshnessStatus; reason: string; notModified?: boolean; archiveHit?: boolean }> {
  const url = row.primary_source_url?.trim()
  if (!url || !/^https?:\/\//i.test(url)) {
    return { status: 'source-degraded', reason: 'Missing or invalid primary_source_url' }
  }

  const doi = extractDoi(row.primary_source_id, url)
  const pmid = extractPmid(row.primary_source_id, url)
  const idNotes: string[] = []
  let retracted = false
  let remoteTitle: string | undefined

  if (doi) {
    const id = await resolveDoi(doi)
    if (id.valid === false) idNotes.push(`DOI invalid: ${id.notes}`)
    if (id.retracted) {
      retracted = true
      idNotes.push(`DOI retraction signal: ${id.notes || 'yes'}`)
    }
    if (id.title) remoteTitle = id.title
  }
  if (pmid) {
    const id = await resolvePmid(pmid)
    if (id.valid === false) idNotes.push(`PMID invalid: ${id.notes}`)
    if (id.retracted) {
      retracted = true
      idNotes.push(`PMID retraction signal: ${id.notes || 'yes'}`)
    }
    if (id.title && !remoteTitle) remoteTitle = id.title
  }
  if ((doi || pmid) && !retracted) {
    const oa = await resolveOpenAlex(doi, pmid)
    if (oa.retracted) {
      retracted = true
      idNotes.push(`OpenAlex retraction signal: ${oa.notes || 'yes'}`)
    }
    if (oa.title && !remoteTitle) remoteTitle = oa.title
  }

  const titleMismatch = !titlesLikelyMatch(row.primary_source_title, remoteTitle)
  const registryId = row.source_registry_id || row.slug || row.id

  const { data: latestSnap } = await supabase
    .from('clinical_evidence_snapshots')
    .select('id, content_sha256, retrieved_at, locator_manifest')
    .eq('source_registry_id', registryId)
    .order('retrieved_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const prior = (latestSnap?.locator_manifest || {}) as { etag?: string | null; lastModified?: string | null }
  const urlResult = await checkUrl(url, { etag: prior.etag, lastModified: prior.lastModified })

  if (urlResult.notModified) {
    const decided = decideFreshness({
      urlOk: true,
      firstCheck: false,
      hashChanged: false,
      notModified: true,
      retracted,
      titleMismatch,
      idNotes,
    })
    if (dryRun) console.log(`[dry-run] ${row.slug || row.id} → ${decided.status} | 304`)
    else await persistStatus(supabase, row, decided, dryRun)
    return { ...decided, notModified: true }
  }

  if (!urlResult.ok || !urlResult.body) {
    const archiveAvailable = await probeArchiveAvailability(url)
    const statusSuffix = urlResult.statusCode != null ? ` status=${urlResult.statusCode}` : ''
    const decided = decideFreshness({
      urlOk: false,
      urlError: `URL unreachable: ${urlResult.error || 'unknown'}${statusSuffix}`,
      firstCheck: false,
      hashChanged: false,
      retracted,
      titleMismatch: false,
      idNotes,
      archiveAvailable,
    })
    if (dryRun) console.log(`[dry-run] ${row.slug || row.id} → ${decided.status} | archive=${archiveAvailable}`)
    else await persistStatus(supabase, row, decided, dryRun)
    return { ...decided, archiveHit: archiveAvailable }
  }

  const { hash, hashScope } = contentHash(urlResult.body, urlResult.contentType)
  const hashChanged = Boolean(latestSnap?.content_sha256 && latestSnap.content_sha256 !== hash)
  const firstCheck = !latestSnap
  const decided = decideFreshness({
    urlOk: true,
    firstCheck,
    hashChanged,
    retracted,
    titleMismatch,
    idNotes,
  })

  if (dryRun) {
    console.log(`[dry-run] ${row.slug || row.id} → ${decided.status} | hash=${hash.slice(0, 12)} scope=${hashScope}`)
    return decided
  }

  if (firstCheck || hashChanged) {
    const { error: snapErr } = await supabase.from('clinical_evidence_snapshots').insert({
      source_registry_id: registryId,
      snapshot_key: `${hash.slice(0, 16)}-${Date.now()}`,
      source_url: urlResult.finalUrl,
      source_version: null,
      retrieved_at: new Date().toISOString(),
      media_type: urlResult.contentType || 'application/octet-stream',
      hash_scope: hashScope,
      content_sha256: hash,
      byte_size: urlResult.body.length,
      locator_manifest: {
        originalUrl: url,
        finalUrl: urlResult.finalUrl,
        statusCode: urlResult.statusCode,
        redirected: urlResult.redirected,
        doi: doi || null,
        pmid: pmid || null,
        hashScope,
        etag: urlResult.etag || null,
        lastModified: urlResult.lastModified || null,
      },
    })
    if (snapErr) console.error(`[snapshot] ${row.id}:`, snapErr.message)
  }

  await persistStatus(supabase, row, decided, dryRun)
  return decided
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()))
  return results
}

export async function runSourceCurrentness(options: RunOptions = {}): Promise<RunSummary> {
  const started = Date.now()
  const limit = options.limit ?? 50
  const dryRun = options.dryRun ?? false
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
  const priorityFirst = options.priorityFirst ?? true
  const supabase = options.supabase ?? getServiceSupabase()

  const summary: RunSummary = {
    ok: true,
    total: 0,
    current: 0,
    stale: 0,
    'review-required': 0,
    'source-degraded': 0,
    notModified: 0,
    archiveHits: 0,
  }

  if (!dryRun) {
    const acquired = await tryAcquireLock(supabase)
    if (!acquired) {
      summary.ok = true
      summary.skippedLock = true
      summary.error = 'Another currentness run holds the lock'
      summary.durationMs = Date.now() - started
      return summary
    }
  }

  const fetchLimit = priorityFirst ? Math.min(limit * 3, 300) : limit
  const { data: rows, error } = await supabase
    .from('clinical_evidence_records')
    .select(
      'id, slug, primary_source_url, primary_source_title, primary_source_publisher, primary_source_id, review_status, freshness_status, source_registry_id, source_currentness_checked_at'
    )
    .not('primary_source_url', 'is', null)
    .order('source_currentness_checked_at', { ascending: true, nullsFirst: true })
    .limit(fetchLimit)

  if (error) return { ...summary, ok: false, error: error.message, durationMs: Date.now() - started }
  if (!rows?.length) {
    summary.durationMs = Date.now() - started
    return summary
  }

  let work = rows as EvidenceRow[]
  if (priorityFirst) {
    work = [...work].sort((a, b) => {
      const pa = STATUS_PRIORITY[a.freshness_status] ?? 9
      const pb = STATUS_PRIORITY[b.freshness_status] ?? 9
      if (pa !== pb) return pa - pb
      const ta = a.source_currentness_checked_at ? new Date(a.source_currentness_checked_at).getTime() : 0
      const tb = b.source_currentness_checked_at ? new Date(b.source_currentness_checked_at).getTime() : 0
      return ta - tb
    })
  }
  work = work.slice(0, limit)
  summary.total = work.length

  const outcomes = await mapPool(work, concurrency, async (row) => {
    try {
      const result = await processRecord(supabase, row, dryRun)
      console.log(`${row.slug || row.id}: ${result.status} — ${result.reason.slice(0, 120)}`)
      await new Promise((r) => setTimeout(r, PER_RECORD_DELAY_MS))
      return result
    } catch (err: any) {
      console.error(`${row.slug || row.id}: ERROR ${err?.message || err}`)
      return { status: 'source-degraded' as FreshnessStatus, reason: String(err?.message || err) }
    }
  })

  for (const result of outcomes) {
    summary[result.status]++
    if (result.notModified) summary.notModified = (summary.notModified || 0) + 1
    if (result.archiveHit) summary.archiveHits = (summary.archiveHits || 0) + 1
  }

  summary.durationMs = Date.now() - started
  return summary
}
