/**
 * Global clinical authority registry for medical-cannabis prescribing markets.
 * Links only — not clinical claims. Never fall back across countries.
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

export { CLINICAL_AUTHORITY_SEED, CLINICAL_COUNTRY_ALIASES, CLINICAL_JURISDICTION_LABELS, listClinicalAuthorityCountries, getClinicalAuthoritiesForCountry } from './authorityRegistry.data'
