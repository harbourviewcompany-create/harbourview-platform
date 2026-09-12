import 'server-only'
import { createHash } from 'node:crypto'
import type { JurisdictionPlaybook } from '@/lib/intelligence/jurisdictionPlaybooks'
import type { EvidenceRef, EvidenceSnapshot, EvidenceStatus } from './types'

const DEFAULT_FRESHNESS_DAYS = 90

function isoDate(value: string | null | undefined): string | null {
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

function classifyEvidence(playbook: JurisdictionPlaybook, now: Date, freshnessDays: number): EvidenceStatus {
  const verified = isoDate(playbook.last_verified_at)
  if (!verified) return 'unverified'
  const age = ageDays(verified, now)
  if (age === null) return 'unverified'
  if (age > freshnessDays) return 'stale'
  // A playbook timestamp is provenance metadata, not primary-source proof.
  // Until source-level claims are attached, it remains partial rather than verified.
  return 'partial'
}

function evidenceId(jurisdictionIso2: string, status: EvidenceStatus, verifiedAt: string | null): string {
  return createHash('sha256')
    .update(`${jurisdictionIso2}|${status}|${verifiedAt ?? 'none'}`)
    .digest('hex')
    .slice(0, 24)
}

export function buildEvidenceSnapshot(
  origin: JurisdictionPlaybook,
  destination: JurisdictionPlaybook,
  options: { now?: Date; freshnessDays?: number } = {},
): EvidenceSnapshot {
  const now = options.now ?? new Date()
  const freshnessDays = options.freshnessDays ?? DEFAULT_FRESHNESS_DAYS
  const playbooks = [origin, destination]
  const references: EvidenceRef[] = playbooks.map((playbook) => {
    const verifiedAt = isoDate(playbook.last_verified_at)
    const status = classifyEvidence(playbook, now, freshnessDays)
    const sourceName = playbook.key_regulators.map((r) => r.name).filter(Boolean).join(', ')
    return {
      id: evidenceId(playbook.country_iso2, status, verifiedAt),
      jurisdictionIso2: playbook.country_iso2,
      claim: playbook.legal_framework_summary ?? 'No structured legal-framework claim is published.',
      status,
      sourceName: sourceName || 'No authoritative source attached',
      sourceUrl: null,
      effectiveAt: null,
      verifiedAt,
      expiresAt: verifiedAt
        ? new Date(Date.parse(verifiedAt) + freshnessDays * 86_400_000).toISOString()
        : null,
      retrievedAt: now.toISOString(),
      hash: null,
    }
  })

  const snapshotPayload = JSON.stringify(references.map(({ retrievedAt: _retrievedAt, ...ref }) => ref))
  const snapshotId = createHash('sha256').update(snapshotPayload).digest('hex')

  return {
    snapshotId,
    generatedAt: now.toISOString(),
    freshnessDays,
    references,
    sourceCount: references.filter((ref) => ref.sourceUrl).length,
  }
}
