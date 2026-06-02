import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { MARKETPLACE_PUBLICATION_STATUSES, MARKETPLACE_VERIFICATION_STATUSES, SELLER_AUTHORIZATION_STATUSES } from '@/lib/marketplace/statuses'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service configuration')
  return createClient(url, key, { auth: { persistSession: false } })
}

export type MarketplaceCandidateStatusPatch = {
  verification_status?: string
  publication_status?: string
  seller_authorization_status?: string
  monetization_path?: string
  operator_note?: string
}

export function validateMarketplaceCandidateStatusPatch(patch: MarketplaceCandidateStatusPatch) {
  const errors: string[] = []
  if (patch.verification_status && !(MARKETPLACE_VERIFICATION_STATUSES as readonly string[]).includes(patch.verification_status)) errors.push('invalid_verification_status')
  if (patch.publication_status && !(MARKETPLACE_PUBLICATION_STATUSES as readonly string[]).includes(patch.publication_status)) errors.push('invalid_publication_status')
  if (patch.seller_authorization_status && !(SELLER_AUTHORIZATION_STATUSES as readonly string[]).includes(patch.seller_authorization_status)) errors.push('invalid_seller_authorization_status')
  return errors
}

export async function updateMarketplaceCandidateStatus(id: string, patch: MarketplaceCandidateStatusPatch) {
  const errors = validateMarketplaceCandidateStatusPatch(patch)
  if (errors.length) return { ok: false, errors }

  const supabase = getServiceClient()
  const { error } = await supabase.from('marketplace_candidates').update({
    verification_status: patch.verification_status,
    publication_status: patch.publication_status,
    seller_authorization_status: patch.seller_authorization_status,
    monetization_path: patch.monetization_path,
  }).eq('id', id)

  if (error) return { ok: false, errors: [error.message] }
  return { ok: true, errors: [] }
}
