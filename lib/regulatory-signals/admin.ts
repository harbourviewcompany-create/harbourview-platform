import 'server-only'
import { fetchAdminSupabaseJson, getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient'
import { assertPublicationGate } from './safety'
import type { RegulatorySignalRecord, RegulatorySource, RegulatorySourceCheckRun, RegulatorySourceSnapshot } from './types'

type AdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminDataError }

function requestFailed(message: string): AdminDataError {
  return { code: 'request_failed', message }
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readBoolean(formData: FormData, key: string) {
  return readField(formData, key) === 'on'
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<AdminResult<T>> {
  const client = getAdminDataClient()
  if (!client.ok) return client as any

  const response = await fetch(`${client.data.url}${path}`, {
    ...init,
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  const text = await response.text()
  if (!response.ok) return { ok: false, error: requestFailed(`Supabase returned ${response.status}: ${text.slice(0, 240)}`) }
  return { ok: true, data: (text ? JSON.parse(text) : null) as T }
}

export async function listRegulatorySignals() {
  return fetchAdminSupabaseJson<RegulatorySignalRecord[]>('/rest/v1/regulatory_signals.signals?select=*&order=signal_date.desc')
}

export async function listRegulatoryReviewQueue() {
  return fetchAdminSupabaseJson<RegulatorySignalRecord[]>('/rest/v1/regulatory_signals.signals?review_status=in.(draft,in_review)&select=*&order=created_at.desc&limit=100')
}

export async function getRegulatorySignal(id: string) {
  const result = await fetchAdminSupabaseJson<RegulatorySignalRecord[]>(`/rest/v1/regulatory_signals.signals?id=eq.${encodeURIComponent(id)}&select=*`)
  if (!result.ok) return result
  return { ok: true as const, data: result.data[0] || null }
}

export async function listRegulatorySources() {
  return fetchAdminSupabaseJson<RegulatorySource[]>('/rest/v1/regulatory_signals.sources?select=*&order=last_checked_at.desc.nullslast,created_at.desc')
}

export async function listRegulatorySourceSnapshots(limit = 50) {
  return fetchAdminSupabaseJson<RegulatorySourceSnapshot[]>(`/rest/v1/regulatory_signals.source_snapshots?select=*&order=captured_at.desc&limit=${limit}`)
}

export async function listRegulatorySourceCheckRuns(limit = 50) {
  return fetchAdminSupabaseJson<RegulatorySourceCheckRun[]>(`/rest/v1/regulatory_signals.source_check_runs?select=*&order=checked_at.desc&limit=${limit}`)
}

export async function createRegulatorySource(formData: FormData, userId: string) {
  return adminRequest<RegulatorySource[]>('/rest/v1/regulatory_signals.sources?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      source_name: readField(formData, 'source_name'),
      source_type: readField(formData, 'source_type') || 'regulator',
      source_tier: readField(formData, 'source_tier') || 'tier_1_official',
      country_code: readField(formData, 'country_code') || null,
      country_name: readField(formData, 'country_name') || null,
      region: readField(formData, 'region') || null,
      jurisdiction: readField(formData, 'jurisdiction') || null,
      regulator_name: readField(formData, 'regulator_name') || null,
      base_url: readField(formData, 'base_url'),
      watch_url: readField(formData, 'watch_url') || null,
      rss_url: readField(formData, 'rss_url') || null,
      language_code: readField(formData, 'language_code') || null,
      access_method: readField(formData, 'access_method') || 'html',
      watch_frequency: readField(formData, 'watch_frequency') || 'daily',
      watcher_enabled: true,
      watch_status: 'manual_review',
      crawl_allowed: false,
      validation_notes: readField(formData, 'validation_notes') || null,
      internal_notes: readField(formData, 'internal_notes') || null,
      created_by: userId,
      updated_by: userId,
    }),
  })
}

export async function createRegulatorySignal(formData: FormData, userId: string) {
  return adminRequest<RegulatorySignalRecord[]>('/rest/v1/regulatory_signals.signals?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      slug: readField(formData, 'slug'),
      headline: readField(formData, 'headline'),
      signal_type: readField(formData, 'signal_type') || 'regulatory_guidance',
      review_status: 'draft',
      confidence: readField(formData, 'confidence') || 'medium',
      impact_level: readField(formData, 'impact_level') || 'moderate',
      country_code: readField(formData, 'country_code') || null,
      country_name: readField(formData, 'country_name') || null,
      region: readField(formData, 'region') || null,
      jurisdiction: readField(formData, 'jurisdiction') || null,
      regulator_name: readField(formData, 'regulator_name') || null,
      signal_date: readField(formData, 'signal_date'),
      source_tier: readField(formData, 'source_tier') || 'tier_1_official',
      source_type: readField(formData, 'source_type') || 'regulator',
      source_url: readField(formData, 'source_url'),
      canonical_source_url: readField(formData, 'canonical_source_url') || null,
      private_summary: readField(formData, 'private_summary'),
      public_summary: readField(formData, 'public_summary') || null,
      public_implication: readField(formData, 'public_implication') || null,
      public_safe: readBoolean(formData, 'public_safe'),
      publish_to_public: readBoolean(formData, 'publish_to_public'),
      created_by: userId,
      updated_by: userId,
    }),
  })
}

export async function linkRegulatoryEvidence(signalId: string, evidenceId: string) {
  return adminRequest('/rest/v1/regulatory_signals.signal_evidence_links', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ signal_id: signalId, evidence_id: evidenceId, relationship: 'supporting' }),
  })
}

export async function updateRegulatorySignalReview(formData: FormData, userId: string) {
  const id = readField(formData, 'signal_id')
  const reviewStatus = readField(formData, 'review_status') || 'in_review'
  const reviewerNote = readField(formData, 'reviewer_note') || null

  const updated = await adminRequest<RegulatorySignalRecord[]>(`/rest/v1/regulatory_signals.signals?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      review_status: reviewStatus,
      public_summary: readField(formData, 'public_summary') || null,
      public_implication: readField(formData, 'public_implication') || null,
      public_safe: readBoolean(formData, 'public_safe'),
      publish_to_public: readBoolean(formData, 'publish_to_public'),
      updated_by: userId,
      reviewed_by: userId,
      approved_by: reviewStatus === 'published' ? userId : null,
      last_reviewed_at: new Date().toISOString(),
    }),
  })
  if (!updated.ok) return updated

  await adminRequest('/rest/v1/regulatory_signals.review_events', {
    method: 'POST',
    body: JSON.stringify({
      signal_id: id,
      reviewer_id: userId,
      action: reviewStatus === 'rejected' ? 'rejected' : reviewStatus === 'published' ? 'published' : 'updated',
      notes: reviewerNote,
    }),
  })

  return updated
}

// ── Bridge: regulatory_signals.signals (published) → public.signals ──────────
// public.signals is what fetchDashboardSignals reads to populate country/role
// Intelligence pages (see dashboardServerData.ts). When a regulatory signal
// is published here, mirror it into public.signals with reviewed=true so it
// surfaces on the relevant country's dashboard. When un-published (rejected/
// archived after having been published), mark the mirrored row reviewed=false
// rather than deleting it, so the history stays intact.

const SIGNAL_TYPE_TO_LANE: Record<string, string> = {
  import_export_pathway:        'trade',
  trade_agreement:              'trade',
}

const IMPACT_TO_PRI: Record<string, string> = {
  critical: 'URGENT',
  high:     'HIGH',
  moderate: 'MEDIUM',
  low:      'LOW',
}

const IMPACT_TO_COMMERCIAL: Record<string, string> = {
  critical: 'high',
  high:     'high',
  moderate: 'medium',
  low:      'low',
}

const CONFIDENCE_TO_SCORE: Record<string, number> = {
  verified: 95,
  high:     85,
  medium:   65,
  low:      40,
}

function publicSignalId(regulatorySignalId: string) {
  return `rs-${regulatorySignalId}`
}

async function syncRegulatorySignalToPublicFeed(record: RegulatorySignalRecord, reviewed: boolean) {
  const r = record as unknown as Record<string, unknown>
  const signalType = String(r.signal_type ?? 'regulatory_guidance')
  const impact     = String(r.impact_level ?? 'moderate')
  const confidence = String(r.confidence ?? 'medium')

  await adminRequest('/rest/v1/signals?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id:                publicSignalId(record.id),
      date:              r.signal_date ?? new Date().toISOString(),
      cat:               signalType,
      top_lane:          SIGNAL_TYPE_TO_LANE[signalType] ?? 'regulatory',
      pri:               IMPACT_TO_PRI[impact] ?? 'MEDIUM',
      commercial_impact: IMPACT_TO_COMMERCIAL[impact] ?? 'medium',
      score:             CONFIDENCE_TO_SCORE[confidence] ?? 50,
      headline:          r.headline,
      summary:           r.public_summary ?? r.public_implication ?? null,
      source:            r.regulator_name ?? r.source_type ?? null,
      url:               r.canonical_source_url ?? null,
      tier:              r.source_tier ?? null,
      verification:      r.source_tier === 'tier_1_official' ? 'verified' : null,
      country:           r.country_name ?? null,
      reviewed,
    }),
  })
}

export async function transitionRegulatorySignalStatus(id: string, toStatus: string, userId: string, note: string) {
  const current = await getRegulatorySignal(id)
  if (!current.ok) return current
  if (!current.data) return { ok: false as const, error: requestFailed('Regulatory Signal not found.') }

  if (toStatus === 'published') assertPublicationGate(current.data as any)

  const updated = await adminRequest<RegulatorySignalRecord[]>(`/rest/v1/regulatory_signals.signals?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      review_status: toStatus,
      published_at: toStatus === 'published' ? new Date().toISOString() : (current.data as any).published_at,
      published_by: toStatus === 'published' ? userId : (current.data as any).published_by,
      updated_by: userId,
      last_reviewed_at: new Date().toISOString(),
    }),
  })
  if (!updated.ok) return updated

  await adminRequest('/rest/v1/regulatory_signals.review_events', {
    method: 'POST',
    body: JSON.stringify({ signal_id: id, reviewer_id: userId, action: toStatus === 'published' ? 'published' : 'updated', notes: note || null }),
  })

  if (toStatus === 'published') {
    await adminRequest('/rest/v1/regulatory_signals.publication_events', {
      method: 'POST',
      body: JSON.stringify({ signal_id: id, publisher_id: userId, published_at: new Date().toISOString(), publication_notes: note || null }),
    })
    const published = (updated.data as RegulatorySignalRecord[])[0]
    if (published) await syncRegulatorySignalToPublicFeed(published, true)
  } else if ((toStatus === 'rejected' || toStatus === 'archived') && (current.data as any).review_status === 'published') {
    // Was previously published and is now being withdrawn — hide from the
    // public feed without deleting the historical row.
    const withdrawn = (updated.data as RegulatorySignalRecord[])[0]
    if (withdrawn) await syncRegulatorySignalToPublicFeed(withdrawn, false)
  }

  return updated
}
