/**
 * Orientation-level CPD / professional education module catalog.
 * Not accredited certificates until a recognised provider partnership is live.
 * Certificate interest is collected via request form, not auto-issued.
 */

export type CpdAudience =
  | 'operator'
  | 'compliance'
  | 'clinical'
  | 'logistics'
  | 'general'

export type CpdModule = {
  id: string
  slug: string
  title: string
  summary: string
  audience: CpdAudience[]
  /** Nominal learning hours for planning — not a formal CPD award until accredited */
  nominalHours: number
  topics: string[]
  status: 'orientation' | 'in_review' | 'partner_accredited'
  certificateEligible: boolean
  relatedHref?: string
}

export const CPD_MODULES: CpdModule[] = [
  {
    id: 'cpd-gmp-intro',
    slug: 'eu-gmp-orientation',
    title: 'EU-GMP orientation for cannabis operators',
    summary:
      'Site quality systems, audit readiness themes, and how EU-GMP interacts with narcotics export pathways. Orientation only — not a substitute for notified-body training.',
    audience: ['operator', 'compliance'],
    nominalHours: 2,
    topics: ['EU-GMP', 'quality systems', 'audit readiness'],
    status: 'orientation',
    certificateEligible: true,
    relatedHref: '/education/gmp',
  },
  {
    id: 'cpd-gdp',
    slug: 'gdp-controlled-distribution',
    title: 'GDP themes for controlled cannabis distribution',
    summary:
      'Wholesale authorisation context, transport chain-of-custody, and temperature / security handling expectations for regulated product.',
    audience: ['logistics', 'compliance', 'operator'],
    nominalHours: 1.5,
    topics: ['GDP', 'transport', 'wholesale'],
    status: 'orientation',
    certificateEligible: true,
    relatedHref: '/education/gdp',
  },
  {
    id: 'cpd-export-import',
    slug: 'export-import-readiness',
    title: 'Export–import readiness for medical corridors',
    summary:
      'Permit clocks, documentation packs, and parallel workstreams on tracked corridors (e.g. CA→DE). Ties to corridor execution plans and landed-cost orientation.',
    audience: ['operator', 'logistics', 'compliance'],
    nominalHours: 2.5,
    topics: ['permits', 'corridors', 'documentation'],
    status: 'orientation',
    certificateEligible: true,
    relatedHref: '/education/export-import-readiness',
  },
  {
    id: 'cpd-gacp',
    slug: 'gacp-cultivation-orientation',
    title: 'GACP cultivation orientation',
    summary:
      'Good Agricultural and Collection Practice themes for licensed cultivation programs supplying medical channels.',
    audience: ['operator', 'compliance'],
    nominalHours: 1.5,
    topics: ['GACP', 'cultivation', 'starting material'],
    status: 'orientation',
    certificateEligible: true,
    relatedHref: '/education/gacp',
  },
  {
    id: 'cpd-clinical-boundary',
    slug: 'clinical-education-boundaries',
    title: 'Clinical education boundaries for non-prescribers',
    summary:
      'What Harbourview will and will not publish on clinical topics; referral paths for licensed professionals; no personalised dosing.',
    audience: ['clinical', 'general'],
    nominalHours: 1,
    topics: ['clinical', 'boundaries', 'professional referral'],
    status: 'orientation',
    certificateEligible: false,
    relatedHref: '/education/clinical',
  },
  {
    id: 'cpd-compliance-readiness',
    slug: 'compliance-readiness',
    title: 'Compliance readiness checklist literacy',
    summary:
      'How to read jurisdiction playbooks, licence pathway orientation, and common pitfalls without treating content as legal advice.',
    audience: ['compliance', 'operator'],
    nominalHours: 2,
    topics: ['compliance', 'playbooks', 'licences'],
    status: 'orientation',
    certificateEligible: true,
    relatedHref: '/education/compliance-readiness',
  },
]

export function getCpdModule(slug: string): CpdModule | undefined {
  return CPD_MODULES.find((m) => m.slug === slug)
}

export function filterCpdModules(opts: {
  audience?: CpdAudience | 'any'
  certificateOnly?: boolean
}): CpdModule[] {
  return CPD_MODULES.filter((m) => {
    if (opts.certificateOnly && !m.certificateEligible) return false
    if (opts.audience && opts.audience !== 'any' && !m.audience.includes(opts.audience)) {
      return false
    }
    return true
  })
}
