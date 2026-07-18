import 'server-only'
import { getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient'

// ── SOURCE_ENGINE review queue ────────────────────────────────────────────
// public.signals rows with cat='SOURCE_ENGINE' are written directly by the
// automated capture -> extract -> score pipeline. Separate pathway from
// regulatory_signals.signals (the manually-curated table
// lib/regulatory-signals/admin.ts reviews) -- that table has never been
// populated. This module is the automated pipeline's own review mechanism.
//
// IMPORTANT: this project's PostgREST only exposes the `api` and
// `graphql_public` schemas -- `public` is NOT reachable via REST under any
// header combination (confirmed directly: "Only the following schemas are
// exposed: api, graphql_public"). The original version of this file made
// raw calls to /rest/v1/signals, which silently failed in production the
// whole time this queue existed. Fixed by routing everything through
// api-schema RPC functions (list_engine_review_queue, approve_engine_signal,
// etc) whose function BODIES reach public.signals via schema-qualified SQL,
// sidestepping the REST exposure restriction entirely.
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

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<AdminResult<T>> {
  const client = getAdminDataClient()
  if (!client.ok) return client as any

  const response = await fetch(`${client.data.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
  })

  const text = await response.text()
  if (!response.ok) return { ok: false, error: requestFailed(`Supabase RPC ${name} returned ${response.status}: ${text.slice(0, 240)}`) }
  return { ok: true, data: (text ? JSON.parse(text) : null) as T }
}

export type EngineQueueFilters = {
  country?: string
  minScore?: number
  limit?: number
}

export async function listEngineReviewQueue(filters: EngineQueueFilters = {}) {
  return callRpc<EngineSignal[]>('list_engine_review_queue', {
    p_country: filters.country ?? null,
    p_min_score: filters.minScore ?? 0,
    p_limit: filters.limit ?? 50,
  })
}

export async function countEngineReviewQueue(filters: EngineQueueFilters = {}) {
  return callRpc<number>('count_engine_review_queue', {
    p_country: filters.country ?? null,
    p_min_score: filters.minScore ?? 0,
  })
}

export async function listDistinctEngineCountries() {
  return callRpc<{ country: string }[]>('list_engine_review_countries', {})
}

export async function approveEngineSignal(id: string, userId: string) {
  return callRpc<boolean>('approve_engine_signal', { p_id: id, p_user_id: userId })
}

export async function rejectEngineSignal(id: string, userId: string) {
  return callRpc<boolean>('reject_engine_signal', { p_id: id, p_user_id: userId })
}

// Bulk-approve every signal currently matching the filter (e.g. "everything
// from Colombia scoring 60+") in one action, rather than one click per row.
export async function bulkApproveEngineQueue(filters: EngineQueueFilters, userId: string) {
  return callRpc<number>('bulk_approve_engine_queue', {
    p_country: filters.country ?? null,
    p_min_score: filters.minScore ?? 0,
    p_user_id: userId,
  })
}
