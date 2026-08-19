import 'server-only'
import { TRADE_CORRIDORS, type TradeCorridor } from './tradeCorridors'
import { getAllPlaybooks, type JurisdictionPlaybook } from './jurisdictionPlaybooks'

export type CorridorCoverageRow = {
  id: string
  from: string
  to: string
  label: string
  riskScore: number
  riskLabel: string
  originPlaybook: boolean
  destinationPlaybook: boolean
  /** Both sides published — execution plan can be derived */
  planReady: boolean
  originName: string | null
  destinationName: string | null
  originVerifiedAt: string | null
  destinationVerifiedAt: string | null
}

export type CorridorCoverageReport = {
  asOf: string
  trackedCorridorCount: number
  planReadyCount: number
  publishedPlaybookCount: number
  publishedIso2: string[]
  corridors: CorridorCoverageRow[]
  disclaimer: string
}

function indexPlaybooks(list: JurisdictionPlaybook[]): Map<string, JurisdictionPlaybook> {
  const m = new Map<string, JurisdictionPlaybook>()
  for (const p of list) m.set(p.country_iso2.toUpperCase(), p)
  return m
}

export function buildCorridorCoverageRows(
  corridors: TradeCorridor[],
  playbooks: JurisdictionPlaybook[],
): CorridorCoverageRow[] {
  const byIso = indexPlaybooks(playbooks)
  return corridors.map((c) => {
    const origin = byIso.get(c.from)
    const dest = byIso.get(c.to)
    return {
      id: c.id,
      from: c.from,
      to: c.to,
      label: c.label,
      riskScore: c.riskScore,
      riskLabel: c.riskLabel,
      originPlaybook: Boolean(origin),
      destinationPlaybook: Boolean(dest),
      planReady: Boolean(origin && dest),
      originName: origin?.country_name ?? null,
      destinationName: dest?.country_name ?? null,
      originVerifiedAt: origin?.last_verified_at ?? null,
      destinationVerifiedAt: dest?.last_verified_at ?? null,
    }
  })
}

export async function getCorridorCoverageReport(): Promise<CorridorCoverageReport> {
  const playbooks = await getAllPlaybooks()
  const corridors = buildCorridorCoverageRows(TRADE_CORRIDORS, playbooks)
  const planReadyCount = corridors.filter((c) => c.planReady).length
  const publishedIso2 = playbooks.map((p) => p.country_iso2.toUpperCase()).sort()

  return {
    asOf: new Date().toISOString().slice(0, 10),
    trackedCorridorCount: corridors.length,
    planReadyCount,
    publishedPlaybookCount: playbooks.length,
    publishedIso2,
    corridors,
    disclaimer:
      'Plan-ready means published jurisdiction playbooks exist for both ends. Orientation only — not a guarantee of commercial viability or current law.',
  }
}
