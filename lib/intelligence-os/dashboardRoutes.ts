import 'server-only'

import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { getIaSignalById } from '@/lib/intelligence-automation/db'
import { createClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export type DecisionIntelRouteRow = {
  signal_id: string
  event_id: string
  displayable: boolean
  recommendation_state?: 'act_now' | 'investigate' | 'monitor' | 'no_action' | null
}

export function isDecisionIntelLegacyEligible(signal: DashboardSignal): boolean {
  if (signal.contentType === 'editorial') return false
  if (signal.signalContentType === 'story' || signal.signalContentType === 'research') return false

  // Published Daily signal headlines already carry explicit dossier eligibility from
  // fetchDailyDigest. Editorial Daily rows never do. Do not infer it from the label.
  if (signal.sourceLabel === 'Harbourview Daily') return Boolean(signal.decisionIntelEventId)

  return Boolean(signal.id)
}

function candidateIds(signals: DashboardSignal[]): string[] {
  const ids = new Set<string>()
  for (const signal of signals) {
    if (!signal.id) continue
    ids.add(signal.id)
    if (!signal.id.startsWith('rs-')) ids.add(`rs-${signal.id}`)
  }
  return [...ids]
}

function clearDecisionIntelRoutes(signals: DashboardSignal[]): DashboardSignal[] {
  return signals.map(signal => ({
    ...signal,
    decisionIntelEventId: undefined,
    decisionRecommendationState: undefined,
  }))
}

function isMissingCompletionRpc(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''
  return code === 'PGRST202' || code === '42883'
}

export function applyDecisionIntelRouteRows(
  signals: DashboardSignal[],
  rows: DecisionIntelRouteRow[],
  compatibleLegacyIds: ReadonlySet<string> = new Set(),
  resolverInstalled = false,
): DashboardSignal[] {
  const ownership = new Map<string, DecisionIntelRouteRow>()
  for (const row of rows) ownership.set(row.signal_id, row)

  return signals.map(signal => {
    const direct = ownership.get(signal.id)
    const mirrored = signal.id.startsWith('rs-') ? undefined : ownership.get(`rs-${signal.id}`)
    const owned = direct ?? mirrored

    if (owned) {
      return {
        ...signal,
        // Empty string is an intentional suppression sentinel for older client code
        // that still uses nullish coalescing before legacy synthesis.
        decisionIntelEventId: owned.displayable ? owned.event_id : '',
        decisionRecommendationState: owned.displayable
          ? owned.recommendation_state ?? undefined
          : undefined,
      }
    }

    if (!isDecisionIntelLegacyEligible(signal)) {
      return {
        ...signal,
        decisionIntelEventId: undefined,
        decisionRecommendationState: undefined,
      }
    }

    // Once the canonical resolver is installed, an explicit/synthetic route is retained
    // only after the server has proved that a compatible legacy public/IA record exists.
    // This prevents published regulatory rows whose mirror write failed from advertising
    // a dossier that neither canonical nor legacy storage can resolve.
    if (resolverInstalled && !compatibleLegacyIds.has(signal.id)) {
      return {
        ...signal,
        decisionIntelEventId: undefined,
        decisionRecommendationState: undefined,
      }
    }

    return {
      ...signal,
      decisionIntelEventId: signal.decisionIntelEventId || `event:${signal.id}`,
    }
  })
}

async function findCompatibleLegacyIds(
  signals: DashboardSignal[],
  svc: Awaited<ReturnType<typeof createSupabaseServiceClient>>,
): Promise<Set<string>> {
  const eligible = signals.filter(isDecisionIntelLegacyEligible)
  const ids = [...new Set(eligible.map(signal => signal.id).filter(Boolean))]
  const compatible = new Set<string>()
  if (ids.length === 0) return compatible

  try {
    const candidates = [...new Set(ids.flatMap(id => id.startsWith('rs-') ? [id] : [id, `rs-${id}`]))]
    const { data, error } = await svc
      .schema('public')
      .from('signals')
      .select('id, reviewed, action, quality_label, content_type')
      .in('id', candidates)

    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{ id: string; reviewed?: boolean; action?: string | null; quality_label?: string | null; content_type?: string | null }>) {
        const displayable = row.reviewed === true
          && row.action !== 'rejected'
          && !['spam', 'boilerplate', 'nav', 'duplicate'].includes(row.quality_label ?? '')
          && !['story', 'research', 'noise'].includes(row.content_type ?? '')
        if (!displayable) continue
        compatible.add(row.id)
        if (row.id.startsWith('rs-')) compatible.add(row.id.slice(3))
      }
    }
  } catch {
    // Public compatibility lookup failure is fail-closed; IA is checked independently.
  }

  const unresolved = ids.filter(id => !compatible.has(id))
  const iaResults = await Promise.all(unresolved.map(async id => {
    try {
      const result = await getIaSignalById(id)
      return result.ok && result.data && result.data.stage !== 'archived' ? id : null
    } catch {
      return null
    }
  }))
  for (const id of iaResults) if (id) compatible.add(id)

  return compatible
}

/**
 * Attach dossier routes using the canonical customer-display projection.
 *
 * The privileged lookup is explicitly gated by the authenticated dashboard session.
 * The service-role RPC returns route identity + displayability + recommendation posture
 * only; it never returns raw evidence or private analytical fields. Unexpected lookup
 * failures fail closed; legacy synthesis is used only when the completion RPC is genuinely
 * not installed, or when a deployed resolver proves an unowned row has compatible legacy
 * storage.
 */
export async function attachDecisionIntelDashboardRoutes(signals: DashboardSignal[]): Promise<DashboardSignal[]> {
  if (signals.length === 0) return signals

  try {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user) return clearDecisionIntelRoutes(signals)
  } catch {
    return clearDecisionIntelRoutes(signals)
  }

  const inputs = candidateIds(signals)
  try {
    const svc = await createSupabaseServiceClient()
    const { data, error } = await svc
      .schema('api')
      .rpc('resolve_intel_dashboard_routes', { p_signal_ids: inputs })

    if (error) {
      return isMissingCompletionRpc(error)
        ? applyDecisionIntelRouteRows(signals, [], new Set(), false)
        : clearDecisionIntelRoutes(signals)
    }

    const rows = (Array.isArray(data) ? data : []) as DecisionIntelRouteRow[]
    const compatibleLegacyIds = await findCompatibleLegacyIds(signals, svc)
    return applyDecisionIntelRouteRows(signals, rows, compatibleLegacyIds, true)
  } catch {
    return clearDecisionIntelRoutes(signals)
  }
}
