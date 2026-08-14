export const CLINICAL_EVIDENCE_TYPES = [
  'regulation',
  'regulatory-guidance',
  'clinical-guideline',
  'systematic-review',
  'meta-analysis',
  'randomized-trial',
  'observational-study',
  'pharmacovigilance-signal',
  'product-monograph',
  'other',
] as const
export type ClinicalEvidenceType = typeof CLINICAL_EVIDENCE_TYPES[number]

export const CLINICAL_EVIDENCE_CERTAINTY = [
  'high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted',
] as const
export type ClinicalEvidenceCertainty = typeof CLINICAL_EVIDENCE_CERTAINTY[number]

export const CLINICAL_INTERVENTION_CLASSES = [
  'regulated-cannabinoid-drug',
  'general-cannabis',
  'cannabinoid-isolate',
  'cannabis-derived-formulation',
  'non-cannabis',
  'not-applicable',
] as const
export type ClinicalInterventionClass = typeof CLINICAL_INTERVENTION_CLASSES[number]

export const CLINICAL_EVIDENCE_STATES = [
  'loaded', 'empty', 'no-evidence', 'no-match', 'stale', 'conflicted', 'error',
] as const
export type ClinicalEvidenceState = typeof CLINICAL_EVIDENCE_STATES[number]

export type ClinicalPrimarySourceDTO = {
  title: string
  publisher: string
  url: string
  sourceId?: string | null
}

export type ClinicalEvidenceRecordDTO = {
  id: string
  slug: string
  title: string
  summary: string
  condition: string | null
  conditionAliases: string[]
  population: string | null
  intervention: string | null
  formulation: string | null
  cannabinoid: string[]
  interventionClass: ClinicalInterventionClass
  comparator: string | null
  outcome: string | null
  evidenceType: ClinicalEvidenceType
  evidenceStrength: ClinicalEvidenceCertainty
  evidenceStrengthMethod: string | null
  uncertainty: string | null
  conflictStatus: 'none' | 'mixed' | 'material-conflict'
  jurisdiction: string[]
  professionRelevance: string[]
  primarySource: ClinicalPrimarySourceDTO
  publicationDate: string | null
  effectiveDate: string | null
  verifiedAt: string
  supersessionState: 'current' | 'superseded' | 'partially-superseded'
  supersededById: string | null
  reviewStatus: 'published' | 'under-review'
}

export type ClinicalEvidenceChangeEventDTO = {
  id: string
  evidenceRecordId: string | null
  eventType: 'published' | 'updated' | 'superseded' | 'conflict-detected' | 'conflict-resolved'
  title: string
  summary: string
  materiality: 'low' | 'medium' | 'high'
  jurisdiction: string[]
  professionRelevance: string[]
  occurredAt: string
  verifiedAt: string
  primarySource: ClinicalPrimarySourceDTO
}

export type ClinicalEvidenceSearchResult = {
  state: ClinicalEvidenceState
  query: string
  records: ClinicalEvidenceRecordDTO[]
  changes: ClinicalEvidenceChangeEventDTO[]
  message: string
}

export function deriveClinicalEvidenceState(input: {
  query: string
  records: ClinicalEvidenceRecordDTO[]
  knownConditionMatch?: boolean
  error?: boolean
}): ClinicalEvidenceState {
  if (input.error) return 'error'
  if (input.records.some(record => record.conflictStatus === 'material-conflict' || record.evidenceStrength === 'conflicted')) return 'conflicted'
  if (input.records.length > 0 && input.records.every(record => record.supersessionState !== 'current')) return 'stale'
  if (input.records.length > 0) return 'loaded'
  if (!input.query.trim()) return 'empty'
  return input.knownConditionMatch ? 'no-evidence' : 'no-match'
}

export function clinicalEvidenceStateMessage(state: ClinicalEvidenceState): string {
  const messages: Record<ClinicalEvidenceState, string> = {
    loaded: 'Reviewed evidence records match this clinical question.',
    empty: 'Enter a condition or clinical question to search reviewed evidence.',
    'no-evidence': 'The condition is recognized, but no reviewed evidence record is available in this evidence spine.',
    'no-match': 'No reviewed condition or evidence record matches this search.',
    stale: 'Only superseded evidence records match. Do not use them as current guidance.',
    conflicted: 'Materially conflicting evidence is present. Inspect the underlying sources before relying on a conclusion.',
    error: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
  }
  return messages[state]
}

export type MedicationCannabinoidInteractionContract = {
  id: string
  medicationIngredient: string
  cannabinoid: string
  mechanism: string | null
  clinicalSignificance: 'minor' | 'moderate' | 'major' | 'unknown'
  evidenceCertainty: ClinicalEvidenceCertainty
  uncertainty: string | null
  monitoringConsideration: string | null
  primarySource: ClinicalPrimarySourceDTO
  verifiedAt: string
}

export type ProvinceProfessionAuthorizationContract = {
  id: string
  jurisdictionCountry: string
  jurisdictionRegion: string
  profession: string
  capability: 'authorize' | 'prescribe' | 'dispense' | 'monitor' | 'document'
  status: 'allowed' | 'restricted' | 'not-allowed' | 'unknown'
  requirementSummary: string
  effectiveDate: string | null
  primarySource: ClinicalPrimarySourceDTO
  verifiedAt: string
}

export type ClinicalMonitoringContract = {
  patientId: string
  encounterId: string | null
  therapeuticObjective: string
  baselineMeasure: string | null
  followUpDueAt: string | null
  effectivenessOutcome: string | null
  adverseEffects: string[]
  action: 'continue' | 'adjust' | 'stop' | 'refer' | 'undetermined'
  evidenceRecordIds: string[]
}

export type ClinicalPharmacovigilanceContract = {
  patientId: string | null
  suspectedProduct: string
  formulation: string | null
  lotNumber: string | null
  concomitantProducts: string[]
  eventSummary: string
  seriousness: 'serious' | 'non-serious' | 'unknown'
  onsetAt: string | null
  reportingJurisdiction: string
  reportingSource: ClinicalPrimarySourceDTO
}
