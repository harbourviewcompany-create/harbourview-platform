export type GeneticsDrop = {
  id: string
  name: string
  type: string
  thesis: string
  signals: string[]
  targetMarkets: string[]
  cta: string
  accessStatus: string
  pathwayBadge: string
  territoryStatus: string
  urgencySignal: string
  imageMood: string
}

export type GeneticsProfile = {
  slug: string
  name: string
  profileType: string
  region: string
  positioning: string
  overview: string
  focus: string[]
  drops: GeneticsDrop[]
  prestigeSignal: string
  accessModel: string
  pathwaySummary: string
  imageMood: string
  breedingPhilosophy: string
  commercialNarrative: string
  marketIntent: string
  programBackground: string
  participationNote: string
  internationalContext: string
}

export const geneticsProfiles: GeneticsProfile[] = [
  {
    slug: 'nordline-cbd-program',
    name: 'Nordline CBD Genetics Program',
    profileType: 'CBD licensing program',
    region: 'Europe',
    positioning: 'CBD-dominant genetics for regulated commercial pathways.',
    overview:
      'A selected CBD genetics program for operators seeking licensing, low-THC commercial positioning and tissue-culture compatible propagation discussions.',
    focus: ['CBD genetics', 'Licensing', 'Low-THC pathways', 'Tissue culture compatible'],
    prestigeSignal: 'EU-aligned CBD licensing window',
    accessModel: 'Profile visible / access reviewed',
    pathwaySummary: 'Suitable for selected CBD commercial pathway discussions. Country review required.',
    imageMood: 'cool botanical laboratory with gold-accented glass and shadowed leaves',
    breedingPhilosophy:
      'The program focuses on stable cannabinoid expression, commercial consistency and genetics suitable for structured low-THC and CBD-oriented cultivation pathways.',
    commercialNarrative:
      'The genetics are positioned for operators seeking differentiated CBD cultivars with tissue-culture compatibility and controlled commercial rollout discussions.',
    marketIntent:
      'Focused on selected Europe, Australia and New Zealand pathway conversations rather than broad public licensing campaigns.',
    programBackground:
      'Built around cultivar consistency, propagation discipline and long-term commercial suitability for regulated operators.',
    participationNote:
      'Participation and review are intentionally selective during the initial Harbourview Genetics rollout phase.',
    internationalContext:
      'Relevant to operators exploring CBD commercial pathways, low-THC cultivation strategies and selective market-entry discussions.',
    drops: [
      {
        id: 'alpine-cbd-line',
        name: 'Alpine CBD Line',
        type: 'Licensing window',
        thesis: 'CBD-dominant cultivar line available for qualified licensing discussion.',
        signals: ['CBD-dominant', 'Licensing available', 'Country review required'],
        targetMarkets: ['Europe', 'Australia', 'New Zealand'],
        cta: 'Request Licensing Discussion',
        accessStatus: 'Qualified review',
        pathwayBadge: 'CBD pathway discussion',
        territoryStatus: 'Selected markets open',
        urgencySignal: 'Licensing window open for qualified operators',
        imageMood: 'misty alpine botanical macro with restrained gold light',
      },
    ],
  },
  {
    slug: 'andes-origin-breeding-house',
    name: 'Andes Origin Breeding House',
    profileType: 'Breeder profile',
    region: 'LATAM',
    positioning: 'Rare LATAM genetics for controlled international expansion.',
    overview:
      'A breeder-led portfolio built around territory opportunities, commercial rollout partnerships and selective genetics access for licensed operators.',
    focus: ['Breeder-led IP', 'Territory opportunities', 'THC cultivars', 'Breeding collaboration'],
    prestigeSignal: 'Breeder-led territory opportunity',
    accessModel: 'Public profile / contact private',
    pathwaySummary: 'Territory discussions available for selected commercial partners. No market outcome is guaranteed.',
    imageMood: 'dark equatorial botanical field study with cinematic shadow and gold rim light',
    breedingPhilosophy:
      'The breeding direction emphasizes cultivar identity, regional adaptation and preserving differentiated genetic character over large-scale commoditization.',
    commercialNarrative:
      'The portfolio is positioned for selected operators seeking unique territory narratives, differentiated flower positioning and exclusive commercial access discussions.',
    marketIntent:
      'Focused on controlled rollout partnerships across selected Europe, LATAM and Australia pathway discussions.',
    programBackground:
      'Built from breeder-led selection work with emphasis on rarity, identity and controlled international exposure.',
    participationNote:
      'Harbourview presents selected breeder programs during a curated rollout phase rather than maintaining an open-access directory.',
    internationalContext:
      'Relevant to operators seeking differentiated cultivar positioning, selective territory rights and branded commercial rollout pathways.',
    drops: [
      {
        id: 'sierra-gold-line',
        name: 'Sierra Gold Line',
        type: 'Exclusive territory opportunity',
        thesis: 'LATAM-origin cultivar line available for qualified territory discussion.',
        signals: ['Exclusive territory', 'Breeder-led IP', 'Licensed operators only'],
        targetMarkets: ['LATAM', 'Europe', 'Australia'],
        cta: 'Request Territory Access',
        accessStatus: 'Territory review',
        pathwayBadge: 'Commercial rollout partner',
        territoryStatus: 'Exclusive discussion available',
        urgencySignal: 'Selected territory conversations open',
        imageMood: 'high-contrast breeder archive with dark canopy texture and gold plate detail',
      },
    ],
  },
  {
    slug: 'canopycell-clean-stock-lab',
    name: 'CanopyCell Clean Stock Laboratory',
    profileType: 'Tissue-culture lab',
    region: 'North America',
    positioning: 'Clean-stock propagation support for serious regulated operators.',
    overview:
      'A tissue-culture and clean-stock program for genetics holders, licensed producers and pharma-aligned cultivation groups seeking propagation support.',
    focus: ['Tissue culture', 'Clean stock', 'Cultivar preservation', 'Propagation'],
    prestigeSignal: 'Clean-stock propagation program',
    accessModel: 'Program visible / technical details private',
    pathwaySummary: 'Clean-stock and preservation discussions available after Harbourview review.',
    imageMood: 'sterile tissue culture glassware with deep navy shadows and gold highlights',
    breedingPhilosophy:
      'The laboratory direction emphasizes preservation quality, propagation stability and controlled cultivar stewardship for long-term regulated cultivation.',
    commercialNarrative:
      'The program is designed for genetics holders and operators requiring cleaner propagation workflows, preservation pathways and selective tissue-culture support.',
    marketIntent:
      'Focused on North America and Europe commercial conversations involving clean-stock and propagation infrastructure.',
    programBackground:
      'Built around tissue-culture discipline, cultivar preservation and long-term commercial propagation support.',
    participationNote:
      'Harbourview reviews all propagation and clean-stock programs before any commercial exposure or introduction discussion.',
    internationalContext:
      'Relevant to licensed operators, pharma-aligned cultivation groups and genetics holders exploring propagation infrastructure partnerships.',
    drops: [
      {
        id: 'clean-stock-intake',
        name: 'Clean-Stock Intake Program',
        type: 'Tissue-culture program',
        thesis: 'Submit selected cultivars for clean-stock and propagation review.',
        signals: ['Clean stock', 'Pathogen screening pathway', 'Cultivar preservation'],
        targetMarkets: ['Canada', 'United States', 'Europe'],
        cta: 'Request Clean-Stock Review',
        accessStatus: 'Intake review',
        pathwayBadge: 'Clean-stock pathway',
        territoryStatus: 'Lab intake by review',
        urgencySignal: 'Limited intake queue for selected cultivars',
        imageMood: 'premium tissue culture lab close-up with glass vessels and restrained gold glow',
      },
    ],
  },
]

export function getGeneticsProfile(slug: string) {
  return geneticsProfiles.find((profile) => profile.slug === slug)
}
