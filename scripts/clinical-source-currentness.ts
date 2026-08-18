/**
 * Clinical Evidence — automated source-metadata currentness job (Phase A)
 *
 * Validates primary sources for clinical evidence records WITHOUT clinical judgment:
 * - URL reachability (HTTP status, redirects, final URL)
 * - Content hash (SHA-256) vs last snapshot → detect change
 * - Optional DOI resolve via Crossref
 * - Optional PMID resolve via NCBI E-utilities
 *
 * Writes:
 * - clinical_evidence_snapshots (new row on change or first check)
 * - clinical_evidence_records.freshness_status / source_currentness_checked_at / freshness_reason
 *
 * Never promotes clinical-synthesis. Never invents claims.
 *
 * Usage:
 *   npx tsx scripts/clinical-source-currentness.ts
 *   npx tsx scripts/clinical-source-currentness.ts --limit=50 --dry-run
 *
 * Env:
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (required for writes)
 *   CROSSREF_MAILTO (optional, polite Crossref User-Agent)
 *   NCBI_API_KEY (optional)
 */

import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const USER_AGENT =
  process.env.CROSSREF_MAILTO
    ? `HarbourviewClinicalSourceCheck/1.0 (mailto:${process.env.CROSSREF_MAILTO})`
    : 'HarbourviewClinicalSourceCheck/1.0 (clinical evidence provenance; +https://harbourview.vercel.app)'

const FETCH_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 5
const MAX_BODY_BYTES = 2_000_000 // 2 MB cap for hashing

type FreshnessStatus = 'current' | 'stale' | 'review-required' | 'source-degraded'

interface EvidenceRow {
  id: string
  slug: string
  primary_source_url: string
  primary_source_title: string | null
  primary_source_publisher: string | null
  primary_source_id: string | null // may hold DOI or other id
  review_status: string
  freshness_status: FreshnessStatus
  source_registry_id: string | null
}

interface UrlCheckResult {
  ok: boolean
  statusCode: number | null
  finalUrl: string
  redirected: boolean
  body: Buffer | null
  error?: string
}

interface IdentifierCheck {
  kind: 'doi' | 'pmid' | 'none'
  valid: boolean | null
  metadataTitle?: string
  metadataPublisher?: string
  retracted?: boolean
  notes?: string
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2)
  let limit = 100
  let dryRun = false
  for (const a of args) {
    if (a.startsWith('--limit=')) limit = Math.max(1, parseInt(a.slice(8), 10) || 100)
    if (a === '--dry-run') dryRun = true
  }
  return { limit, dryRun }
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ---------------------------------------------------------------------------
// URL health + body fetch
// ---------------------------------------------------------------------------

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
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
          error: `HTTP ${res.status}`,
        }
      }

      const ab = await res.arrayBuffer()
      let body = Buffer.from(ab)
      if (body.length > MAX_BODY_BYTES) {
        body = body.subarray(0, MAX_BODY_BYTES)
      }

      return {
        ok: true,
        statusCode: res.status,
        finalUrl: current,
        redirected: redirects > 0,
        body,
      }
    }

    return {
      ok: false,
      statusCode: null,
      finalUrl: current,
      redirected: true,
      body: null,
      error: 'Too many redirects',
    }
  } catch (err: any) {
    return {
      ok: false,
      statusCode: null,
      finalUrl: current,
      redirected: redirects > 0,
      body: null,
      error: err?.name === 'AbortError' ? 'Timeout' : String(err?.message || err),
    }
  } finally {
    clearTimeout(timer)
  }
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

// ---------------------------------------------------------------------------
// DOI / PMID resolution (optional, best-effort)
// ---------------------------------------------------------------------------

function extractDoi(primarySourceId: string | null, url: string): string | null {
  const candidates = [primarySourceId, url].filter(Boolean) as string[]
  for (const c of candidates) {
    const m = c.match(/10\.\d{4,9}\/[^\s"'<>]+/i)
    if (m) return m[0].replace(/[.,;)]+$/, '')
  }
  return null
}

function extractPmid(primarySourceId: string | null, url: string): string | null {
  const candidates = [primarySourceId, url].filter(Boolean) as string[]
  for (const c of candidates) {
    const m =
      c.match(/(?:pubmed\.ncbi\.nlm\.nih\.gov\/|pmid[=:\s]?)(\d{5,9})/i) ||
      c.match(/^pmid[:\s]?(\d{5,9})$/i)
    if (m) return m[1]
  }
  return null
}

async function resolveDoi(doi: string): Promise<IdentifierCheck> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 404) {
      return { kind: 'doi', valid: false, notes: 'DOI not found in Crossref' }
    }
    if (!res.ok) {
      return { kind: 'doi', valid: null, notes: `Crossref HTTP ${res.status}` }
    }
    const data = (await res.json()) as any
    const msg = data?.message
    if (!msg) return { kind: 'doi', valid: null, notes: 'Empty Crossref message' }

    const title = Array.isArray(msg.title) ? msg.title[0] : msg.title
    const publisher = msg.publisher as string | undefined
    const updateTo = msg['update-to'] as Array<{ type?: string }> | undefined
    const retracted =
      Array.isArray(updateTo) &&
      updateTo.some((u) => /retract|withdraw|expression.of.concern/i.test(String(u.type || '')))

    return {
      kind: 'doi',
      valid: true,
      metadataTitle: title,
      metadataPublisher: publisher,
      retracted: Boolean(retracted),
      notes: retracted ? 'Crossref signals update/retraction-related status' : undefined,
    }
  } catch (err: any) {
    return { kind: 'doi', valid: null, notes: `Crossref error: ${err?.message || err}` }
  }
}

async function resolvePmid(pmid: string): Promise<IdentifierCheck> {
  try {
    const key = process.env.NCBI_API_KEY
    const params = new URLSearchParams({
      db: 'pubmed',
      id: pmid,
      retmode: 'json',
    })
    if (key) params.set('api_key', key)

    const res = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${params}`,
      {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
    )
    if (!res.ok) {
      return { kind: 'pmid', valid: null, notes: `NCBI HTTP ${res.status}` }
    }
    const data = (await res.json()) as any
    const result = data?.result?.[pmid]
    if (!result || result.error) {
      return { kind: 'pmid', valid: false, notes: result?.error || 'PMID not found' }
    }
    return {
      kind: 'pmid',
      valid: true,
      metadataTitle: result.title,
      metadataPublisher: result.fulljournalname || result.source,
    }
  } catch (err: any) {
    return { kind: 'pmid', valid: null, notes: `NCBI error: ${err?.message || err}` }
  }
}

// ---------------------------------------------------------------------------
// Core: process one record
// ---------------------------------------------------------------------------

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
  let idNotes: string[] = []

  if (doi) {
    const id = await resolveDoi(doi)
    if (id.valid === false) idNotes.push(`DOI invalid: ${id.notes}`)
    if (id.retracted) idNotes.push(`DOI retraction signal: ${id.notes || 'yes'}`)
    if (id.valid === true && id.notes) idNotes.push(id.notes)
  } else if (pmid) {
    const id = await resolvePmid(pmid)
    if (id.valid === false) idNotes.push(`PMID invalid: ${id.notes}`)
  }

  const urlResult = await checkUrl(url)
  if (!urlResult.ok || !urlResult.body) {
    const reason = [
      `URL unreachable: ${urlResult.error || 'unknown'}`,
      urlResult.statusCode != null ? `status=${urlResult.statusCode}` : null,
      ...idNotes,
    ]
      .filter(Boolean)
      .join('; ')
    return { status: 'source-degraded', reason }
  }

  const hash = sha256(urlResult.body)
  const snapshotKey = `${hash.slice(0, 16)}-${Date.now()}`
  const registryId = row.source_registry_id || row.slug || row.id

  const { data: latestSnap } = await supabase
    .from('clinical_evidence_snapshots')
    .select('id, content_sha256, retrieved_at')
    .eq('source_registry_id', registryId)
    .order('retrieved_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hashChanged = latestSnap?.content_sha256 && latestSnap.content_sha256 !== hash
  const firstCheck = !latestSnap

  let status: FreshnessStatus = 'current'
  let reason = 'URL OK; content hash unchanged'

  if (idNotes.some((n) => /retraction/i.test(n))) {
    status = 'review-required'
    reason = idNotes.join('; ')
  } else if (firstCheck) {
    status = 'current'
    reason = 'First currentness check; snapshot recorded'
  } else if (hashChanged) {
    status = 'stale'
    reason = 'Primary source content hash changed since last snapshot'
  }

  if (idNotes.length && status === 'current') {
    reason = `${reason}. ${idNotes.join('; ')}`
  }

  if (dryRun) {
    console.log(
      `[dry-run] ${row.slug || row.id} → ${status} | ${reason} | hash=${hash.slice(0, 12)}…`
    )
    return { status, reason }
  }

  if (firstCheck || hashChanged) {
    const { error: snapErr } = await supabase.from('clinical_evidence_snapshots').insert({
      source_registry_id: registryId,
      snapshot_key: snapshotKey,
      source_url: urlResult.finalUrl,
      source_version: null,
      retrieved_at: new Date().toISOString(),
      media_type: 'text/html',
      hash_scope: 'source-bytes',
      content_sha256: hash,
      byte_size: urlResult.body.length,
      locator_manifest: {
        originalUrl: url,
        finalUrl: urlResult.finalUrl,
        statusCode: urlResult.statusCode,
        redirected: urlResult.redirected,
        doi: doi || null,
        pmid: pmid || null,
      },
    })
    if (snapErr) {
      console.error(`[snapshot] ${row.id}:`, snapErr.message)
    }
  }

  const { error: updErr } = await supabase
    .from('clinical_evidence_records')
    .update({
      freshness_status: status,
      source_currentness_checked_at: new Date().toISOString(),
      freshness_reason: reason.slice(0, 2000),
    })
    .eq('id', row.id)

  if (updErr) {
    console.error(`[update] ${row.id}:`, updErr.message)
  }

  return { status, reason }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { limit, dryRun } = parseArgs()
  console.log(
    `[clinical-source-currentness] start limit=${limit} dryRun=${dryRun} ua=${USER_AGENT.slice(0, 60)}…`
  )

  const supabase = getSupabase()

  const { data: rows, error } = await supabase
    .from('clinical_evidence_records')
    .select(
      'id, slug, primary_source_url, primary_source_title, primary_source_publisher, primary_source_id, review_status, freshness_status, source_registry_id'
    )
    .not('primary_source_url', 'is', null)
    .order('source_currentness_checked_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    console.error('[fetch records]', error.message)
    process.exit(1)
  }

  if (!rows?.length) {
    console.log('[clinical-source-currentness] no records with primary_source_url')
    return
  }

  const summary = {
    total: rows.length,
    current: 0,
    stale: 0,
    'review-required': 0,
    'source-degraded': 0,
  }

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

  console.log('[clinical-source-currentness] done', summary)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
