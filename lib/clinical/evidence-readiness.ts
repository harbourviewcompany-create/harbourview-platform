/**
 * Phase D — Evidence Readiness Checker helpers.
 * Operator / commercial tools only. Does not generate clinical advice.
 */

import type { EvidenceClaimMapEntry, FrameworkAlignment } from '@/lib/clinical/types'
import {
  gapsFromClaimMap,
  sortGapsForTriage,
  summariseGaps,
  type GapItem,
} from '@/lib/clinical/framework-gap'

export type EvidenceReadinessFlag = {
  id: string
  severity: 'info' | 'attention' | 'critical'
  title: string
  detail: string
}

export type EvidenceReadinessSummary = {
  claimCount: number
  completeClaims: number
  partialClaims: number
  gapClaims: number
  highPriorityGaps: number
  totalGaps: number
  flags: EvidenceReadinessFlag[]
  topGaps: GapItem[]
}

export function assessClaimMapReadiness(
  claims: EvidenceClaimMapEntry[],
): EvidenceReadinessSummary {
  const gaps = sortGapsForTriage(gapsFromClaimMap(claims))
  const summary = summariseGaps(gaps)

  let completeClaims = 0
  let partialClaims = 0
  let gapClaims = 0
  for (const c of claims) {
    if (c.status === 'complete') completeClaims += 1
    else if (c.status === 'partial') partialClaims += 1
    else gapClaims += 1
  }

  const flags: EvidenceReadinessFlag[] = []

  if (claims.length === 0) {
    flags.push({
      id: 'no-claims',
      severity: 'attention',
      title: 'No claim map entries',
      detail:
        'Commercial evidence dossiers are not yet mapped. Use admin Claim Map to start living claims.',
    })
  }

  if (gapClaims > 0) {
    flags.push({
      id: 'gap-claims',
      severity: 'critical',
      title: `${gapClaims} claim${gapClaims === 1 ? '' : 's'} in gap status`,
      detail:
        'High-visibility claims still missing coverage on one or more framework dimensions.',
    })
  }

  if (summary.highPriority > 0) {
    flags.push({
      id: 'high-pri-gaps',
      severity: 'attention',
      title: `${summary.highPriority} high-priority dimension gap${summary.highPriority === 1 ? '' : 's'}`,
      detail: 'Triage high commercialPriority gaps first in the Claim Map dashboard.',
    })
  }

  if (partialClaims > 0 && gapClaims === 0) {
    flags.push({
      id: 'partial-ok',
      severity: 'info',
      title: `${partialClaims} partial claim${partialClaims === 1 ? '' : 's'}`,
      detail: 'Partial mapping is expected during dossier build-out; track target dates.',
    })
  }

  if (completeClaims === claims.length && claims.length > 0) {
    flags.push({
      id: 'all-complete',
      severity: 'info',
      title: 'All mapped claims complete',
      detail: 'Claim map status is complete for current fixtures; continue monitoring for supersession.',
    })
  }

  return {
    claimCount: claims.length,
    completeClaims,
    partialClaims,
    gapClaims,
    highPriorityGaps: summary.highPriority,
    totalGaps: summary.totalGaps,
    flags,
    topGaps: gaps.slice(0, 8),
  }
}

/** Corridor-plan orientation flags from claim map (medical cannabis product classes). */
export function corridorEvidenceFlags(
  claims: EvidenceClaimMapEntry[],
  productClass?: string,
): EvidenceReadinessFlag[] {
  const readiness = assessClaimMapReadiness(claims)
  const flags = [...readiness.flags]

  const product = (productClass ?? 'any').toLowerCase()
  const relevant = claims.filter((c) => {
    if (product === 'any' || product === '') return true
    const blob = `${c.claimStatement} ${c.claimKind}`.toLowerCase()
    if (product.includes('pharma') || product.includes('cbd')) return blob.includes('cbd') || blob.includes('dravet') || blob.includes('lennox')
    if (product.includes('nabix') || product.includes('thc')) return blob.includes('thc') || blob.includes('spasticity') || blob.includes('neuropathic')
    return true
  })

  if (relevant.some((c) => c.status === 'gap')) {
    flags.push({
      id: 'corridor-product-gap',
      severity: 'attention',
      title: 'Evidence gaps for selected product class',
      detail:
        'One or more living claims relevant to this product class remain in gap status. Orientation only — not a clinical bar.',
    })
  }

  return flags
}

export function alignmentQuickScore(alignment: FrameworkAlignment | undefined): {
  score: number
  label: string
} {
  if (!alignment) return { score: 0, label: 'unmapped' }
  let covered = 0
  let total = 0
  if (alignment.imdrfPillars) {
    for (const p of Object.values(alignment.imdrfPillars)) {
      total += 1
      if (p.status === 'covered') covered += 1
    }
  }
  for (const d of alignment.dtaDomains ?? []) {
    total += 1
    if (d.status === 'covered') covered += 1
  }
  if (total === 0) return { score: 0, label: 'unmapped' }
  const score = Math.round((covered / total) * 100)
  if (score >= 80) return { score, label: 'strong' }
  if (score >= 50) return { score, label: 'partial' }
  return { score, label: 'weak' }
}
