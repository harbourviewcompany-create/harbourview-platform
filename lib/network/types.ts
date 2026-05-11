export type NetworkReviewStatus = 'draft' | 'submitted' | 'under_review' | 'approved_public_summary' | 'rejected'

export type NetworkCountry = {
  id: string
  slug: string
  name: string
  publicSummary: string
  privateAnalystNotes?: string
}

export type PublicNetworkCountryDTO = Pick<NetworkCountry, 'id' | 'slug' | 'name' | 'publicSummary'>
