import 'server-only'
import { fetchAdminSupabaseJson, getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient'

// ── SOURCE_ENGINE review queue ────────────────────────────────────────────
// public.signals rows with cat='SOURCE_ENGINE' are written directly by the
// automated capture -> extract -> score pipeline (source_registry ->
// source_snapshots -> hv_extract_signals_from_captured_text -> scoring).
// This is a *separate* pathway from regulatory_signals.signals (the
// manually-curated table lib/regulatory-signals/admin.ts reviews) -- that
// table has never been populated. This module is the automated pipeline's
// own review mechanism: nothing else in the app can set reviewed=true on
// these rows.
//
// signals.action stores the review decision as plain text: 'approved',
// 'rejected', or null (not yet looked at). reviewed=true is the flag
// signals_quality / fetchDashboardSignals actually reads; action is what
// keeps a rejected item from resurfacing in the queue.

export type EngineSignal = {
  id: string
  date: string | null
  cat: string | null
  pri: string | null
  score: number | null
  headline: string | null
  summary: string | null
  source: string | null
  url: string | null
  verification: string | null
  tier: string | null
  lang: string | null
  country: string | null
  reviewed: boolean | null
  action: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string | null
}

type AdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminDataError }

function requestFailed(message: string): AdminDataError {
  return { code: 'request_failed', message }
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

export type EngineQueueFilters = {
  country?: string
  minScore?: number
  limit?: number
}

export async function listEngineReviewQueue(filters: EngineQueueFilters = {}) {
  const limit = filters.limit ?? 50
  const minScore = filters.minScore ?? 0
  const params = new URLSearchParams({
    cat: 'eq.SOURCE_ENGINE',
    reviewed: 'not.is.true',
    or: '(action.is.null,action.not.eq.rejected)',
    score: `gte.${minScore}`,
    select: 'id,date,cat,pri,score,headline,summary,source,url,verification,tier,lang,country,reviewed,action,reviewed_by,reviewed_at,created_at',
    order: 'score.desc,date.desc',
    limit: String(limit),
  })
  if (filters.country) params.set('country', `eq.${filters.country}`)

  return fetchAdminSupabaseJson<EngineSignal[]>(`/rest/v1/signals?${params.toString()}`)
}

export async function countEngineReviewQueue(filters: EngineQueueFilters = {}) {
  const minScore = filters.minScore ?? 0
  const params = new URLSearchParams({
    cat: 'eq.SOURCE_ENGINE',
    reviewed: 'not.is.true',
    or: '(action.is.null,action.not.eq.rejected)',
    score: `gte.${minScore}`,
    select: 'id',
  })
  if (filters.country) params.set('country', `eq.${filters.country}`)

  const client = getAdminDataClient()
  if (!client.ok) return { ok: false as const, error: client.error }

  const response = await fetch(`${client.data.url}/rest/v1/signals?${params.toString()}`, {
    method: 'HEAD',
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      Prefer: 'count=exact',
    },
    cache: 'no-store',
  })
  const range = response.headers.get('content-range')
  const total = range && range.includes('/') ? Number(range.split('/')[1]) : null
  return { ok: true as const, data: total }
}

export async function listDistinctEngineCountries() {
  return fetchAdminSupabaseJson<{ country: string }[]>(
    `/rest/v1/signals?cat=eq.SOURCE_ENGINE&reviewed=not.is.true&or=(action.is.null,action.not.eq.rejected)&select=country&order=country.asc`
  )
}

export async function approveEngineSignal(id: string, userId: string) {
  return adminRequest<EngineSignal[]>(`/rest/v1/signals?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      reviewed: true,
      action: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    }),
  })
}

export async function rejectEngineSignal(id: string, userId: string) {
  return adminRequest<EngineSignal[]>(`/rest/v1/signals?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      reviewed: false,
      action: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    }),
  })
}

// Bulk-approve every signal currently matching the filter (e.g. "everything
// from Colombia scoring 60+") in one action, rather than one click per row.
export async function bulkApproveEngineQueue(filters: EngineQueueFilters, userId: string) {
  const minScore = filters.minScore ?? 0
  const params = new URLSearchParams({
    cat: 'eq.SOURCE_ENGINE',
    reviewed: 'not.is.true',
    or: '(action.is.null,action.not.eq.rejected)',
    score: `gte.${minScore}`,
  })
  if (filters.country) params.set('country', `eq.${filters.country}`)

  return adminRequest(`/rest/v1/signals?${params.toString()}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      reviewed: true,
      action: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    }),
  })
}
