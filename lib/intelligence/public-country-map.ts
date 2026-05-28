import type { MarketPathway, PublicCountryIntelligenceFixture, ReviewStatus } from './fixtures'

export type PublicCountryMapRecord = {
  slug: string
  country: string
  region: string
  statusLabel: string
  pathways: MarketPathway[]
  publicSummary: string
  pathwaySummary: string
  opportunityCategories: string[]
  regulatorLabel?: string
  coordinates?: { lat: number; lng: number }
  reviewStatus: ReviewStatus
  reviewLabel: string
}

const reviewLabels: Record<ReviewStatus, string> = {
  prototypeExtracted: 'Repository extract - pending review',
  needsAnalystReview: 'Needs analyst review',
  publicSafeSeed: 'Public-safe seed',
}

const pathwayLabels: Record<MarketPathway, string> = {
  medical: 'medical access',
  adultUse: 'adult-use framework',
  industrialHemp: 'industrial hemp',
  decriminalized: 'decriminalized possession',
  prohibited: 'restricted or prohibited pathway',
  unknown: 'unverified pathway',
}

function toSentence(items: string[]) {
  if (items.length === 0) return 'No public pathway categories are published yet.'
  if (items.length === 1) return items[0]

  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function projectPublicCountryMapRecord(
  fixture: PublicCountryIntelligenceFixture,
): PublicCountryMapRecord {
  const pathwaySummary = `Reviewed public context covers ${toSentence(
    fixture.pathways.map((pathway) => pathwayLabels[pathway]),
  )}. Harbourview treats country-specific route viability as a controlled review item, not a public guarantee.`

  return {
    slug: fixture.slug,
    country: fixture.country,
    region: fixture.region,
    statusLabel: fixture.statusLabel,
    pathways: [...fixture.pathways],
    publicSummary: fixture.publicSummary,
    pathwaySummary,
    opportunityCategories: [...fixture.opportunityCategories],
    regulatorLabel: fixture.regulatorLabel,
    coordinates: fixture.coordinates ? { ...fixture.coordinates } : undefined,
    reviewStatus: fixture.reviewStatus,
    reviewLabel: reviewLabels[fixture.reviewStatus],
  }
}

export function projectPublicCountryMapRecords(
  fixtures: PublicCountryIntelligenceFixture[],
): PublicCountryMapRecord[] {
  return fixtures.map(projectPublicCountryMapRecord)
}
