'use server'

import { createClient } from '@/lib/supabase/server'
import { createGeneticsEvidenceSignedUrl } from '@/lib/genetics/storage'
import type { GeneticsAccessGrantRow, GeneticsEvidenceItemRow } from '@/lib/genetics/types'

/**
 * Server action backing EvidenceLinkButton.tsx. Re-fetches the grant and
 * evidence row server-side (never trusts client-supplied grant data) and
 * re-checks grantAllowsEvidence via createGeneticsEvidenceSignedUrl before
 * issuing a signed URL — the client only ever sends IDs.
 */
export async function requestEvidenceSignedUrl(evidenceItemId: string, grantId: string) {
  const supabase = await createClient()

  const { data: evidence, error: evidenceError } = await supabase
    .from('genetics_evidence_items')
    .select('*')
    .eq('id', evidenceItemId)
    .maybeSingle()
  if (evidenceError || !evidence) return { ok: false as const, reason: 'evidence_not_found' }

  const { data: grant, error: grantError } = await supabase
    .from('genetics_access_grants')
    .select('*')
    .eq('id', grantId)
    .maybeSingle()
  if (grantError || !grant) return { ok: false as const, reason: 'grant_not_found' }

  return createGeneticsEvidenceSignedUrl({
    evidence: evidence as GeneticsEvidenceItemRow,
    granteeProfileId: (grant as GeneticsAccessGrantRow).grantee_profile_id,
    grants: [grant as GeneticsAccessGrantRow],
  })
}
