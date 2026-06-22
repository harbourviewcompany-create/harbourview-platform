import 'server-only'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { grantAllowsEvidence } from './accessGrants'
import type { GeneticsAccessGrantRow, GeneticsEvidenceItemRow } from './types'

export const GENETICS_EVIDENCE_PRIVATE_BUCKET = 'genetics-evidence-private'
export const GENETICS_EVIDENCE_SIGNED_URL_TTL_SECONDS = 300

export async function createGeneticsEvidenceSignedUrl(input: {
  evidence: GeneticsEvidenceItemRow
  granteeProfileId: string
  grants: GeneticsAccessGrantRow[]
}) {
  if (!input.evidence.file_path || !input.evidence.file_is_private) {
    return { ok: false as const, reason: 'missing_private_object' }
  }

  const allowed = input.grants.some((grant) => grantAllowsEvidence(grant, input.evidence, input.granteeProfileId))
  if (!allowed) return { ok: false as const, reason: 'missing_explicit_grant' }

  const supabase = await createSupabaseServiceClient()
  const { data, error } = await supabase.storage
    .from(GENETICS_EVIDENCE_PRIVATE_BUCKET)
    .createSignedUrl(input.evidence.file_path, GENETICS_EVIDENCE_SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return { ok: false as const, reason: 'signed_url_failed' }
  return { ok: true as const, signedUrl: data.signedUrl, expiresInSeconds: GENETICS_EVIDENCE_SIGNED_URL_TTL_SECONDS }
}
