export type ClinicalSourceState =
  | 'loaded'
  | 'empty'
  | 'no-match'
  | 'stale'
  | 'degraded'
  | 'permission'
  | 'error'

export type ClinicalAuthorityRecord = {
  id: 'federal-authority' | 'medical-document' | 'safety-interactions' | 'pharmacovigilance'
  label: string
  purpose: string
  jurisdiction: 'Canada'
  evidenceType: 'regulation' | 'federal-guidance' | 'safety-guidance' | 'pharmacovigilance-guidance'
  evidenceStrength: 'Primary authority — evidence strength not graded by source'
  sourceName: string
  href: string
  verifiedAt: '2026-08-14'
}

export const CANADA_CLINICAL_AUTHORITIES: readonly ClinicalAuthorityRecord[] = [
  {
    id: 'federal-authority',
    label: 'Authorization framework',
    purpose: 'Current federal authority for health care practitioners under the Cannabis Regulations.',
    jurisdiction: 'Canada',
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
    evidenceType: 'pharmacovigilance-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'Health Canada · Report a side effect to cannabis: Health care professionals',
    href: 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/recalls-adverse-reactions-reporting/report-side-effects-cannabis-products/health-care-professionals.html',
    verifiedAt: '2026-08-14',
  },
] as const

/**
 * Primary-authority cards are jurisdiction-bound. Canadian federal law is not a
 * lawful reference for a prescriber working in another jurisdiction, so the deck
 * must resolve by jurisdiction rather than render unconditionally.
 * Control document: docs/control/CLINICAL_FLAGSHIP_SPEC.md (Finding 3).
 */
export function clinicalAuthoritiesForJurisdiction(
  jurisdiction: string | null | undefined,
): readonly ClinicalAuthorityRecord[] {
  return jurisdiction?.trim().toLowerCase() === 'canada' ? CANADA_CLINICAL_AUTHORITIES : []
}

/** Shown in place of the authority deck when no reviewed primary authority exists for the jurisdiction. */
export const CLINICAL_AUTHORITY_ABSENT_COPY =
  'No reviewed primary clinical authority is loaded for this jurisdiction. ' +
  'Harbourview does not substitute another jurisdiction’s law — confirm authorization, ' +
  'documentation and reporting requirements with the applicable national regulator and ' +
  'professional college before prescribing.'

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
}): ClinicalSourceState {
  if (input.error) return 'error'
  if (input.permissionDenied) return 'permission'
  if (input.noMatch) return 'no-match'

  const values = [input.programStatus, input.medicalStatus, input.patientAccess, input.physicianAccess]
  if (values.some(containsLegacyClinicalFramework)) return 'stale'
  if (values.every(value => !value?.trim())) return 'empty'
  if (values.some(value => !value?.trim())) return 'degraded'
  return 'loaded'
}

export const CLINICAL_SOURCE_STATE_COPY: Record<ClinicalSourceState, string> = {
  loaded: 'Jurisdiction briefing loaded. Verify material clinical decisions against the cited primary authority.',
  empty: 'No reviewed jurisdiction-specific clinical briefing is loaded. Primary Canadian authorities remain available below.',
  'no-match': 'No reviewed clinical record matches this context. Change jurisdiction or role, or use the primary authorities below.',
  stale: 'Legacy medical-cannabis terminology was detected and suppressed. Use the current Cannabis Act / Cannabis Regulations sources below.',
  degraded: 'Only part of the jurisdiction briefing is available. Treat missing fields as unknown and use the primary authorities below.',
  permission: 'This clinical workspace requires additional permission. Public primary-authority guidance remains available.',
  error: 'Clinical briefing data could not be loaded. Retry the Command context or use the primary authorities below.',
}
