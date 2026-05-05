export type GeneticsDisclosureLevel =
  | 'level_0_anonymous_opportunity'
  | 'level_1_public_showcase_approved'
  | 'level_2_qualified_introduction_approved'
  | 'level_3_deal_room_approved'

export type GeneticsRoutingIntent =
  | 'seed_access'
  | 'genetics_licensing'
  | 'territory_discussion'
  | 'tissue_culture'
  | 'clean_stock'
  | 'breeding_collaboration'
  | 'research_collaboration'
  | 'commercial_rollout'

export type GeneticsHolderPermissionStatus =
  | 'public_showcase_approved'
  | 'inquiry_routing_approved'
  | 'named_intro_approved'
  | 'deal_room_approved'
  | 'revoked'

export type GeneticsDrop = {
  id: string
  title: string
  dropType: string
  shortPositioning: string
  cannabinoidFocus?: string
  format?: string
  territoryModel?: string
  targetMarkets?: string[]
  signals: string[]
  ctaLabel: string
  routingCategory: string
  routingIntent: GeneticsRoutingIntent[]
  eligibleMarkets: string[]
  requiresLicenceReview: boolean
  requiresPathwayReview: boolean
  geneticsHolderPermissionStatus: GeneticsHolderPermissionStatus
  minimumRevealLevelForIntro: GeneticsDisclosureLevel
}

export type GeneticsProfile = {
  slug: string
  disclosureLevel: GeneticsDisclosureLevel
  profileName: string
  profileType: string
  region: string
  positioningLine: string
  profileSummary: string
  currentDrops: GeneticsDrop[]
  primaryCta: string
  secondaryCta: string

  // private fields
  contactName?: string
  email?: string
  phone?: string
  privatePricing?: string
  sourceName?: string
  internalReviewNotes?: string
}

export const geneticsProfiles: GeneticsProfile[] = [
  {
    slug: 'nordline-cbd',
    disclosureLevel: 'level_1_public_showcase_approved',
    profileName: 'Nordline CBD Genetics Program',
    profileType: 'EU Licensing Program',
    region: 'Europe',
    positioningLine: 'CBD genetics built for regulated European pathways.',
    profileSummary:
      'Selected CBD-dominant cultivar lines for licensed partners seeking stable cannabinoid expression and commercial expansion into European markets.',
    currentDrops: [
      {
        id: 'alpine',
        title: 'Alpine CBD Line',
        dropType: 'Cultivar Line',
        shortPositioning: 'CBD-dominant cultivar for EU licensing pathways.',
        signals: ['CBD-dominant', 'Licensing available', 'Tissue culture compatible'],
        ctaLabel: 'Request Licensing Access',
        routingCategory: 'genetics_cultivar_licensing',
        routingIntent: ['genetics_licensing', 'commercial_rollout', 'tissue_culture'],
        eligibleMarkets: ['Germany', 'Europe', 'Australia', 'New Zealand'],
        territoryModel: 'non_exclusive_or_territory_review',
        requiresLicenceReview: true,
        requiresPathwayReview: true,
        geneticsHolderPermissionStatus: 'inquiry_routing_approved',
        minimumRevealLevelForIntro: 'level_3_deal_room_approved',
      },
    ],
    primaryCta: 'Request Licensing Access',
    secondaryCta: 'Discuss Territory',
  },
  {
    slug: 'andes-origin',
    disclosureLevel: 'level_1_public_showcase_approved',
    profileName: 'Andes Origin Breeding House',
    profileType: 'LATAM Breeder',
    region: 'LATAM',
    positioningLine: 'Rare LATAM genetics for controlled expansion.',
    profileSummary:
      'Breeder-led genetics portfolio offering exclusive territory rights and commercial partnerships.',
    currentDrops: [
      {
        id: 'sierra',
        title: 'Sierra Gold Line',
        dropType: 'Territory Opportunity',
        shortPositioning: 'THC-forward cultivar line with exclusive territory discussion.',
        signals: ['Exclusive territory', 'Breeder IP', 'Licensed operators only'],
        ctaLabel: 'Request Territory Access',
        routingCategory: 'genetics_territory_rights',
        routingIntent: ['territory_discussion', 'genetics_licensing', 'commercial_rollout'],
        eligibleMarkets: ['LATAM', 'Europe', 'Australia'],
        territoryModel: 'exclusive_or_nonexclusive_review',
        requiresLicenceReview: true,
        requiresPathwayReview: true,
        geneticsHolderPermissionStatus: 'inquiry_routing_approved',
        minimumRevealLevelForIntro: 'level_3_deal_room_approved',
      },
    ],
    primaryCta: 'Request Territory Discussion',
    secondaryCta: 'View Drops',
  },
  {
    slug: 'canopycell',
    disclosureLevel: 'level_1_public_showcase_approved',
    profileName: 'CanopyCell Clean Stock Laboratory',
    profileType: 'Tissue Culture Lab',
    region: 'North America',
    positioningLine: 'Clean-stock propagation for regulated operators.',
    profileSummary:
      'Tissue-culture, pathogen screening and propagation programs for licensed producers and pharma-aligned cultivation.',
    currentDrops: [
      {
        id: 'cleanstock',
        title: 'Clean-Stock Intake Program',
        dropType: 'Tissue Culture',
        shortPositioning: 'Submit cultivars for clean-stock and propagation.',
        signals: ['Clean stock', 'Propagation', 'Licensed operators'],
        ctaLabel: 'Request Intake Review',
        routingCategory: 'genetics_clean_stock_propagation',
        routingIntent: ['tissue_culture', 'clean_stock', 'commercial_rollout'],
        eligibleMarkets: ['Canada', 'United States', 'Europe', 'Australia'],
        territoryModel: 'service_pathway_review',
        requiresLicenceReview: true,
        requiresPathwayReview: true,
        geneticsHolderPermissionStatus: 'inquiry_routing_approved',
        minimumRevealLevelForIntro: 'level_3_deal_room_approved',
      },
    ],
    primaryCta: 'Request Clean-Stock Review',
    secondaryCta: 'Submit Cultivar',
  },
]

export function toPublicGeneticsProfile(profile: GeneticsProfile) {
  const approved =
    profile.disclosureLevel === 'level_1_public_showcase_approved' ||
    profile.disclosureLevel === 'level_2_qualified_introduction_approved' ||
    profile.disclosureLevel === 'level_3_deal_room_approved'

  if (!approved) {
    return {
      slug: profile.slug,
      profileName: 'Genetics opportunity available through Harbourview',
      profileType: 'Controlled genetics opportunity',
      region: profile.region,
      positioningLine: 'Access available through Harbourview qualification.',
      profileSummary:
        'Company identity and details are disclosed only after Harbourview review.',
      currentDrops: [],
      primaryCta: 'Request Genetics Access',
      secondaryCta: 'Request Review',
    }
  }

  const { contactName, email, phone, privatePricing, sourceName, internalReviewNotes, ...safe } = profile

  return safe
}
