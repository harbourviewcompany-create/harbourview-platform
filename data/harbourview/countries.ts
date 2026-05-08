import { CountryBrief } from '@/types/harbourview-globe'

export const countries: CountryBrief[] = [
  {
    slug: 'germany',
    name: 'Germany',
    isoA3: 'DEU',
    region: 'Europe',
    marketPathwaySummary: 'EU GMP import-driven medical pathway with distributor screening requirements.',
    opportunityCategories: ['Medical Supply', 'Distribution'],
    reviewStatus: 'reviewed',
    confidence: 'high',
    hasRelatedListings: true,
  },
  {
    slug: 'switzerland',
    name: 'Switzerland',
    isoA3: 'CHE',
    region: 'Europe',
    reviewStatus: 'preliminary',
  },
  {
    slug: 'canada',
    name: 'Canada',
    isoA3: 'CAN',
    region: 'North America',
    reviewStatus: 'reviewed',
  },
  {
    slug: 'portugal',
    name: 'Portugal',
    isoA3: 'PRT',
    region: 'Europe',
    reviewStatus: 'preliminary',
  },
  {
    slug: 'unknown-country',
    name: 'Unknown Country',
    isoA3: 'UNK',
    region: 'Unknown',
    reviewStatus: 'not_published',
  }
]
