import { EXTRA_CLINICAL_AUTHORITY_PACKS, EXTRA_CLINICAL_COUNTRY_ALIASES } from './authorityRegistry.extra'

/**
 * Global clinical authority registry for medical-cannabis prescribing markets.
 * Links only — not clinical claims. Never fall back across countries.
 *
 * Authority links only — never fall back across countries. Regions without a pack
 * return an empty list so callers show limited-coverage rather than foreign law.
 */

export type ClinicalAuthorityId =
  | 'federal-authority'
  | 'medical-document'
  | 'safety-interactions'
  | 'pharmacovigilance'

export type ClinicalAuthorityRecord = {
  id: ClinicalAuthorityId
  label: string
  purpose: string
  jurisdiction: string
  countryIso2: string
  evidenceType: 'regulation' | 'federal-guidance' | 'safety-guidance' | 'pharmacovigilance-guidance'
  evidenceStrength: 'Primary authority — evidence strength not graded by source'
  sourceName: string
  href: string
  verifiedAt: string
}

const strength = 'Primary authority — evidence strength not graded by source' as const

const CANADA_PACK: ClinicalAuthorityRecord[] = [
  {
    id: 'federal-authority',
    label: 'Authorization framework',
    purpose: 'Current federal authority for health care practitioners under the Cannabis Regulations.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'regulation',
    evidenceStrength: strength,
    sourceName: 'Justice Laws Website · Cannabis Regulations §272',
    href: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-272.html',
    verifiedAt: '2026-08-14',
  },
  {
    id: 'medical-document',
    label: 'Medical document requirements',
    purpose: 'Required contents and validity of the federal medical document.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'regulation',
    evidenceStrength: strength,
    sourceName: 'Justice Laws Website · Cannabis Regulations §273',
    href: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-273.html',
    verifiedAt: '2026-08-14',
  },
  {
    id: 'safety-interactions',
    label: 'Safety & interaction guidance',
    purpose: 'Current federal safety, contraindication-like and interaction guidance for cannabis used for medical purposes.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'safety-guidance',
    evidenceStrength: strength,
    sourceName: 'Health Canada · Cannabis for medical purposes',
    href: 'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
    verifiedAt: '2026-08-14',
  },
  {
    id: 'pharmacovigilance',
    label: 'Adverse-reaction reporting',
    purpose: 'Current federal health-professional guidance for reporting suspected adverse reactions to cannabis.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'pharmacovigilance-guidance',
    evidenceStrength: strength,
    sourceName: 'Health Canada · Report a side effect to cannabis: Health care professionals',
    href: 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/recalls-adverse-reactions-reporting/report-side-effects-cannabis-products/health-care-professionals.html',
    verifiedAt: '2026-08-14',
  },
]

function ministry(
  iso2: string,
  label: string,
  name: string,
  href: string,
  accessLabel: string,
  accessPurpose: string,
): ClinicalAuthorityRecord[] {
  const verifiedAt = '2026-08-16'
  return [
    { id: 'federal-authority', label: 'Competent authority', purpose: `Primary medicines / controlled-substance competent authority context for ${label} (${name}).`, jurisdiction: label, countryIso2: iso2, evidenceType: 'regulation', evidenceStrength: strength, sourceName: name, href, verifiedAt },
    { id: 'medical-document', label: accessLabel, purpose: accessPurpose, jurisdiction: label, countryIso2: iso2, evidenceType: 'federal-guidance', evidenceStrength: strength, sourceName: name, href, verifiedAt },
    { id: 'safety-interactions', label: 'Safety & product information', purpose: `Use authorized product information and ${name} safety communications. Harbourview does not provide a structured interaction checker.`, jurisdiction: label, countryIso2: iso2, evidenceType: 'safety-guidance', evidenceStrength: strength, sourceName: `${name} · Safety`, href, verifiedAt },
    { id: 'pharmacovigilance', label: 'Adverse-reaction reporting', purpose: `Health-professional pathway for suspected adverse reactions in ${label}.`, jurisdiction: label, countryIso2: iso2, evidenceType: 'pharmacovigilance-guidance', evidenceStrength: strength, sourceName: name, href, verifiedAt },
  ]
}

const CORE_PACKS: ClinicalAuthorityRecord[] = [
  ...ministry('US', 'United States', 'U.S. FDA', 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd', 'Federal vs state access', 'FDA regulates cannabis-derived drugs federally; most patient access is state-regulated.'),
  ...ministry('DE', 'Germany', 'BfArM', 'https://www.bfarm.de/EN/Home/_node.html', 'Prescribing & reimbursement', 'Medical cannabis within German medicines/narcotics framework; reimbursement involves G-BA and insurers.'),
  ...ministry('GB', 'United Kingdom', 'MHRA / Home Office', 'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources', 'Specialist CBPM prescribing', 'CBPMs restricted to GMC specialist-register prescribers under current rules.'),
  ...ministry('AU', 'Australia', 'TGA / ODC', 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/medicinal-cannabis', 'SAS / Authorised Prescriber', 'SAS or Authorised Prescriber pathways; import may require ODC licensing.'),
  ...ministry('FR', 'France', 'ANSM', 'https://ansm.sante.fr/', 'Medical cannabis access', 'Supervised medical cannabis framework under ANSM.'),
  ...ministry('NL', 'Netherlands', 'OMC / Farmatec', 'https://english.farmatec.nl/', 'Office of Medicinal Cannabis', 'OMC supply framework; physicians may prescribe; pharmacies dispense OMC products.'),
  ...ministry('IL', 'Israel', 'IMCA / Ministry of Health', 'https://www.gov.il/en/departments/units/cannabis_unit', 'IMCA programme', 'Mature medical cannabis programme; authorized prescribers and central patient registration.'),
  ...ministry('BR', 'Brazil', 'ANVISA', 'https://www.gov.br/anvisa/pt-br', 'Cannabis products authorization', 'ANVISA regulates cannabis-derived products and import authorization.'),
  ...ministry('NZ', 'New Zealand', 'Medicinal Cannabis Agency', 'https://www.health.govt.nz/our-work/regulation-health-and-disability-system/medicinal-cannabis-agency', 'Medicinal Cannabis Scheme', 'Products must meet scheme standards; confirm verified products.'),
  ...ministry('ZA', 'South Africa', 'SAHPRA', 'https://www.sahpra.org.za/', 'Section 21 / medicines framework', 'SAHPRA regulates medicines including Section 21 pathways where applicable.'),
  ...ministry('TH', 'Thailand', 'Thai FDA', 'https://www.fda.moph.go.th/Pages/Home.aspx', 'Medical cannabis framework', 'Ministry of Public Health and Thai FDA licensed pathways.'),
  ...ministry('IT', 'Italy', 'AIFA', 'https://www.aifa.gov.it/', 'Medical cannabis / magistral', 'Often via magistral preparation under Ministry of Health / AIFA rules.'),
  ...ministry('PL', 'Poland', 'GIF / URPL', 'https://www.gif.gov.pl/', 'Medical cannabis prescribing', 'Physician prescription of preparations under pharmaceutical inspection rules.'),
  ...ministry('CH', 'Switzerland', 'Swissmedic', 'https://www.swissmedic.ch/swissmedic/en/home.html', 'Medical cannabis framework', 'Revised narcotics law with Swissmedic oversight.'),
  ...ministry('UA', 'Ukraine', 'State Service / Ministry of Health', 'https://moz.gov.ua/', 'Medical cannabis framework', 'Ukraine has moved toward regulated medical cannabis.'),
  ...ministry('MA', 'Morocco', 'Ministry of Health', 'https://www.sante.gov.ma/', 'Medical cannabis framework', 'Morocco has licensed medical/industrial cannabis activity.'),
  ...ministry('JM', 'Jamaica', 'Cannabis Licensing Authority / MOHW', 'https://www.cla.org.jm/', 'Medical cannabis framework', 'Jamaica regulates medical cannabis under the CLA and Ministry of Health.'),
  ...ministry('IN', 'India', 'CDSCO / Ministry of AYUSH', 'https://cdsco.gov.in/', 'Ayurvedic / narcotics framework', 'Confirm product class and authorization before any clinical use.'),
  ...ministry('KR', 'South Korea', 'MFDS', 'https://www.mfds.go.kr/eng/index.do', 'Narcotics / orphan pathways', 'Limited cannabis-based medicines under strict MFDS rules.'),
]

export const CLINICAL_AUTHORITY_SEED: readonly ClinicalAuthorityRecord[] = [
  ...CANADA_PACK,
  ...CORE_PACKS,
  ...EXTRA_CLINICAL_AUTHORITY_PACKS,
]

export const CLINICAL_COUNTRY_ALIASES: Record<string, string> = {
  CA: 'CA', CANADA: 'CA',
  US: 'US', USA: 'US', 'UNITED STATES': 'US',
  DE: 'DE', GERMANY: 'DE',
  GB: 'GB', UK: 'GB', 'UNITED KINGDOM': 'GB',
  AU: 'AU', AUSTRALIA: 'AU',
  FR: 'FR', FRANCE: 'FR',
  NL: 'NL', NETHERLANDS: 'NL', HOLLAND: 'NL',
  IL: 'IL', ISRAEL: 'IL',
  BR: 'BR', BRAZIL: 'BR',
  NZ: 'NZ', 'NEW ZEALAND': 'NZ',
  ZA: 'ZA', 'SOUTH AFRICA': 'ZA',
  TH: 'TH', THAILAND: 'TH',
  IT: 'IT', ITALY: 'IT',
  PL: 'PL', POLAND: 'PL',
  CH: 'CH', SWITZERLAND: 'CH',
  UA: 'UA', UKRAINE: 'UA',
  MA: 'MA', MOROCCO: 'MA',
  JM: 'JM', JAMAICA: 'JM',
  IN: 'IN', INDIA: 'IN',
  KR: 'KR', 'SOUTH KOREA': 'KR', KOREA: 'KR',
  TR: 'TR', TURKEY: 'TR', TÜRKIYE: 'TR', TURKIYE: 'TR',
  ...EXTRA_CLINICAL_COUNTRY_ALIASES,
}

export const CLINICAL_JURISDICTION_LABELS: Record<string, string> = Object.fromEntries(
  CLINICAL_AUTHORITY_SEED.map(a => [a.countryIso2, a.jurisdiction]),
)

export function listClinicalAuthorityCountries(): string[] {
  return [...new Set(CLINICAL_AUTHORITY_SEED.map(a => a.countryIso2))].sort()
}

export function getClinicalAuthoritiesForCountry(countryIso2: string | null | undefined): readonly ClinicalAuthorityRecord[] {
  if (!countryIso2) return []
  const iso = CLINICAL_COUNTRY_ALIASES[countryIso2.trim().toUpperCase()] ?? (countryIso2.trim().length === 2 ? countryIso2.trim().toUpperCase() : null)
  if (!iso) return []
  return CLINICAL_AUTHORITY_SEED.filter(a => a.countryIso2 === iso)
}
