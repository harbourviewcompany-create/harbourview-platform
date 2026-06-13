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
  return fetchAdminSupabaseJson<RegulatorySignalRecord[]>('/rest/v1/regulatory_signals.signals?review_status=in.(captured,triaged,needs_source_validation,in_review,approved_private,approved_public)&select=*&order=captured_at.desc&limit=100')
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
      signal_type: readField(formData, 'signal_type') || 'regulatory_change',
      review_status: 'captured',
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
      approved_by: reviewStatus === 'approved_public' ? userId : null,
      last_reviewed_at: new Date().toISOString(),
    }),
  })
  if (!updated.ok) return updated

  await adminRequest('/rest/v1/regulatory_signals.review_events', {
    method: 'POST',
    body: JSON.stringify({
      signal_id: id,
      reviewer_id: userId,
      action: reviewStatus === 'rejected' ? 'rejected' : reviewStatus === 'approved_public' ? 'approved_public' : 'updated',
      notes: reviewerNote,
    }),
  })

  return updated
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
  }

  return updated
}
