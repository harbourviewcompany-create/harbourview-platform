/**
 * KYB gate before deal-room reveal.
 *
 * A party is considered KYB-ready when their workspace has at least one
 * hv_evidence_documents row with verification_status in
 * ('verified', 'admin_verified', 'approved').
 *
 * Admins may pass kyb_override + kyb_override_reason on the promote API.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type KybGateParty = {
  userId: string | null | undefined
  role: 'listing_owner' | 'buyer'
}

export type KybGateResult =
  | { ok: true; checked: number; verified: number }
  | {
      ok: false
      code: 'kyb_required'
      message: string
      missing: Array<{ role: string; userId: string }>
    }

const VERIFIED_STATUSES = new Set(['verified', 'admin_verified', 'approved', 'source_verified'])

async function userHasVerifiedEvidence(
  db: SupabaseClient<any, any, any, any, any>,
  userId: string,
): Promise<boolean> {
  const { data: membership } = await db
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (!membership?.workspace_id) return false

  const { data: docs, error } = await db
    .from('hv_evidence_documents')
    .select('id, verification_status')
    .eq('org_id', membership.workspace_id)
    .limit(25)

  if (error) return false
  return (docs ?? []).some((d: { verification_status?: string }) =>
    VERIFIED_STATUSES.has(String(d.verification_status ?? '').toLowerCase()),
  )
}

export async function assertPartiesKybVerified(
  db: SupabaseClient<any, any, any, any, any>,
  parties: KybGateParty[],
): Promise<KybGateResult> {
  const withIds = parties.filter((p): p is KybGateParty & { userId: string } => Boolean(p.userId))
  if (withIds.length === 0) {
    return { ok: true, checked: 0, verified: 0 }
  }

  const missing: Array<{ role: string; userId: string }> = []
  let verified = 0

  for (const party of withIds) {
    const ok = await userHasVerifiedEvidence(db, party.userId)
    if (ok) verified += 1
    else missing.push({ role: party.role, userId: party.userId })
  }

  if (missing.length > 0) {
    return {
      ok: false,
      code: 'kyb_required',
      message:
        'Deal room requires verified KYB evidence for all parties. Complete organization verification or pass kyb_override with a reason.',
      missing,
    }
  }

  return { ok: true, checked: withIds.length, verified }
}
