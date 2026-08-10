import 'server-only'

import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

type RouteRow = {
  signal_id: string
  event_id: string
  displayable: boolean
}

function legacyEligible(signal: DashboardSignal): boolean {
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

    const rows = (Array.isArray(data) ? data : []) as RouteRow[]
    const ownership = new Map<string, RouteRow>()
    for (const row of rows) ownership.set(row.signal_id, row)

    return signals.map(signal => {
      const direct = ownership.get(signal.id)
      const mirrored = signal.id.startsWith('rs-') ? undefined : ownership.get(`rs-${signal.id}`)
      const owned = direct ?? mirrored

      if (owned) {
        return {
          ...signal,
          decisionIntelEventId: owned.displayable ? owned.event_id : '',
        }
      }

      if (signal.decisionIntelEventId) return signal
      if (!legacyEligible(signal)) return { ...signal, decisionIntelEventId: undefined }
      return { ...signal, decisionIntelEventId: `event:${signal.id}` }
    })
  } catch {
    // Before Stage-0 activation there is no canonical route RPC. Preserve only the
    // compatibility paths the legacy dossier loader can actually resolve.
    return signals.map(signal => {
      if (signal.decisionIntelEventId) return signal
      return legacyEligible(signal)
        ? { ...signal, decisionIntelEventId: `event:${signal.id}` }
        : { ...signal, decisionIntelEventId: undefined }
    })
  }
}
