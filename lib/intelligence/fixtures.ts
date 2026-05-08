import rawCountryIntelligenceFixtures from './country-fixtures.json'
import { PublicCountryIntelligenceFixturesSchema } from './schema'

export const intelligenceFixtureSources = [
  'harbourview_unified_v4_compact_top.html',
  'harbourview_v8_clean_map.html',
  'harbourview_global_cannabis_guidebook_v2_2026.html',
  'Signals - Cannabis Policy South America.html'
] as const

export type MarketPathway = 'medical' | 'adultUse' | 'industrialHemp' | 'decriminalized' | 'prohibited' | 'unknown'
export type ReviewStatus = 'prototypeExtracted' | 'needsAnalystReview' | 'publicSafeSeed'

export type PublicCountryIntelligenceFixture = {
  slug: string
  country: string
  region: string
  statusLabel: string
  pathways: MarketPathway[]
  publicSummary: string
  opportunityCategories: string[]
  tradeRole: string[]
  regulatorLabel?: string
  coordinates?: { lat: number; lng: number }
  reviewStatus: ReviewStatus
  sourcePrototype: (typeof intelligenceFixtureSources)[number]
}

export const privateIntelligenceFieldQuarantine = [
  'accounts',
  'signals',
  'sourceName',
  'sourceUrl',
  'provenance',
  'sourceEvidence',
  'contactEmail',
  'pricing',
  'fees',
  'redFlags',
  'proofPack',
  'internalHarbourviewNotes',
  'internalReviewNotes',
  'analystNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt'
] as const

export const countryIntelligenceFixtures: PublicCountryIntelligenceFixture[] =
  PublicCountryIntelligenceFixturesSchema.parse(rawCountryIntelligenceFixtures) as PublicCountryIntelligenceFixture[]

export function projectPublicCountryIntelligence(
  fixture: PublicCountryIntelligenceFixture
): PublicCountryIntelligenceFixture {
  return {
    slug: fixture.slug,
    country: fixture.country,
    region: fixture.region,
    statusLabel: fixture.statusLabel,
    pathways: [...fixture.pathways],
    publicSummary: fixture.publicSummary,
    opportunityCategories: [...fixture.opportunityCategories],
    tradeRole: [...fixture.tradeRole],
    regulatorLabel: fixture.regulatorLabel,
    coordinates: fixture.coordinates ? { ...fixture.coordinates } : undefined,
    reviewStatus: fixture.reviewStatus,
    sourcePrototype: fixture.sourcePrototype
  }
}

export const publicCountryIntelligenceFixtures = countryIntelligenceFixtures.map(projectPublicCountryIntelligence)
