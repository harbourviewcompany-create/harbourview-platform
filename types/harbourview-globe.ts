export type ReviewStatus = 'not_published' | 'preliminary' | 'reviewed'

export type CountryBrief = {
  slug: string
  name: string
  isoA3: string
  region: string
  marketPathwaySummary?: string
  opportunityCategories?: string[]
  reviewStatus: ReviewStatus
  confidence?: 'low' | 'medium' | 'high'
  lastReviewed?: string
  relatedMarketplaceCategories?: string[]
  hasRelatedListings?: boolean
}
