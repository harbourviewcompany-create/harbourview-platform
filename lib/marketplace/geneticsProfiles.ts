export type GeneticsDisclosureLevel =
  | 'level_0_anonymous_opportunity'
  | 'level_1_public_showcase_approved'
  | 'level_2_qualified_introduction_approved'
  | 'level_3_deal_room_approved'

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
