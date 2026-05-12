import { toPublicCountryDTO } from './dto'
import type { NetworkCountry, PublicNetworkCountryDTO } from './types'

export type NetworkAdminReviewStatus =
  | 'submitted'
  | 'under_review'
  | 'needs_clarification'
  | 'approved_public_summary'
  | 'rejected'

export type NetworkAdminReviewItem = {
  id: string
  objectType: 'country' | 'category' | 'listing' | 'wanted_request' | 'intelligence_brief'
  title: string
  countryLabel: string
  categoryLabel: string
  reviewStatus: NetworkAdminReviewStatus
  claimRisk: 'low' | 'medium' | 'high'
  publicPreview: PublicNetworkCountryDTO
  suppressedFieldLabels: string[]
  nextActionLabel: string
}

const canadaCountryFixture: NetworkCountry = {
  id: 'country-canada-foundation',
  slug: 'canada',
  name: 'Canada',
  publicSummary:
    'Foundation placeholder for country-aware Network review. This is static admin shell data and is not a live market-access record.',
  privateAnalystNotes:
    'Static placeholder note intentionally excluded from the public preview projection.',
}

const germanyCountryFixture: NetworkCountry = {
  id: 'country-germany-foundation',
  slug: 'germany',
  name: 'Germany',
  publicSummary:
    'Foundation placeholder for pathway-aware commercial review. This is static admin shell data and is not a live route claim.',
  privateAnalystNotes:
    'Static placeholder note intentionally excluded from the public preview projection.',
}

export const networkAdminReviewItems: NetworkAdminReviewItem[] = [
  {
    id: 'review-country-canada-foundation',
    objectType: 'country',
    title: 'Canada country pathway placeholder',
    countryLabel: 'Canada',
    categoryLabel: 'Country pathway',
    reviewStatus: 'under_review',
    claimRisk: 'medium',
    publicPreview: toPublicCountryDTO(canadaCountryFixture),
    suppressedFieldLabels: ['analyst notes', 'review context', 'routing context'],
    nextActionLabel: 'Review public country summary',
  },
  {
    id: 'review-country-germany-foundation',
    objectType: 'intelligence_brief',
    title: 'Germany intelligence placeholder',
    countryLabel: 'Germany',
    categoryLabel: 'Intelligence',
    reviewStatus: 'needs_clarification',
    claimRisk: 'high',
    publicPreview: toPublicCountryDTO(germanyCountryFixture),
    suppressedFieldLabels: ['analyst notes', 'evidence context', 'routing context'],
    nextActionLabel: 'Clarify public pathway language',
  },
]

export function summarizeNetworkAdminReview(items = networkAdminReviewItems) {
  return {
    total: items.length,
    highRisk: items.filter((item) => item.claimRisk === 'high').length,
    needsClarification: items.filter((item) => item.reviewStatus === 'needs_clarification').length,
  }
}
