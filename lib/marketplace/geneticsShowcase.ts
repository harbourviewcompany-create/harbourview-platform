export type GeneticsDrop = {
  id: string
  name: string
  type: 'Licensing window' | 'Territory opportunity' | 'Tissue-culture program'
  summary: string
  signals: string[]
  targetMarkets: string[]
  cta: string
}

export type GeneticsProfile = {
  slug: string
  name: string
  type: string
  region: string
  summary: string
  publicFocus: string[]
  publicFields: string[]
  privateFields: string[]
  drops: GeneticsDrop[]
}

export const geneticsProfiles: GeneticsProfile[] = [
  {
    slug: 'nordline-cbd-program',
    name: 'Nordline CBD Genetics Program',
    type: 'CBD genetics licensing',
    region: 'Europe',
    summary:
      'A CBD-focused genetics program for qualified operators exploring low-THC commercial pathways, licensing discussions and controlled international rollout opportunities.',
    publicFocus: ['CBD genetics', 'Low-THC pathways', 'Licensing', 'Tissue-culture compatible'],
    publicFields: ['Approved brand/program name', 'Region', 'Public program summary', 'Approved drops', 'Target markets'],
    privateFields: ['Direct contact details', 'Pricing', 'Sensitive breeding notes', 'Private documents', 'Negotiation terms'],
    drops: [
      {
        id: 'alpine-cbd-line',
        name: 'Alpine CBD Line',
        type: 'Licensing window',
        summary: 'CBD-dominant cultivar line available for qualified licensing discussion after Harbourview review.',
        signals: ['CBD-dominant', 'Licensing discussion', 'Country review required'],
        targetMarkets: ['Europe', 'Australia', 'New Zealand'],
        cta: 'Request Licensing Discussion',
      },
    ],
  },
  {
    slug: 'andes-origin-breeding-house',
    name: 'Andes Origin Breeding House',
    type: 'Breeder profile',
    region: 'LATAM',
    summary:
      'A breeder-led portfolio for selected territory discussions, commercial rollout partnerships and controlled genetics access conversations with qualified operators.',
    publicFocus: ['Breeder-led IP', 'Territory opportunities', 'THC cultivars', 'Breeding collaboration'],
    publicFields: ['Approved breeder/program name', 'Region', 'Public positioning', 'Approved drops', 'Access model'],
    privateFields: ['Direct contact details', 'Parent-line information', 'Unpublished genetics', 'Pricing', 'Private commercial terms'],
    drops: [
      {
        id: 'sierra-gold-line',
        name: 'Sierra Gold Line',
        type: 'Territory opportunity',
        summary: 'LATAM-origin cultivar line available for qualified exclusive-territory discussion.',
        signals: ['Territory discussion', 'Breeder-led IP', 'Licensed operators only'],
        targetMarkets: ['LATAM', 'Europe', 'Australia'],
        cta: 'Request Territory Access',
      },
    ],
  },
  {
    slug: 'canopycell-clean-stock-lab',
    name: 'CanopyCell Clean Stock Laboratory',
    type: 'Tissue-culture lab',
    region: 'North America',
    summary:
      'A tissue-culture and clean-stock program for genetics holders, licensed producers and pharma-aligned cultivation groups seeking propagation support.',
    publicFocus: ['Tissue culture', 'Clean stock', 'Cultivar preservation', 'Propagation'],
    publicFields: ['Approved lab/program name', 'Region', 'Public service summary', 'Approved intake programs', 'Target operator types'],
    privateFields: ['Direct contact details', 'Technical documents', 'Lab protocols', 'Pricing', 'Private cultivar information'],
    drops: [
      {
        id: 'clean-stock-intake',
        name: 'Clean-Stock Intake Program',
        type: 'Tissue-culture program',
        summary: 'Selected cultivars may be submitted for clean-stock and propagation review through Harbourview.',
        signals: ['Clean stock', 'Propagation review', 'Cultivar preservation'],
        targetMarkets: ['Canada', 'United States', 'Europe'],
        cta: 'Request Clean-Stock Review',
      },
    ],
  },
]

export function getGeneticsProfile(slug: string) {
  return geneticsProfiles.find((profile) => profile.slug === slug)
}
