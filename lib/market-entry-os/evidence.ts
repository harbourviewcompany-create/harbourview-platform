import 'server-only'
import { createHash } from 'node:crypto'
import type { CorridorPlan } from '@/lib/intelligence/workflowEngine'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { EvidenceRef, EvidenceSnapshot, EvidenceStatus } from './types'

const DEFAULT_FRESHNESS_DAYS = 90

type ClaimRow = {
  claim_id: string
  claim_key: string
  jurisdiction_iso2: string
  claim_text: string
  product_class: string
  authority_name: string
  authority_url: string
  source_document_id: string | null
  source_effective_date: string | null
  retrieved_at: string | null
  verified_at: string | null
  expires_at: string | null
  evidence_status: string
  source_snapshot_sha256: string | null
  source_snapshot_uri: string | null
}

function normaliseDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function classifyClaim(claim: ClaimRow, now: Date, freshnessDays: number): EvidenceStatus {
  if (!claim.verified_at || !claim.expires_at) return 'unverified'
  if (Date.parse(claim.expires_at) <= now.getTime()) return 'stale'
  if (claim.evidence_status === 'rejected' || claim.evidence_status === 'superseded') return 'conflicted'
  if (!claim.authority_url || !claim.source_effective_date || !claim.retrieved_at || !claim.source_snapshot_sha256) return 'partial'
  const age = Math.max(0, Math.floor((now.getTime() - Date.parse(claim.verified_at)) / 86_400_000))
  return age > freshnessDays ? 'stale' : claim.evidence_status === 'verified' ? 'verified' : 'partial'
}

function fallbackEvidence(plan: CorridorPlan, now: Date, freshnessDays: number): EvidenceSnapshot {
  const references: EvidenceRef[] = [plan.origin, plan.destination].map((jurisdiction) => ({
    id: createHash('sha256').update(`missing-claim-ledger|${jurisdiction.iso2}`).digest('hex').slice(0, 24),
    jurisdictionIso2: jurisdiction.iso2,
    claim: `No claim-level regulatory evidence was loaded for ${jurisdiction.name}.`,
    status: 'unverified',
    sourceName: 'No authoritative claim record available',
    sourceUrl: null,
    effectiveAt: null,
    verifiedAt: null,
    expiresAt: null,
    retrievedAt: now.toISOString(),
    hash: null,
  }))
  return { snapshotId: createHash('sha256').update(JSON.stringify(references)).digest('hex'), generatedAt: now.toISOString(), freshnessDays, references, sourceCount: 0 }
}

export async function buildEvidenceSnapshot(
  plan: CorridorPlan,
  options: { now?: Date; freshnessDays?: number; productClass?: string } = {},
): Promise<EvidenceSnapshot> {
  const now = options.now ?? new Date()
  const freshnessDays = options.freshnessDays ?? DEFAULT_FRESHNESS_DAYS
  const productClass = options.productClass ?? 'any'

  try {
    const supabase = await createSupabaseServiceClient()
    const jurisdictions = [plan.origin.iso2, plan.destination.iso2]
    const { data, error } = await supabase
      .from('regulatory_market_access_claims')
      .select('claim_id,claim_key,jurisdiction_iso2,claim_text,product_class,authority_name,authority_url,source_document_id,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status,source_snapshot_sha256,source_snapshot_uri')
      .in('jurisdiction_iso2', jurisdictions)
      .in('product_class', ['any', productClass])
      .order('verified_at', { ascending: false })

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as ClaimRow[]
    const references: EvidenceRef[] = jurisdictions.map((iso2) => {
      const candidates = rows.filter((row) => row.jurisdiction_iso2 === iso2)
      const exact = candidates.find((row) => row.product_class === productClass && row.product_class !== 'any')
      const claim = exact ?? candidates[0]
      if (!claim) {
        return {
          id: createHash('sha256').update(`missing-claim-ledger|${iso2}`).digest('hex').slice(0, 24),
          jurisdictionIso2: iso2,
          claim: 'No claim-level regulatory evidence is available for this jurisdiction/product combination.',
          status: 'unverified',
          sourceName: 'No authoritative claim record available',
          sourceUrl: null,
          effectiveAt: null,
          verifiedAt: null,
          expiresAt: null,
          retrievedAt: now.toISOString(),
          hash: null,
        }
      }
      return {
        id: claim.claim_key,
        jurisdictionIso2: iso2,
        claim: claim.claim_text,
        status: classifyClaim(claim, now, freshnessDays),
        sourceName: claim.authority_name,
        sourceUrl: claim.authority_url || null,
        effectiveAt: normaliseDate(claim.source_effective_date),
        verifiedAt: normaliseDate(claim.verified_at),
        expiresAt: normaliseDate(claim.expires_at),
        retrievedAt: normaliseDate(claim.retrieved_at) ?? now.toISOString(),
        hash: claim.source_snapshot_sha256,
      }
    })

    const snapshotPayload = JSON.stringify(references.map(({ retrievedAt: _retrievedAt, ...ref }) => ref))
    return {
      snapshotId: createHash('sha256').update(snapshotPayload).digest('hex'),
      generatedAt: now.toISOString(),
      freshnessDays,
      references,
      sourceCount: references.filter((ref) => Boolean(ref.sourceUrl && ref.hash)).length,
    }
  } catch {
    return fallbackEvidence(plan, now, freshnessDays)
  }
}
