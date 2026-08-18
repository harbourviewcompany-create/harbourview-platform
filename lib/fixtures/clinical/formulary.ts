import type { FormularyProduct } from '@/lib/clinical/formulary'

/** Seed formulary rows — expand via Supabase clinical_formulary_products. */
export const FORMULARY_FIXTURES: FormularyProduct[] = [
  {
    id: 'form-br-001',
    slug: 'br-anvisa-cbd-oral-class',
    name: 'ANVISA-authorised CBD oral products (class)',
    countryIso2: 'BR',
    productClass: 'cbd-dominant',
    authorizationStatus: 'authorised',
    cannabinoidProfile: 'CBD-dominant; THC limits per product registration',
    routes: ['oral', 'oromucosal'],
    authority: 'ANVISA',
    notes:
      'Only products with current ANVISA authorisation may be prescribed and dispensed. Verify the live register before relying on any specific SKU.',
    primarySourceUrl: 'https://www.gov.br/anvisa',
    lastReviewed: '2026-07-20',
    reviewStatus: 'published',
  },
  {
    id: 'form-br-002',
    slug: 'br-import-authorisation-pathway',
    name: 'Individual import authorisation pathway',
    countryIso2: 'BR',
    productClass: 'other',
    authorizationStatus: 'import-authorised',
    cannabinoidProfile: 'Varies by authorised product',
    routes: ['oral', 'oromucosal', 'other'],
    authority: 'ANVISA',
    notes:
      'Import authorisation remains an important access route for some patients when domestic authorised products are insufficient. Confirm current ANVISA process.',
    primarySourceUrl: 'https://www.gov.br/anvisa',
    lastReviewed: '2026-07-20',
    reviewStatus: 'published',
  },
  {
    id: 'form-gb-001',
    slug: 'gb-cbpm-unlicensed-class',
    name: 'UK CBPMs (unlicensed specialist pathway)',
    countryIso2: 'GB',
    productClass: 'full-spectrum',
    authorizationStatus: 'authorised',
    cannabinoidProfile: 'Flower, oils, capsules — ratios vary by product',
    routes: ['inhaled', 'oral', 'oromucosal'],
    authority: 'MHRA / specialist prescribing framework',
    notes:
      'Unlicensed CBPMs dominate UK medical use. Specialist initiation is the default. Product quality and formulary availability change frequently.',
    lastReviewed: '2026-06-30',
    reviewStatus: 'published',
  },
  {
    id: 'form-au-001',
    slug: 'au-sas-b-medicinal-cannabis',
    name: 'TGA SAS-B / Authorised Prescriber medicinal cannabis products',
    countryIso2: 'AU',
    productClass: 'other',
    authorizationStatus: 'authorised',
    cannabinoidProfile: 'Wide range of CBD/THC ratios and forms',
    routes: ['oral', 'inhaled', 'oromucosal', 'topical'],
    authority: 'Therapeutic Goods Administration (TGA)',
    notes:
      'Product choice is broad under SAS-B and Authorised Prescriber schemes. Scheduling and state controlled-drug rules still apply.',
    lastReviewed: '2026-07-05',
    reviewStatus: 'published',
  },
  {
    id: 'form-de-001',
    slug: 'de-medical-cannabis-pharmacy',
    name: 'German medical cannabis (pharmacy-dispensed)',
    countryIso2: 'DE',
    productClass: 'full-spectrum',
    authorizationStatus: 'authorised',
    cannabinoidProfile: 'Flowers and extracts under medical framework',
    routes: ['inhaled', 'oral'],
    authority: 'BfArM / narcotics-medicines framework',
    notes:
      'Medical pathway is distinct from adult-use rules. Reimbursement often requires documentation against alternatives.',
    lastReviewed: '2026-07-10',
    reviewStatus: 'published',
  },
]

export function searchFormulary(opts: {
  countryIso2?: string
  q?: string
  limit?: number
}): FormularyProduct[] {
  const iso = opts.countryIso2?.toUpperCase()
  const q = (opts.q ?? '').trim().toLowerCase()
  let rows = FORMULARY_FIXTURES.filter((r) => r.reviewStatus === 'published')
  if (iso) rows = rows.filter((r) => r.countryIso2 === iso)
  if (q) {
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cannabinoidProfile.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q),
    )
  }
  return rows.slice(0, opts.limit ?? 50)
}
