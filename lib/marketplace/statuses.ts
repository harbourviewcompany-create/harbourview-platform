export const MARKETPLACE_VERIFICATION_STATUSES = [
  'unverified',
  'source_verified',
  'seller_identified',
  'seller_contact_required',
  'seller_authorized',
  'commercial_fit_verified',
  'availability_unknown',
  'availability_confirmed',
  'price_unknown',
  'price_signal_available',
  'documentation_required',
  'compliance_review_required',
  'public_summary_ready',
  'marketplace_ready',
  'private_routing_only',
  'rejected',
  'stale',
  'expired',
] as const

export const MARKETPLACE_PUBLICATION_STATUSES = [
  'not_publishable',
  'draft_public_summary',
  'needs_public_safety_review',
  'approved_public_summary',
  'published',
  'private_only',
  'rejected',
  'archived',
] as const

export const SELLER_AUTHORIZATION_STATUSES = [
  'unknown',
  'not_contacted',
  'contacted',
  'seller_confirmed',
  'broker_authorized',
  'authorization_documented',
  'authorization_rejected',
  'not_required_source_only',
] as const

export const MARKETPLACE_MONETIZATION_PATHS = [
  'seller_commission',
  'buyer_sourcing_mandate',
  'referral_fee',
  'success_fee',
  'quote_routing',
  'supplier_directory_onboarding',
  'auction_screening',
  'distressed_asset_mandate',
  'service_provider_referral',
  'education_to_introduction',
  'manual_review',
] as const

export type MarketplaceVerificationStatus = (typeof MARKETPLACE_VERIFICATION_STATUSES)[number]
export type MarketplacePublicationStatus = (typeof MARKETPLACE_PUBLICATION_STATUSES)[number]
export type SellerAuthorizationStatus = (typeof SELLER_AUTHORIZATION_STATUSES)[number]

export function isMarketplaceVerificationStatus(value: string): value is MarketplaceVerificationStatus {
  return (MARKETPLACE_VERIFICATION_STATUSES as readonly string[]).includes(value)
}

export function isMarketplacePublicationStatus(value: string): value is MarketplacePublicationStatus {
  return (MARKETPLACE_PUBLICATION_STATUSES as readonly string[]).includes(value)
}
