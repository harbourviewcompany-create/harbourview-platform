import 'server-only'

import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export type DecisionIntelRouteRow = {
  signal_id: string
  event_id: string
  displayable: boolean
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

export function applyDecisionIntelRouteRows(
  signals: DashboardSignal[],
  rows: DecisionIntelRouteRow[],
  canonicalAvailable: boolean,
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
      }
    }

    // Before Stage-0 activation, or for an unowned legacy/IA row after activation,
    // preserve only compatibility paths the legacy dossier loader can resolve.
    if (signal.decisionIntelEventId) return signal
    if (!isDecisionIntelLegacyEligible(signal)) {
      return { ...signal, decisionIntelEventId: undefined }
    }

    return {
      ...signal,
      decisionIntelEventId: `event:${signal.id}`,
    }
  })
}

/**
 * Attach dossier routes using the canonical customer-display projection.
 *
 * - owned + displayable canonical route => canonical event id
 * - owned + suppressed canonical route => explicit empty sentinel, preventing older
 *   client surfaces from synthesizing event:<signal-id> and resurrecting a 404 route
 * - unowned first-slice-compatible row => legacy compatibility event:<signal-id>
 * - migration/RPC unavailable => preserve the pre-migration compatibility behavior
 *
 * The RPC is service-role-only and returns route identity + displayability, never raw
 * evidence or private analytical fields. Customer entitlement remains enforced by the
 * dossier page/RPC; this helper only prevents advertising links that cannot resolve.
 */
export async function attachDecisionIntelDashboardRoutes(signals: DashboardSignal[]): Promise<DashboardSignal[]> {
  if (signals.length === 0) return signals

  const inputs = candidateIds(signals)
  try {
    const svc = await createSupabaseServiceClient()
    const { data, error } = await svc
      .schema('api')
      .rpc('resolve_intel_dashboard_routes', { p_signal_ids: inputs })

    if (error) throw error
    return applyDecisionIntelRouteRows(
      signals,
      (Array.isArray(data) ? data : []) as DecisionIntelRouteRow[],
      true,
    )
  } catch {
    return applyDecisionIntelRouteRows(signals, [], false)
  }
}
