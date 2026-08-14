import 'server-only'
import { forbidden, unauthorized } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export type ClinicalReviewAuth = {
  user: { id: string; email?: string }
  appRoles: string[]
  qualifiedCredentialIds: string[]
  canVerifyCredentials: boolean
  canPublish: boolean
}

const REVIEW_ROLES = new Set(['admin', 'operator', 'analyst'])

export async function requireClinicalReviewAuth(): Promise<ClinicalReviewAuth> {
  const session = await createSupabaseServerClient()
  const { data: { user }, error } = await session.auth.getUser()
  if (error || !user) unauthorized()

  const service = await createSupabaseServiceClient()
  const [{ data: roleRows, error: roleError }, { data: credentialRows, error: credentialError }] = await Promise.all([
    service.schema('public').from('user_roles').select('role').eq('user_id', user.id),
    service.schema('public').from('clinical_reviewer_credentials')
      .select('id,verification_status,valid_from,valid_until')
      .eq('user_id', user.id)
      .eq('verification_status', 'verified'),
  ])
  if (roleError) throw new Error(`clinical_review_role_lookup_failed:${roleError.message}`)
  if (credentialError && !credentialError.message.includes('clinical_reviewer_credentials')) {
    throw new Error(`clinical_review_credential_lookup_failed:${credentialError.message}`)
  }

  const appRoles = (roleRows ?? []).map(row => String(row.role))
  const today = new Date().toISOString().slice(0, 10)
  const qualifiedCredentialIds = (credentialRows ?? [])
    .filter(row => (!row.valid_from || row.valid_from <= today) && (!row.valid_until || row.valid_until >= today))
    .map(row => String(row.id))

  const hasReviewRole = appRoles.some(role => REVIEW_ROLES.has(role))
  if (!hasReviewRole && qualifiedCredentialIds.length === 0) forbidden()

  return {
    user: { id: user.id, email: user.email ?? undefined },
    appRoles,
    qualifiedCredentialIds,
    canVerifyCredentials: appRoles.some(role => role === 'admin' || role === 'operator'),
    canPublish: appRoles.some(role => role === 'admin' || role === 'operator'),
  }
}
