import 'server-only'
import { getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient'

// ── SOURCE_ENGINE review queue ───────────────────────────────────────────
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
// 2026-08-11: that fix was incomplete. Every RPC in this file was STILL
// 404ing (PGRST202) in production, because PostgREST's actual default
// schema (used when no Content-Profile header is sent) is `public`, not
// `api` -- confirmed directly by calling list_engine_review_queue with no
// header and getting "Searched for the function public.list_engine_review_
// queue ... no matches were found". The api-schema routing fix above was
// real and necessary, but this file never sent the header needed to
// actually reach it, so the whole engine queue page -- list, count,
// approve, reject, bulk-approve -- has been silently non-functional.
// Fixed by adding Content-Profile: api to every call. Also found &
// separately fixed at the database level: approve_engine_signal /
// reject_engine_signal / bulk_approve_engine_queue required a real
// auth.uid() via is_genetics_admin_or_reviewer(), which this file's
// service-role-only calling pattern can never provide -- see
// is_service_role_or_signal_analyst() in the schema.
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

// Narrower shape returned by get_signals_pending_analysis -- reviewed
// signals awaiting the analysis synthesis layer, not the pre-review queue.
export type SignalPendingAnalysis = {
  id: string
  date: string | null
  cat: string | null
  headline: string | null
  summary: string | null
  source: string | null
  country: string | null
  score: number | null
  verification: string | null
}

export type SignalAnalysis = {
  what_changed: string
  who_is_affected: string
  deadline: string | null
  recommended_action: string
  confidence_rationale: string
}

export type AnalyzeSignalResult = {
  ok: boolean
  error?: string
  analyzed?: number
  failed?: number
  results?: Array<{
    signal_id: string
    status: 'analyzed' | 'failed' | 'error' | 'dry_run'
    backend?: string
    analysis?: SignalAnalysis
    reason?: string
    error?: string
  }>
}

type AdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminDataError }

function requestFailed(message: string): AdminDataError {
  return { code: 'request_failed', message }
}

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<AdminResult<T>> {
  const client = getAdminDataClient()
  if (!client.ok) return client as AdminResult<T>

  const response = await fetch(`${client.data.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'api',
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

// ── Signal analysis (what changed / who's affected / recommended action) ──
// Separate from the review queue above: these are signals that have
// *already* cleared review (reviewed=true) but don't yet have the LLM-
// generated synthesis layer. Backed by api.get_signals_pending_analysis /
// api.request_signal_analysis, both gated by
// is_service_role_or_signal_analyst() (service_role OR a real
// admin/operator/analyst user -- not is_genetics_admin_or_reviewer(),
// which the queue functions above use and which can never pass for this
// file's service-role-only calling pattern).

export async function listSignalsPendingAnalysis(limit = 50) {
  return callRpc<SignalPendingAnalysis[]>('get_signals_pending_analysis', {
    p_limit: limit,
    p_signal_id: null,
  })
}

// Triggers analysis for one signal and waits for the real result (the RPC
// itself blocks server-side, polling for the async LLM call to finish, up
// to ~30s in the worst case where all LLM providers fail over in sequence
// -- typically 2-5s when the primary provider succeeds). Returns the
// analysis inline rather than requiring separate poll wiring on the client.
export async function analyzeEngineSignal(signalId: string) {
  return callRpc<AnalyzeSignalResult>('request_signal_analysis', { p_signal_id: signalId })
}

export type AnalyzedSignal = {
  id: string
  headline: string | null
  summary: string | null
  country: string | null
  score: number | null
  analysis: SignalAnalysis | null
  analysis_backend: string | null
  analysis_generated_at: string | null
}

export async function listRecentlyAnalyzedSignals(limit = 10) {
  return callRpc<AnalyzedSignal[]>('get_recently_analyzed_signals', { p_limit: limit })
}
