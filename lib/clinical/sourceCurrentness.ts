/**
 * Clinical Evidence — source-metadata currentness (Phase A+)
 *
 * Source-metadata only. Never publishes clinical-synthesis or invents claims.
 */

import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type FreshnessStatus = 'current' | 'stale' | 'review-required' | 'source-degraded'

export interface EvidenceRow {
  id: string
  slug: string
  primary_source_url: string
  primary_source_title: string | null
  primary_source_publisher: string | null
  primary_source_id: string | null
  review_status: string
  freshness_status: FreshnessStatus
  source_registry_id: string | null
}

export interface RunOptions {
  limit?: number
  dryRun?: boolean
  supabase?: SupabaseClient
}

export interface RunSummary {
  ok: boolean
  total: number
  current: number
  stale: number
  'review-required': number
  'source-degraded': number
  skippedLock?: boolean
  error?: string
}

const FETCH_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 5
const MAX_BODY_BYTES = 2_000_000
const LOCK_KEY = 'clinical_source_currentness'
const LOCK_TTL_MS = 15 * 60 * 1000

function userAgent(): string {
  return process.env.CROSSREF_MAILTO
    ? `HarbourviewClinicalSourceCheck/1.0 (mailto:${process.env.CROSSREF_MAILTO})`
    : 'HarbourviewClinicalSourceCheck/1.0 (clinical evidence provenance; +https://harbourview.vercel.app)'
}

export function getServiceSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function extractDoi(primarySourceId: string | null, url: string): string | null {
  const candidates = [primarySourceId, url].filter(Boolean) as string[]
  for (const c of candidates) {
    const m = c.match(/10\.\d{4,9}\/[^\s"'<>]+/i)
    if (m) return m[0].replace(/[.,;)]+$/, '')
  }
  return null
}

export function extractPmid(primarySourceId: string | null, url: string): string | null {
  const candidates = [primarySourceId, url].filter(Boolean) as string[]
  for (const c of candidates) {
    const m =
      c.match(/(?:pubmed\.ncbi\.nlm\.nih\.gov\/|pmid[=:\s]?)(\d{5,9})/i) ||
      c.match(/^pmid[:\s]?(\d{5,9})$/i)
    if (m) return m[1]
  }
  return null
}

/** Strip scripts/styles/comments and collapse whitespace for stable hashing. */
export function normalizeHtmlForHash(html: string): string {
  let s = html
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  const mainMatch = s.match(/<main[\s\S]*?<\/main>/i) || s.match(/<article[\s\S]*?<\/article>/i)
  if (mainMatch) s = mainMatch[0]
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/&[a-z]+;/gi, ' ')
  s = s.replace(/\s+/g, ' ').trim().toLowerCase()
  return s
}

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex')
}

export function titlesLikelyMatch(stored: string | null | undefined, remote: string | null | undefined): boolean {
  if (!stored || !remote) return true
  const norm = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const a = norm(stored)
  const b = norm(remote)
  if (!a || !b) return true
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  const ta = new Set(a.split(' ').filter((w) => w.length > 2))
  const tb = new Set(b.split(' ').filter((w) => w.length > 2))
  if (ta.size === 0 || tb.size === 0) return true
  let inter = 0
  for (const w of ta) if (tb.has(w)) inter++
  const union = ta.size + tb.size - inter
  return inter / union >= 0.45
}

export function decideFreshness(input: {
  urlOk: boolean
  urlError?: string
  firstCheck: boolean
  hashChanged: boolean
  retracted: boolean
  titleMismatch: boolean
  idNotes: string[]
}): { status: FreshnessStatus; reason: string } {
  if (!input.urlOk) {
    return {
      status: 'source-degraded',
      reason: [input.urlError || 'URL unreachable', ...input.idNotes].filter(Boolean).join('; '),
    }
  }
  if (input.retracted) {
    return {
      status: 'review-required',
      reason: input.idNotes.join('; ') || 'Retraction signal on primary identifier',
    }
  }
  if (input.titleMismatch) {
    return {
      status: 'review-required',
      reason: ['Stored title does not match identifier registry metadata', ...input.idNotes]
        .filter(Boolean)
        .join('; '),
    }
  }
  if (input.firstCheck) {
    return {
      status: 'current',
      reason: ['First currentness check; snapshot recorded', ...input.idNotes].filter(Boolean).join('. '),
    }
  }
  if (input.hashChanged) {
    return {
      status: 'stale',
      reason: ['Primary source content hash changed since last snapshot', ...input.idNotes]
        .filter(Boolean)
        .join('; '),
    }
  }
  return {
    status: 'current',
    reason: ['URL OK; content hash unchanged', ...input.idNotes].filter(Boolean).join('. '),
  }
}

interface UrlCheckResult {
  ok: boolean
  statusCode: number | null
  finalUrl: string
  redirected: boolean
  body: Buffer | null
  contentType: string | null
  error?: string
}

async function checkUrl(url: string): Promise<UrlCheckResult> {
  let current = url
  let redirects = 0
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    while (redirects <= MAX_REDIRECTS) {
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': userAgent(),
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7',
        },
      })
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) {
          return {
            ok: false,
            statusCode: res.status,
            finalUrl: current,
            redirected: redirects > 0,
            body: null,
            contentType: null,
            error: 'Redirect without Location',
          }
        }
        current = new URL(loc, current).toString()
        redirects++
        continue
      }
      if (res.status < 200 || res.status >= 400) {
        return {
          ok: false,
          statusCode: res.status,
          finalUrl: current,
          redirected: redirects > 0,
          body: null,
          contentType: res.headers.get('content-type'),
          error: `HTTP ${res.status}`,
        }
      }
      const ab = await res.arrayBuffer()
      let body = Buffer.from(ab)
      if (body.length > MAX_BODY_BYTES) body = body.subarray(0, MAX_BODY_BYTES)
      return {
        ok: true,
        statusCode: res.status,
        finalUrl: current,
        redirected: redirects > 0,
        body,
        contentType: res.headers.get('content-type'),
      }
    }
    return {
      ok: false,
      statusCode: null,
      finalUrl: current,
      redirected: true,
      body: null,
      contentType: null,
      error: 'Too many redirects',
    }
  } catch (err: any) {
    return {
      ok: false,
      statusCode: null,
      finalUrl: current,
      redirected: redirects > 0,
      body: null,
      contentType: null,
      error: err?.name === 'AbortError' ? 'Timeout' : String(err?.message || err),
    }
  } finally {
    clearTimeout(timer)
  }
}

async function resolveDoi(doi: string): Promise<{
  valid: boolean | null
  title?: string
  publisher?: string
  retracted?: boolean
  notes?: string
}> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { 'User-Agent': userAgent(), Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 404) return { valid: false, notes: 'DOI not found in Crossref' }
    if (!res.ok) return { valid: null, notes: `Crossref HTTP ${res.status}` }
    const data = (await res.json()) as any
    const msg = data?.message
    if (!msg) return { valid: null, notes: 'Empty Crossref message' }
    const title = Array.isArray(msg.title) ? msg.title[0] : msg.title
    const updateTo = msg['update-to'] as Array<{ type?: string }> | undefined
    const retracted =
      Array.isArray(updateTo) &&
      updateTo.some((u) => /retract|withdraw|expression.of.concern/i.test(String(u.type || '')))
    return {
      valid: true,
      title,
      publisher: msg.publisher,
      retracted: Boolean(retracted),
      notes: retracted ? 'Crossref signals update/retraction-related status' : undefined,
    }
  } catch (err: any) {
    return { valid: null, notes: `Crossref error: ${err?.message || err}` }
  }
}

async function resolvePmid(pmid: string): Promise<{
  valid: boolean | null
  title?: string
  publisher?: string
  notes?: string
}> {
  try {
    const params = new URLSearchParams({ db: 'pubmed', id: pmid, retmode: 'json' })
    if (process.env.NCBI_API_KEY) params.set('api_key', process.env.NCBI_API_KEY)
    const res = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${params}`,
      { headers: { 'User-Agent': userAgent() }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    )
    if (!res.ok) return { valid: null, notes: `NCBI HTTP ${res.status}` }
    const data = (await res.json()) as any
    const result = data?.result?.[pmid]
    if (!result || result.error) return { valid: false, notes: result?.error || 'PMID not found' }
    return {
      valid: true,
      title: result.title,
      publisher: result.fulljournalname || result.source,
    }
  } catch (err: any) {
    return { valid: null, notes: `NCBI error: ${err?.message || err}` }
  }
}

function contentHash(body: Buffer, contentType: string | null): { hash: string; hashScope: string } {
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('html') || ct.includes('xml') || ct.includes('text')) {
    const normalized = normalizeHtmlForHash(body.toString('utf8'))
    return { hash: sha256Hex(normalized), hashScope: 'normalized-text' }
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
    if (age < LOCK_TTL_MS && payload?.expiresAt && new Date(payload.expiresAt).getTime() > now) {
      return false
    }
  }

  const { error } = await supabase.from('clinical_evidence_change_events').insert({
    evidence_record_id: null,
    event_type: 'currentness_lock',
    payload: { lockKey: LOCK_KEY, expiresAt: expires, acquiredAt: new Date(now).toISOString() },
  })
  if (error) {
    console.warn('[currentness] lock insert skipped:', error.message)
    return true
  }
  return true
}

async function writeChangeEvent(
  supabase: SupabaseClient,
  evidenceRecordId: string,
  fromStatus: string,
  toStatus: string,
  reason: string,
  dryRun: boolean
) {
  if (dryRun || fromStatus === toStatus) return
  const { error } = await supabase.from('clinical_evidence_change_events').insert({
    evidence_record_id: evidenceRecordId,
    event_type: 'source_currentness_check',
    payload: {
      fromStatus,
      toStatus,
      reason: reason.slice(0, 1500),
      checkedAt: new Date().toISOString(),
    },
  })
  if (error) console.warn('[change_event]', evidenceRecordId, error.message)
}

async function processRecord(
  supabase: SupabaseClient,
  row: EvidenceRow,
  dryRun: boolean
): Promise<{ status: FreshnessStatus; reason: string }> {
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
    if (id.valid === true && id.notes) idNotes.push(id.notes)
  } else if (pmid) {
    const id = await resolvePmid(pmid)
    if (id.valid === false) idNotes.push(`PMID invalid: ${id.notes}`)
    if (id.title) remoteTitle = id.title
  }

  const titleMismatch = !titlesLikelyMatch(row.primary_source_title, remoteTitle)

  const urlResult = await checkUrl(url)
  if (!urlResult.ok || !urlResult.body) {
    return decideFreshness({
      urlOk: false,
      urlError: `URL unreachable: ${urlResult.error || 'unknown'}${{
        urlResult.statusCode != null ? ` status=${urlResult.statusCode}` : ''
      }}`,
      firstCheck: false,
      hashChanged: false,
      retracted,
      titleMismatch: false,
      idNotes,
    })
  }

  const { hash, hashScope } = contentHash(urlResult.body, urlResult.contentType)
  const snapshotKey = `${hash.slice(0, 16)}-${Date.now()}`
  const registryId = row.source_registry_id || row.slug || row.id

  const { data: latestSnap } = await supabase
    .from('clinical_evidence_snapshots')
    .select('id, content_sha256, retrieved_at')
    .eq('source_registry_id', registryId)
    .order('retrieved_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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
    console.log(
      `[dry-run] ${row.slug || row.id} → ${decided.status} | ${decided.reason} | hash=${hash.slice(0, 12)}… scope=${hashScope}`
    )
    return decided
  }

  if (firstCheck || hashChanged) {
    const { error: snapErr } = await supabase.from('clinical_evidence_snapshots').insert({
      source_registry_id: registryId,
      snapshot_key: snapshotKey,
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
      },
    })
    if (snapErr) console.error(`[snapshot] ${row.id}:`, snapErr.message)
  }

  await writeChangeEvent(supabase, row.id, row.freshness_status, decided.status, decided.reason, dryRun)

  const { error: updErr } = await supabase
    .from('clinical_evidence_records')
    .update({
      freshness_status: decided.status,
      source_currentness_checked_at: new Date().toISOString(),
      freshness_reason: decided.reason.slice(0, 2000),
    })
    .eq('id', row.id)

  if (updErr) console.error(`[update] ${row.id}:`, updErr.message)

  return decided
}

export async function runSourceCurrentness(options: RunOptions = {}): Promise<RunSummary> {
  const limit = options.limit ?? 50
  const dryRun = options.dryRun ?? false
  const supabase = options.supabase ?? getServiceSupabase()

  const summary: RunSummary = {
    ok: true,
    total: 0,
    current: 0,
    stale: 0,
    'review-required': 0,
    'source-degraded': 0,
  }

  if (!dryRun) {
    const acquired = await tryAcquireLock(supabase)
    if (!acquired) {
      summary.ok = true
      summary.skippedLock = true
      summary.error = 'Another currentness run holds the lock'
      return summary
    }
  }

  const { data: rows, error } = await supabase
    .from('clinical_evidence_records')
    .select(
      'id, slug, primary_source_url, primary_source_title, primary_source_publisher, primary_source_id, review_status, freshness_status, source_registry_id'
    )
    .not('primary_source_url', 'is', null)
    .order('source_currentness_checked_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    return { ...summary, ok: false, error: error.message }
  }

  if (!rows?.length) {
    return summary
  }

  summary.total = rows.length

  for (const row of rows as EvidenceRow[]) {
    try {
      const result = await processRecord(supabase, row, dryRun)
      summary[result.status]++
      console.log(`${row.slug || row.id}: ${result.status} — ${result.reason.slice(0, 120)}`)
      await new Promise((r) => setTimeout(r, 400))
    } catch (err: any) {
      summary['source-degraded']++
      console.error(`${row.slug || row.id}: ERROR ${err?.message || err}`)
    }
  }

  return summary
}
