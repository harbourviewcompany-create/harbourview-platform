export type GeneticsDrop = {
  id: string
  name: string
  type: string
  thesis: string
  signals: string[]
  targetMarkets: string[]
  cta: string
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
    drops: [
      {
        id: 'alpine-cbd-line',
        name: 'Alpine CBD Line',
        type: 'Licensing window',
        thesis: 'CBD-dominant cultivar line available for qualified licensing discussion.',
        signals: ['CBD-dominant', 'Licensing available', 'Country review required'],
        targetMarkets: ['Europe', 'Australia', 'New Zealand'],
        cta: 'Request Licensing Discussion',
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
    drops: [
      {
        id: 'sierra-gold-line',
        name: 'Sierra Gold Line',
        type: 'Exclusive territory opportunity',
        thesis: 'LATAM-origin cultivar line available for qualified territory discussion.',
        signals: ['Exclusive territory', 'Breeder-led IP', 'Licensed operators only'],
        targetMarkets: ['LATAM', 'Europe', 'Australia'],
        cta: 'Request Territory Access',
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
    drops: [
      {
        id: 'clean-stock-intake',
        name: 'Clean-Stock Intake Program',
        type: 'Tissue-culture program',
        thesis: 'Submit selected cultivars for clean-stock and propagation review.',
        signals: ['Clean stock', 'Pathogen screening pathway', 'Cultivar preservation'],
        targetMarkets: ['Canada', 'United States', 'Europe'],
        cta: 'Request Clean-Stock Review',
      },
    ],
  },
]

export function getGeneticsProfile(slug: string) {
  return geneticsProfiles.find((profile) => profile.slug === slug)
}
