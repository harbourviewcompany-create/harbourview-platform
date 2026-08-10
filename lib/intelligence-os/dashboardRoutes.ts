import 'server-only'

import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { createClient, createSupabaseServiceClient } from '@/lib/supabase/server'

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

    // For an unowned legacy/IA row, preserve only compatibility paths the legacy
    // dossier loader can actually resolve.
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
 * The privileged lookup is explicitly gated by the authenticated dashboard session.
 * The service-role RPC returns route identity + displayability only; it never returns
 * raw evidence or private analytical fields.
 */
export async function attachDecisionIntelDashboardRoutes(signals: DashboardSignal[]): Promise<DashboardSignal[]> {
  if (signals.length === 0) return signals

  try {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user) return signals.map(signal => ({ ...signal, decisionIntelEventId: undefined }))
  } catch {
    return signals.map(signal => ({ ...signal, decisionIntelEventId: undefined }))
  }

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
    )
  } catch {
    // Pre-migration/preview compatibility: retain only legacy routes known to be
    // resolvable by the existing dossier loader.
    return applyDecisionIntelRouteRows(signals, [])
  }
}
