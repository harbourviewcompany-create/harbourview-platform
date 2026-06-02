import { getMarketplaceCategory, isMarketplaceCategoryKey } from './taxonomy'

export type MarketplaceVerificationInput = {
  category_key?: string | null
  title?: string | null
  source_url?: string | null
  source_type?: string | null
  seller_authorization_status?: string | null
  publication_status?: string | null
  public_summary_draft?: string | null
  seller_name_private?: string | null
}

export type MarketplaceVerificationResult = {
  ok: boolean
  issues: string[]
  nextStatus: 'marketplace_ready' | 'private_routing_only' | 'needs_manual_review'
}

export function evaluateMarketplaceCandidate(input: MarketplaceVerificationInput): MarketplaceVerificationResult {
  const issues: string[] = []

  if (!input.category_key || !isMarketplaceCategoryKey(input.category_key)) issues.push('invalid_category_key')
  const category = input.category_key ? getMarketplaceCategory(input.category_key) : undefined

  if (!input.title?.trim()) issues.push('missing_title')
  if (!input.public_summary_draft?.trim()) issues.push('missing_public_summary_draft')
  if (!input.source_url?.trim() && !['manual_submission', 'buyer_request'].includes(input.source_type ?? '')) issues.push('missing_source_url')
  if (!input.seller_name_private?.trim() && input.source_type !== 'buyer_request') issues.push('missing_private_seller_or_source_name')
  if (category?.requiresLicenseReview) issues.push('regulated_review_required')
  if (category?.restrictedByDefault) issues.push('restricted_by_default')

  const privateOnly = category?.publicVisibilityMode === 'private_gated' || category?.publicVisibilityMode === 'admin_only'
  if (privateOnly) return { ok: issues.length === 0, issues, nextStatus: 'private_routing_only' }

  return {
    ok: issues.length === 0,
    issues,
    nextStatus: issues.length === 0 ? 'marketplace_ready' : 'needs_manual_review',
  }
}
