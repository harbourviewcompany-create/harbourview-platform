export type ClinicalSourceState =
  | 'loaded'
  | 'empty'
  | 'no-match'
  | 'stale'
  | 'degraded'
  | 'permission'
  | 'error'
  | 'limited-coverage'

export type ClinicalAuthorityId =
  | 'federal-authority'
  | 'medical-document'
  | 'safety-interactions'
  | 'pharmacovigilance'

export type ClinicalAuthorityRecord = {
  id: ClinicalAuthorityId
  label: string
  purpose: string
  /** Display jurisdiction label (e.g. Canada, Germany). */
  jurisdiction: string
  /** ISO 3166-1 alpha-2 used for lookup. */
  countryIso2: string
  evidenceType: 'regulation' | 'federal-guidance' | 'safety-guidance' | 'pharmacovigilance-guidance'
  evidenceStrength: 'Primary authority — evidence strength not graded by source'
  sourceName: string
  href: string
  verifiedAt: string
}

/** Canonical Tier-1 authority seed (CA, DE, AU, GB). Links only — not clinical claims. */
const AUTHORITY_SEED: readonly ClinicalAuthorityRecord[] = [
  // ── Canada ───────────────────────────────────────────────────────────────
  {
    id: 'federal-authority',
    label: 'Authorization framework',
    purpose: 'Current federal authority for health care practitioners under the Cannabis Regulations.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'regulation',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
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
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
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
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
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
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'Health Canada · Report a side effect to cannabis: Health care professionals',
    href: 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/recalls-adverse-reactions-reporting/report-side-effects-cannabis-products/health-care-professionals.html',
    verifiedAt: '2026-08-14',
  },
  // ── Germany ──────────────────────────────────────────────────────────────
  {
    id: 'federal-authority',
    label: 'Narcotics & medical cannabis framework',
    purpose: 'Federal competent authority context for narcotic medicines and medical cannabis (BfArM).',
    jurisdiction: 'Germany',
    countryIso2: 'DE',
    evidenceType: 'regulation',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'BfArM · Bundesinstitut für Arzneimittel und Medizinprodukte',
    href: 'https://www.bfarm.de/EN/Home/_node.html',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'medical-document',
    label: 'Prescribing & reimbursement context',
    purpose: 'Medical cannabis is prescribed within the German medicines/narcotics framework; reimbursement decisions involve G-BA and insurers — verify current rules before acting.',
    jurisdiction: 'Germany',
    countryIso2: 'DE',
    evidenceType: 'federal-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'G-BA · Gemeinsamer Bundesausschuss',
    href: 'https://www.g-ba.de/english/',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'safety-interactions',
    label: 'Product information & safety',
    purpose: 'Use authorized product information and competent-authority safety communications. Harbourview does not provide a structured interaction checker.',
    jurisdiction: 'Germany',
    countryIso2: 'DE',
    evidenceType: 'safety-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'BfArM · Safety information',
    href: 'https://www.bfarm.de/EN/Medicinal-products/Safety/_node.html',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'pharmacovigilance',
    label: 'Adverse-reaction reporting',
    purpose: 'Health-professional pathway for suspected adverse reactions in Germany.',
    jurisdiction: 'Germany',
    countryIso2: 'DE',
    evidenceType: 'pharmacovigilance-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'BfArM · Pharmacovigilance',
    href: 'https://www.bfarm.de/EN/Medicinal-products/Pharmacovigilance/_node.html',
    verifiedAt: '2026-08-16',
  },
  // ── Australia ────────────────────────────────────────────────────────────
  {
    id: 'federal-authority',
    label: 'TGA medicines framework',
    purpose: 'Therapeutic Goods Administration governs scheduling and access pathways for medicinal cannabis products.',
    jurisdiction: 'Australia',
    countryIso2: 'AU',
    evidenceType: 'regulation',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'TGA · Medicinal cannabis',
    href: 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/medicinal-cannabis',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'medical-document',
    label: 'SAS / Authorised Prescriber pathways',
    purpose: 'Access via Special Access Scheme or Authorised Prescriber programmes — confirm current TGA pathway rules for the product and indication.',
    jurisdiction: 'Australia',
    countryIso2: 'AU',
    evidenceType: 'federal-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'TGA · Special Access Scheme',
    href: 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/special-access-scheme',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'safety-interactions',
    label: 'Safety & product information',
    purpose: 'Rely on TGA communications and product-specific information. No structured interaction engine is provided here.',
    jurisdiction: 'Australia',
    countryIso2: 'AU',
    evidenceType: 'safety-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'TGA · Safety information',
    href: 'https://www.tga.gov.au/safety',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'pharmacovigilance',
    label: 'Adverse event reporting',
    purpose: 'Report suspected adverse events associated with medicines, including medicinal cannabis products.',
    jurisdiction: 'Australia',
    countryIso2: 'AU',
    evidenceType: 'pharmacovigilance-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'TGA · Reporting problems',
    href: 'https://www.tga.gov.au/safety/reporting-problems',
    verifiedAt: '2026-08-16',
  },
  // ── United Kingdom ───────────────────────────────────────────────────────
  {
    id: 'federal-authority',
    label: 'CBPM / controlled drugs framework',
    purpose: 'Cannabis-based products for medicinal use (CBPMs) under UK controlled-drug and medicines regulation.',
    jurisdiction: 'United Kingdom',
    countryIso2: 'GB',
    evidenceType: 'regulation',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'MHRA · Cannabis-based products for medicinal use',
    href: 'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'medical-document',
    label: 'Specialist prescribing context',
    purpose: 'CBPM prescribing is restricted to specialist practitioners on the GMC specialist register — confirm current Home Office / MHRA guidance.',
    jurisdiction: 'United Kingdom',
    countryIso2: 'GB',
    evidenceType: 'federal-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'GOV.UK · Cannabis-based medicinal products',
    href: 'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'safety-interactions',
    label: 'Safety communications',
    purpose: 'Use MHRA safety communications and product information. Harbourview does not operate a structured interaction checker.',
    jurisdiction: 'United Kingdom',
    countryIso2: 'GB',
    evidenceType: 'safety-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'MHRA · Drug safety updates',
    href: 'https://www.gov.uk/drug-safety-update',
    verifiedAt: '2026-08-16',
  },
  {
    id: 'pharmacovigilance',
    label: 'Yellow Card reporting',
    purpose: 'Report suspected adverse drug reactions via the Yellow Card scheme.',
    jurisdiction: 'United Kingdom',
    countryIso2: 'GB',
    evidenceType: 'pharmacovigilance-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'MHRA · Yellow Card',
    href: 'https://yellowcard.mhra.gov.uk/',
    verifiedAt: '2026-08-16',
  },
] as const

/** @deprecated Prefer getClinicalAuthoritiesForCountry — retained for transitional imports. */
export const CANADA_CLINICAL_AUTHORITIES: readonly ClinicalAuthorityRecord[] =
  AUTHORITY_SEED.filter(a => a.countryIso2 === 'CA')

const COUNTRY_ALIASES: Record<string, string> = {
  CA: 'CA',
  CANADA: 'CA',
  DE: 'DE',
  GERMANY: 'DE',
  AU: 'AU',
  AUSTRALIA: 'AU',
  GB: 'GB',
  UK: 'GB',
  'UNITED KINGDOM': 'GB',
  'UNITED-KINGDOM': 'GB',
}

export function normalizeClinicalCountryIso2(raw: string | null | undefined): string | null {
  const key = raw?.trim().toUpperCase()
  if (!key) return null
  return COUNTRY_ALIASES[key] ?? (key.length === 2 ? key : null)
}

export function clinicalJurisdictionLabel(iso2: string | null): string {
  switch (iso2) {
    case 'CA': return 'Canada'
    case 'DE': return 'Germany'
    case 'AU': return 'Australia'
    case 'GB': return 'United Kingdom'
    default: return iso2 || 'Unknown jurisdiction'
  }
}

/** Parse country from a Command href query string (`country=CA`). */
export function countryIso2FromCommandHref(commandHref: string): string | null {
  const query = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  const raw = new URLSearchParams(query).get('country')?.trim() ?? ''
  return normalizeClinicalCountryIso2(raw)
}

/**
 * Authorities for a country. Returns [] when unknown — callers must show limited-coverage,
 * never fall back to Canada.
 */
export function getClinicalAuthoritiesForCountry(countryIso2: string | null | undefined): readonly ClinicalAuthorityRecord[] {
  const iso = normalizeClinicalCountryIso2(countryIso2 ?? null)
  if (!iso) return []
  return AUTHORITY_SEED.filter(a => a.countryIso2 === iso)
}

export function hasClinicalAuthorityCoverage(countryIso2: string | null | undefined): boolean {
  return getClinicalAuthoritiesForCountry(countryIso2).length > 0
}

const LEGACY_MEDICAL_FRAMEWORK = /\bACMPR\b|Access to Cannabis for Medical Purposes Regulations/i

export function containsLegacyClinicalFramework(value: string | null | undefined): boolean {
  return Boolean(value && LEGACY_MEDICAL_FRAMEWORK.test(value))
}

export function safeClinicalBriefing(value: string | null | undefined): string | null {
  const text = value?.trim()
  if (!text || containsLegacyClinicalFramework(text)) return null
  return text
}

export function deriveClinicalSourceState(input: {
  programStatus?: string | null
  medicalStatus?: string | null
  patientAccess?: string | null
  physicianAccess?: string | null
  error?: boolean
  permissionDenied?: boolean
  noMatch?: boolean
  /** When authority registry has no row for the active country. */
  limitedAuthorityCoverage?: boolean
}): ClinicalSourceState {
  if (input.error) return 'error'
  if (input.permissionDenied) return 'permission'
  if (input.noMatch) return 'no-match'

  const values = [input.programStatus, input.medicalStatus, input.patientAccess, input.physicianAccess]
  if (values.some(containsLegacyClinicalFramework)) return 'stale'
  if (values.every(value => !value?.trim())) {
    return input.limitedAuthorityCoverage ? 'limited-coverage' : 'empty'
  }
  if (values.some(value => !value?.trim())) return 'degraded'
  return 'loaded'
}

export const CLINICAL_SOURCE_STATE_COPY: Record<ClinicalSourceState, string> = {
  loaded:
    'Jurisdiction briefing loaded. Verify material clinical decisions against the cited primary authority. This workspace summarises reviewed cannabinoid / medical-cannabis clinical reference — not general prescribing across all drug classes.',
  empty:
    'No reviewed jurisdiction-specific clinical briefing is loaded. Primary authorities for this jurisdiction remain available below when registered.',
  'no-match':
    'No reviewed clinical record matches this context. Change jurisdiction or query, or use the primary authorities below.',
  stale:
    'Legacy medical-cannabis terminology was detected and suppressed. Use current primary authorities for this jurisdiction.',
  degraded:
    'Only part of the jurisdiction briefing is available. Treat missing fields as unknown and use the primary authorities below.',
  permission:
    'This clinical workspace requires additional permission. Public primary-authority guidance remains available when registered for this jurisdiction.',
  error:
    'Clinical briefing data could not be loaded. Retry the Command context or use the primary authorities below.',
  'limited-coverage':
    'No reviewed primary-authority pack is published for this jurisdiction yet. Clinical Command will not substitute another country’s rules. Use local regulators directly.',
}

export const CLINICAL_SCOPE_NOTICE =
  'Reviewed cannabinoid and medical-cannabis clinical reference. Not a general medicines monograph service. Not patient-specific advice.'
