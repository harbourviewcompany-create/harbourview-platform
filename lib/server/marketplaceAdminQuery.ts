import 'server-only'

export type MarketplaceAdminQueueItem = {
  id: string
  created_at: string
  category_key: string | null
  subcategory_key: string | null
  record_type: string | null
  listing_type_key: string | null
  title: string | null
  title_public_draft?: string | null
  seller_name_private?: string | null
  source_type?: string | null
  country?: string | null
  region?: string | null
  condition?: string | null
  verification_status?: string | null
  seller_authorization_status?: string | null
  publication_status?: string | null
  monetization_path?: string | null
  confidence_score?: number | null
  commercial_relevance_score?: number | null
  compliance_risk_score?: number | null
  review_due_at?: string | null
  expires_at?: string | null
}

export function getMarketplaceAdminQueueColumns() {
  return [
    'created_at',
    'category_key',
    'subcategory_key',
    'record_type',
    'listing_type_key',
    'title',
    'seller_name_private',
    'source_type',
    'verification_status',
    'seller_authorization_status',
    'publication_status',
    'monetization_path',
    'review_due_at',
    'expires_at',
  ]
}

export function summarizeQueue(items: MarketplaceAdminQueueItem[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const status = item.publication_status || 'not_publishable'
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})
}
