import { getPublicGeneticsProfiles } from '@/lib/marketplace/geneticsShowcase'

export type GeneticsFilterSearchParams = {
  q?: string
  type?: string
  pathway?: string
  region?: string
  access?: string
}

export type PublicGeneticsDropCard = {
  id: string
  profileSlug: string
  profileName: string
  name: string
  type: string
  summary: string
  signals: string[]
  targetMarkets: string[]
  cta: string
  accessLevel: 'Harbourview review required'
}

export type PublicGeneticsProfileCard = {
  slug: string
  name: string
  type: string
  region: string
  summary: string
  publicFocus: string[]
  accessLevel: 'Harbourview review required'
  currentDropCount: number
}

const INTERNAL_FIELD_PATTERNS = [
  'privateFields',
  'internalOwnerName',
  'internalContactEmail',
  'internalContactPhone',
  'internalPricingNotes',
  'internalBreedingNotes',
  'internalDocuments',
  'internalReviewNotes',
  'reviewedBy',
  'assignedReviewer',
  'sourceUrl',
  'sourceName',
  'provenanceSummary',
  'sourceEvidence',
]

export function assertNoPrivateGeneticsFields(payload: unknown) {
  const serialized = JSON.stringify(payload)

  for (const pattern of INTERNAL_FIELD_PATTERNS) {
    if (serialized.includes(pattern)) {
      throw new Error(`Private genetics field leaked into public projection: ${pattern}`)
    }
  }
}

export function toPublicGeneticsProfileCard(profile: ReturnType<typeof getPublicGeneticsProfiles>[number]): PublicGeneticsProfileCard {
  const card = {
    slug: profile.slug,
    name: profile.name,
    type: profile.type,
    region: profile.region,
    summary: profile.summary,
    publicFocus: profile.publicFocus,
    accessLevel: 'Harbourview review required' as const,
    currentDropCount: profile.drops.length,
  }

  assertNoPrivateGeneticsFields(card)
  return card
}

export function toPublicGeneticsDropCards(profile: ReturnType<typeof getPublicGeneticsProfiles>[number]): PublicGeneticsDropCard[] {
  const cards = profile.drops.map((drop) => ({
    id: drop.id,
    profileSlug: profile.slug,
    profileName: profile.name,
    name: drop.name,
    type: drop.type,
    summary: drop.summary,
    signals: drop.signals,
    targetMarkets: drop.targetMarkets,
    cta: drop.cta,
    accessLevel: 'Harbourview review required' as const,
  }))

  assertNoPrivateGeneticsFields(cards)
  return cards
}

export function getPublicGeneticsProfileCards() {
  const cards = getPublicGeneticsProfiles().map(toPublicGeneticsProfileCard)
  assertNoPrivateGeneticsFields(cards)
  return cards
}

export function getPublicGeneticsDropCards() {
  const cards = getPublicGeneticsProfiles().flatMap(toPublicGeneticsDropCards)
  assertNoPrivateGeneticsFields(cards)
  return cards
}

export const geneticsFilterOptions = {
  types: ['CBD genetics licensing', 'Breeder profile', 'Tissue-culture lab'],
  pathways: ['Licensing', 'Territory opportunities', 'Clean stock', 'Tissue culture', 'Breeding collaboration'],
  regions: ['Europe', 'LATAM', 'North America'],
  accessLevels: ['Harbourview review required'],
} as const

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() || ''
}

export function filterPublicGeneticsProfiles(
  profiles: PublicGeneticsProfileCard[],
  searchParams: GeneticsFilterSearchParams,
) {
  const q = normalize(searchParams.q)
  const type = normalize(searchParams.type)
  const pathway = normalize(searchParams.pathway)
  const region = normalize(searchParams.region)
  const access = normalize(searchParams.access)

  return profiles.filter((profile) => {
    const searchable = [profile.name, profile.type, profile.region, profile.summary, ...profile.publicFocus]
      .join(' ')
      .toLowerCase()

    const matchesQ = !q || searchable.includes(q)
    const matchesType = !type || profile.type.toLowerCase() === type
    const matchesPathway = !pathway || profile.publicFocus.some((focus) => focus.toLowerCase() === pathway)
    const matchesRegion = !region || profile.region.toLowerCase() === region
    const matchesAccess = !access || profile.accessLevel.toLowerCase() === access

    return matchesQ && matchesType && matchesPathway && matchesRegion && matchesAccess
  })
}

export function filterPublicGeneticsDrops(
  drops: PublicGeneticsDropCard[],
  searchParams: GeneticsFilterSearchParams,
) {
  const q = normalize(searchParams.q)
  const type = normalize(searchParams.type)
  const pathway = normalize(searchParams.pathway)
  const region = normalize(searchParams.region)
  const access = normalize(searchParams.access)

  return drops.filter((drop) => {
    const searchable = [drop.name, drop.type, drop.profileName, drop.summary, ...drop.signals, ...drop.targetMarkets]
      .join(' ')
      .toLowerCase()

    const matchesQ = !q || searchable.includes(q)
    const matchesType = !type || drop.type.toLowerCase() === type
    const matchesPathway = !pathway || drop.signals.some((signal) => signal.toLowerCase() === pathway)
    const matchesRegion = !region || drop.targetMarkets.some((market) => market.toLowerCase() === region)
    const matchesAccess = !access || drop.accessLevel.toLowerCase() === access

    return matchesQ && matchesType && matchesPathway && matchesRegion && matchesAccess
  })
}
