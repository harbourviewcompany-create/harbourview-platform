export const CLINICAL_EVIDENCE_TYPES = [
  'regulation','regulatory-guidance','clinical-guideline','systematic-review','meta-analysis',
  'randomized-trial','observational-study','pharmacovigilance-signal','product-monograph','other',
] as const
export type ClinicalEvidenceType = typeof CLINICAL_EVIDENCE_TYPES[number]

export const CLINICAL_EVIDENCE_CERTAINTY = ['high','moderate','low','very-low','ungraded','conflicted'] as const
export type ClinicalEvidenceCertainty = typeof CLINICAL_EVIDENCE_CERTAINTY[number]

export const CLINICAL_INTERVENTION_CLASSES = [
  'regulated-cannabinoid-drug','general-cannabis','cannabinoid-isolate',
  'cannabis-derived-formulation','non-cannabis','not-applicable',
] as const
export type ClinicalInterventionClass = typeof CLINICAL_INTERVENTION_CLASSES[number]

export const CLINICAL_EVIDENCE_STATES = [
  'loaded','empty','no-evidence','no-match','stale','conflicted','degraded-source','permission','error',
] as const
export type ClinicalEvidenceState = typeof CLINICAL_EVIDENCE_STATES[number]

export type ClinicalPrimarySourceDTO = { title: string; publisher: string; url: string; sourceId?: string | null }

export type ClinicalEvidenceRecordDTO = {
  id: string; slug: string; title: string; summary: string; condition: string | null; conditionAliases: string[]
  population: string | null; intervention: string | null; formulation: string | null; cannabinoid: string[]
  interventionClass: ClinicalInterventionClass; comparator: string | null; outcome: string | null
  evidenceType: ClinicalEvidenceType; evidenceStrength: ClinicalEvidenceCertainty; evidenceStrengthMethod: string | null
  uncertainty: string | null; conflictStatus: 'none' | 'mixed' | 'material-conflict'; jurisdiction: string[]
  professionRelevance: string[]; primarySource: ClinicalPrimarySourceDTO; publicationDate: string | null
  effectiveDate: string | null; verifiedAt: string; supersessionState: 'current' | 'superseded' | 'partially-superseded'
  supersededById: string | null; reviewStatus: 'published' | 'under-review'; sourceRegistryId?: string | null
  gradingMethodKey?: string | null; publicationScope?: 'source-metadata' | 'clinical-synthesis'
  freshnessStatus?: 'current' | 'stale' | 'review-required' | 'source-degraded'
  reviewDueAt?: string | null; sourceCurrentnessCheckedAt?: string | null; freshnessReason?: string | null
}

export type ClinicalEvidenceChangeEventDTO = {
  id: string; evidenceRecordId: string | null
  eventType: 'published' | 'updated' | 'superseded' | 'conflict-detected' | 'conflict-resolved'
  title: string; summary: string; materiality: 'low' | 'medium' | 'high'; jurisdiction: string[]
  professionRelevance: string[]; occurredAt: string; verifiedAt: string; primarySource: ClinicalPrimarySourceDTO
}

export type ClinicalEvidenceSnapshotContract = {
  id: string; sourceRegistryId: string; snapshotKey: string; sourceUrl: string; sourceVersion: string | null
  retrievedAt: string; mediaType: string; hashScope: 'source-bytes' | 'normalized-reviewed-extract'
  contentSha256: string; byteSize: number | null; locatorManifest: Record<string, unknown>
}

export type ClinicalStructuredExtractionContract = {
  evidenceRecordId: string; sourceSnapshotId: string; population: Record<string, unknown> | null
  intervention: Record<string, unknown> | null; comparator: Record<string, unknown> | null
  outcomes: Array<Record<string, unknown>>; studyDesign: string | null; sampleSize: number | null
  followUp: string | null; effectEstimates: Array<Record<string, unknown>>; uncertainty: Record<string, unknown> | null
  limitations: Array<unknown>; sourceLocator: string | null; verificationStatus: 'pending' | 'verified' | 'rejected'
}

export type ClinicalOutcomeEvidenceContract = {
  conditionId: string; evidenceRecordId: string; sourceSnapshotId: string | null
  interventionLabel: string | null; interventionClass: ClinicalInterventionClass; formulation: string | null
  cannabinoids: string[]; populationSummary: string | null; comparatorSummary: string | null
  outcomeKey: string; outcomeLabel: string
  relationshipKind: 'authorized-indication' | 'efficacy' | 'safety' | 'tolerability' | 'quality-of-life' | 'other'
  direction: 'benefit' | 'harm' | 'no-clear-effect' | 'mixed' | 'not-assessed'
  effectSummary: string | null; uncertaintySummary: string | null
  publicationScope: 'source-metadata' | 'clinical-synthesis'; reviewStatus: 'under-review' | 'published' | 'superseded'
}

export type ClinicalReviewerCredentialContract = {
  id: string; userId: string; profession: 'clinician' | 'pharmacist'; jurisdiction: string
  credentialReference: string; verificationStatus: 'pending' | 'verified' | 'expired' | 'revoked' | 'rejected'
  verifiedAt: string | null; validFrom: string | null; validUntil: string | null; verificationSourceUrl: string
}

export type ClinicalGradeAssessmentContract = {
  evidenceRecordId: string; reviewId: string; gradingMethodKey: string
  startingCertainty: Exclude<ClinicalEvidenceCertainty, 'conflicted'>
  riskOfBias: 'not-assessed' | 'not-serious' | 'serious' | 'very-serious'
  inconsistency: 'not-assessed' | 'not-serious' | 'serious' | 'very-serious'
  indirectness: 'not-assessed' | 'not-serious' | 'serious' | 'very-serious'
  imprecision: 'not-assessed' | 'not-serious' | 'serious' | 'very-serious'
  publicationBias: 'not-assessed' | 'undetected' | 'suspected' | 'strongly-suspected'
  finalCertainty: ClinicalEvidenceCertainty; assessmentRationale: string
}

export type ClinicalConditionEvidenceSynthesisDTO = {
  recordCount: number; currentRecordCount: number; gradedRecordCount: number; ungradedRecordCount: number
  regulatedDrugRecordCount: number; generalCannabisRecordCount: number
  evidenceTypes: Partial<Record<ClinicalEvidenceType, number>>; hasMaterialConflict: boolean
  hasDegradedSource: boolean; lastVerifiedAt: string | null; summary: string
}

export type ClinicalEvidenceSearchResult = {
  state: ClinicalEvidenceState; query: string; records: ClinicalEvidenceRecordDTO[]
  changes: ClinicalEvidenceChangeEventDTO[]; message: string; synthesis?: ClinicalConditionEvidenceSynthesisDTO
}

export function deriveClinicalEvidenceState(input: {
  query: string; records: ClinicalEvidenceRecordDTO[]; knownConditionMatch?: boolean
  error?: boolean; permission?: boolean; degraded?: boolean
}): ClinicalEvidenceState {
  if (input.permission) return 'permission'
  if (input.error) return 'error'
  if (input.records.some(record => record.conflictStatus === 'material-conflict' || record.evidenceStrength === 'conflicted')) return 'conflicted'
  if (input.degraded || input.records.some(record => record.freshnessStatus === 'source-degraded')) return 'degraded-source'
  if (input.records.length > 0 && input.records.every(record => record.supersessionState !== 'current' || record.freshnessStatus === 'stale' || record.freshnessStatus === 'review-required')) return 'stale'
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
    stale: 'Only stale, review-required or superseded evidence matches. Do not treat it as current guidance.',
    conflicted: 'Materially conflicting evidence is present. Inspect the underlying sources before relying on a conclusion.',
    'degraded-source': 'A source required by this evidence set is degraded or has unresolved currentness. Verify the primary source before relying on it.',
    permission: 'Clinical evidence is not available under the current access context.',
    error: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
  }
  return messages[state]
}

export function synthesizeClinicalEvidence(records: ClinicalEvidenceRecordDTO[]): ClinicalConditionEvidenceSynthesisDTO {
  const evidenceTypes: Partial<Record<ClinicalEvidenceType, number>> = {}
  let gradedRecordCount = 0, regulatedDrugRecordCount = 0, generalCannabisRecordCount = 0, currentRecordCount = 0
  let hasMaterialConflict = false, hasDegradedSource = false
  let lastVerifiedAt: string | null = null
  for (const record of records) {
    evidenceTypes[record.evidenceType] = (evidenceTypes[record.evidenceType] ?? 0) + 1
    if (!['ungraded','conflicted'].includes(record.evidenceStrength)) gradedRecordCount += 1
    if (record.interventionClass === 'regulated-cannabinoid-drug') regulatedDrugRecordCount += 1
    if (record.interventionClass === 'general-cannabis') generalCannabisRecordCount += 1
    if (record.supersessionState === 'current' && (record.freshnessStatus ?? 'current') === 'current') currentRecordCount += 1
    if (record.conflictStatus === 'material-conflict' || record.evidenceStrength === 'conflicted') hasMaterialConflict = true
    if (record.freshnessStatus === 'source-degraded') hasDegradedSource = true
    if (!lastVerifiedAt || record.verifiedAt > lastVerifiedAt) lastVerifiedAt = record.verifiedAt
  }
  const ungradedRecordCount = records.length - gradedRecordCount
  const summary = records.length === 0
    ? 'No published evidence records are available for deterministic synthesis.'
    : `${records.length} published source record${records.length === 1 ? '' : 's'}; ${gradedRecordCount} clinically graded and ${ungradedRecordCount} ungraded. This count summary does not infer efficacy or comparative superiority.`
  return { recordCount: records.length, currentRecordCount, gradedRecordCount, ungradedRecordCount,
    regulatedDrugRecordCount, generalCannabisRecordCount, evidenceTypes, hasMaterialConflict, hasDegradedSource, lastVerifiedAt, summary }
}

export type MedicationCannabinoidInteractionContract = {
  id: string; medicationIngredient: string; cannabinoid: string; mechanism: string | null
  clinicalSignificance: 'minor' | 'moderate' | 'major' | 'unknown'; evidenceCertainty: ClinicalEvidenceCertainty
  uncertainty: string | null; monitoringConsideration: string | null; primarySource: ClinicalPrimarySourceDTO; verifiedAt: string
}
export type ProvinceProfessionAuthorizationContract = {
  id: string; jurisdictionCountry: string; jurisdictionRegion: string; profession: string
  capability: 'authorize' | 'prescribe' | 'dispense' | 'monitor' | 'document'; status: 'allowed' | 'restricted' | 'not-allowed' | 'unknown'
  requirementSummary: string; effectiveDate: string | null; primarySource: ClinicalPrimarySourceDTO; verifiedAt: string
}
export type ClinicalMonitoringContract = {
  patientId: string; encounterId: string | null; therapeuticObjective: string; baselineMeasure: string | null
  followUpDueAt: string | null; effectivenessOutcome: string | null; adverseEffects: string[]
  action: 'continue' | 'adjust' | 'stop' | 'refer' | 'undetermined'; evidenceRecordIds: string[]
}
export type ClinicalPharmacovigilanceContract = {
  patientId: string | null; suspectedProduct: string; formulation: string | null; lotNumber: string | null
  concomitantProducts: string[]; eventSummary: string; seriousness: 'serious' | 'non-serious' | 'unknown'
  onsetAt: string | null; reportingJurisdiction: string; reportingSource: ClinicalPrimarySourceDTO
}
