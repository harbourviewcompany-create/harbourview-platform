import { z } from 'zod'

export const MarketPathwaySchema = z.enum([
  'medical',
  'adultUse',
  'industrialHemp',
  'decriminalized',
  'prohibited',
  'unknown'
])

export const ReviewStatusSchema = z.enum([
  'prototypeExtracted',
  'needsAnalystReview',
  'publicSafeSeed'
])

export const PublicCountryIntelligenceFixtureSchema = z
  .object({
    slug: z.string().min(1),
    country: z.string().min(1),
    region: z.string().min(1),
    statusLabel: z.string().min(1),
    pathways: z.array(MarketPathwaySchema).min(1),
    publicSummary: z.string().min(1),
    opportunityCategories: z.array(z.string().min(1)),
    tradeRole: z.array(z.string().min(1)),
    regulatorLabel: z.string().min(1).optional(),
    coordinates: z
      .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
      .strict()
      .optional(),
    reviewStatus: ReviewStatusSchema,
    sourcePrototype: z.enum([
      'harbourview_unified_v4_compact_top.html',
      'harbourview_v8_clean_map.html',
      'harbourview_global_cannabis_guidebook_v2_2026.html',
      'Signals - Cannabis Policy South America.html'
    ])
  })
  .strict()

export const PublicCountryIntelligenceFixturesSchema = z.array(PublicCountryIntelligenceFixtureSchema)
