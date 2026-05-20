import 'server-only'

export const NETWORK_OBJECT_TYPES = ['country', 'category', 'listing', 'wanted_request', 'intelligence_brief'] as const
export type NetworkObjectType = (typeof NETWORK_OBJECT_TYPES)[number]

export const NETWORK_REVIEW_STATUSES = [
  'submitted',
  'under_review',
  'needs_clarification',
  'approved_public_summary',
  'rejected',
  'archived',
] as const
export type NetworkReviewStatus = (typeof NETWORK_REVIEW_STATUSES)[number]

export const NETWORK_CLAIM_RISKS = ['low', 'medium', 'high'] as const
export type NetworkClaimRisk = (typeof NETWORK_CLAIM_RISKS)[number]

export type NetworkReviewItemRow = {
  id: string
  object_type: NetworkObjectType
  source_ref: string | null
  title_internal: string
  title_public_draft: string | null
  country_code: string | null
  country_label: string | null
  category_label: string | null
  review_status: NetworkReviewStatus
  claim_risk: NetworkClaimRisk
  private_analyst_notes: string | null
  public_summary_draft: string | null
  suppressed_fields: string[]
  requires_legal_review: boolean
  requires_compliance_review: boolean
  created_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type NetworkPublicProjectionRow = {
  id: string
  review_item_id: string
  object_type: NetworkObjectType
  slug: string
  name: string
  public_summary: string
  country_label: string | null
  category_label: string | null
  published_state: 'published' | 'archived'
  published_at: string
  published_by: string | null
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
}
