import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EvidenceClaimMapEntry } from '@/lib/clinical/types'

export const dynamic = 'force-dynamic'

type ClaimMapRow = {
  id: string
  claim_statement: string
  condition_label: string | null
  cannabinoid_focus: string[] | null
  evidence_record_ids: string[] | null
  target_stage_gates: string[] | null
  target_imdrf_pillars: string[] | null
  target_dta_domains: string[] | null
  status: EvidenceClaimMapEntry['status']
  gap_summary: string | null
  updated_at: string
}

function mapRow(r: ClaimMapRow): EvidenceClaimMapEntry {
  return {
    id: r.id,
    claimStatement: r.claim_statement,
    condition: r.condition_label ?? '',
    cannabinoidFocus: r.cannabinoid_focus ?? [],
    evidenceRecordIds: r.evidence_record_ids ?? [],
    targetStageGates: (r.target_stage_gates ?? []) as EvidenceClaimMapEntry['targetStageGates'],
    targetImdrfPillars: (r.target_imdrf_pillars ?? undefined) as EvidenceClaimMapEntry['targetImdrfPillars'],
    targetDtaDomains: (r.target_dta_domains ?? undefined) as EvidenceClaimMapEntry['targetDtaDomains'],
    status: r.status,
    gapSummary: r.gap_summary ?? undefined,
    updatedAt: r.updated_at,
  }
}

/**
 * Real data as of 2026-08-22. Previously CorridorEvidenceFlagsPanel and
 * CorridorPlanWorkspace imported CLAIM_MAP_FIXTURES directly with no live
 * path at all. clinical_evidence_claim_map is small (single digits of rows
 * right now) and RLS-open to any authenticated user, so this is a plain
 * server-side read, no service-role client needed.
 */
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_evidence_claim_map')
    .select(
      'id,claim_statement,condition_label,cannabinoid_focus,evidence_record_ids,target_stage_gates,target_imdrf_pillars,target_dta_domains,status,gap_summary,updated_at'
    )
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Unable to load claim map', entries: [] as EvidenceClaimMapEntry[] },
      { status: 500, headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } }
    )
  }

  const entries = (data as unknown as ClaimMapRow[]).map(mapRow)

  return NextResponse.json(
    { entries },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } }
  )
}
