import {
  CLINICAL_AUTHORITY_SEED,
  CLINICAL_COUNTRY_ALIASES,
  CLINICAL_JURISDICTION_LABELS,
  getClinicalAuthoritiesForCountry as getAuthorities,
  listClinicalAuthorityCountries,
  type ClinicalAuthorityRecord,
} from '@/lib/clinical/authorityRegistry'

export type { ClinicalAuthorityRecord, ClinicalAuthorityId } from '@/lib/clinical/authorityRegistry'
export { listClinicalAuthorityCountries }

export type ClinicalSourceState =
  | 'loaded'
  | 'empty'
  | 'no-match'
  | 'stale'
  | 'degraded'
  | 'permission'
  | 'error'
  | 'limited-coverage'

/** @deprecated Prefer getClinicalAuthoritiesForCountry */
export const CANADA_CLINICAL_AUTHORITIES: readonly ClinicalAuthorityRecord[] =
  CLINICAL_AUTHORITY_SEED.filter(a => a.countryIso2 === 'CA')

export function normalizeClinicalCountryIso2(raw: string | null | undefined): string | null {
  const key = raw?.trim().toUpperCase()
  if (!key) return null
  return CLINICAL_COUNTRY_ALIASES[key] ?? (key.length === 2 ? key : null)
}

export function clinicalJurisdictionLabel(iso2: string | null): string {
  if (!iso2) return 'Unknown jurisdiction'
  return CLINICAL_JURISDICTION_LABELS[iso2] ?? iso2
}

export function countryIso2FromCommandHref(commandHref: string): string | null {
  const query = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  const raw = new URLSearchParams(query).get('country')?.trim() ?? ''
  return normalizeClinicalCountryIso2(raw)
}

export function getClinicalAuthoritiesForCountry(countryIso2: string | null | undefined): readonly ClinicalAuthorityRecord[] {
  return getAuthorities(countryIso2)
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
    'Jurisdiction briefing loaded. Verify material clinical decisions against the cited primary authority for this country. Cannabinoid / medical-cannabis clinical reference only — not general prescribing across all drug classes.',
  empty:
    'No reviewed jurisdiction-specific clinical briefing is loaded. Primary authorities for this country remain available below when registered.',
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
  'Reviewed cannabinoid and medical-cannabis clinical reference for the active country. Not a general medicines monograph service. Not patient-specific advice.'
