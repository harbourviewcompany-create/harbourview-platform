import 'server-only'
import { createHash } from 'node:crypto'
import type { CorridorPlan } from '@/lib/intelligence/workflowEngine'
import type { EvidenceRef, EvidenceSnapshot, EvidenceStatus } from './types'

const DEFAULT_FRESHNESS_DAYS = 90

function normaliseDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function ageDays(value: string | null, now: Date): number | null {
  if (!value) return null
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return null
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 86_400_000))
}

function classify(verifiedAt: string | null, now: Date, freshnessDays: number): EvidenceStatus {
  if (!verifiedAt) return 'unverified'
  const age = ageDays(verifiedAt, now)
  if (age === null) return 'unverified'
  if (age > freshnessDays) return 'stale'
  // The current playbook contract supplies verification metadata but not a
  // primary-source claim ledger. That is provenance metadata, not proof.
  return 'partial'
}

export function buildEvidenceSnapshot(
  plan: CorridorPlan,
  options: { now?: Date; freshnessDays?: number } = {},
): EvidenceSnapshot {
  const now = options.now ?? new Date()
  const freshnessDays = options.freshnessDays ?? DEFAULT_FRESHNESS_DAYS
  const pairs = [
    {
      iso2: plan.origin.iso2,
      verifiedAt: normaliseDate(plan.trust.originVerifiedAt),
      claim: `Jurisdiction playbook available for ${plan.origin.name}.`,
      regulators: plan.regulators.find((r) => r.country_iso2 === plan.origin.iso2)?.regulators ?? [],
    },
    {
      iso2: plan.destination.iso2,
      verifiedAt: normaliseDate(plan.trust.destinationVerifiedAt),
      claim: `Jurisdiction playbook available for ${plan.destination.name}.`,
      regulators: plan.regulators.find((r) => r.country_iso2 === plan.destination.iso2)?.regulators ?? [],
    },
  ]

  const references: EvidenceRef[] = pairs.map((item) => {
    const status = classify(item.verifiedAt, now, freshnessDays)
    const sourceName = item.regulators.map((regulator) => regulator.name).filter(Boolean).join(', ')
    const id = createHash('sha256')
      .update(`${item.iso2}|${status}|${item.verifiedAt ?? 'none'}|${sourceName}`)
      .digest('hex')
      .slice(0, 24)
    return {
      id,
      jurisdictionIso2: item.iso2,
      claim: item.claim,
      status,
      sourceName: sourceName || 'No authoritative source attached',
      sourceUrl: null,
      effectiveAt: null,
      verifiedAt: item.verifiedAt,
      expiresAt: item.verifiedAt
        ? new Date(Date.parse(item.verifiedAt) + freshnessDays * 86_400_000).toISOString()
        : null,
      retrievedAt: now.toISOString(),
      hash: null,
    }
  })

  const snapshotPayload = JSON.stringify(references.map(({ retrievedAt: _retrievedAt, ...ref }) => ref))
  return {
    snapshotId: createHash('sha256').update(snapshotPayload).digest('hex'),
    generatedAt: now.toISOString(),
    freshnessDays,
    references,
    sourceCount: references.filter((ref) => Boolean(ref.sourceUrl)).length,
  }
}
