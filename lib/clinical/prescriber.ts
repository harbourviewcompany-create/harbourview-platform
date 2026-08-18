import type { ClinicalEvidenceRecordDTO } from '@/lib/clinical/evidence'

/**
 * Prescriber Operating System contracts.
 *
 * These contracts intentionally sit on top of the existing governed evidence,
 * formulary, patient, consent and professional-verification models. They do not
 * create a second evidence store or make autonomous treatment recommendations.
 */

export type ClinicalSourceState =
  | 'loaded'
  | 'empty'
  | 'no-match'
  | 'stale'
  | 'conflicting'
  | 'superseded'
  | 'permission'
  | 'error'
  | 'review-required'

export type PrescriberWorkspaceTab =
  | 'decision'
  | 'evidence'
  | 'safety'
  | 'products'
  | 'regimen'
  | 'monitoring'
  | 'guidelines'
  | 'documentation'
  | 'history'

export type ClinicalConceptKind =
  | 'condition'
  | 'symptom'
  | 'population'
  | 'intervention'
  | 'product'
  | 'medicine'
  | 'outcome'

export type ClinicalConcept = {
  id: string
  canonicalLabel: string
  kind: ClinicalConceptKind
  aliases: string[]
  codingSystem?: string | null
  code?: string | null
  status: 'active' | 'superseded' | 'retired'
  supersededById?: string | null
}

export type PicoContext = {
  population: string | null
  intervention: string | null
  comparator: string | null
  outcome: string | null
  timeframe: string | null
}

export type ClinicalEffectEstimate = {
  measure: string
  value: number | null
  unit: string | null
  ciLower: number | null
  ciUpper: number | null
  absoluteEffect: string | null
  relativeEffect: string | null
  clinicallyImportantDifference: string | null
}

export type ClinicalEvidenceClaim = {
  id: string
  evidenceRecordId: string
  conceptId: string | null
  claimText: string
  pico: PicoContext
  effect: ClinicalEffectEstimate | null
  direction: 'benefit' | 'harm' | 'neutral' | 'uncertain'
  certainty: 'high' | 'moderate' | 'low' | 'very-low' | 'ungraded' | 'conflicted'
  applicability: string | null
  publicationFamilyId: string | null
  independenceGroupId: string | null
  status: 'current' | 'superseded' | 'retracted' | 'review-required'
  supersededById: string | null
  primarySourceUrl: string
  sourceLocator: string | null
  reviewedAt: string
  reviewedBy: string | null
}

export type ClinicalSafetyRule = {
  id: string
  kind: 'contraindication' | 'precaution' | 'special-population' | 'interaction'
  subject: string
  appliesWhen: Record<string, unknown>
  severity: 'info' | 'caution' | 'major' | 'contraindicated' | 'unknown'
  rationale: string
  actionText: string | null
  evidenceRecordId: string | null
  primarySourceUrl: string
  sourceLocator: string | null
  status: 'published' | 'review-required' | 'retired'
  reviewedAt: string
}

export type MedicinalProductStatus =
  | 'approved-pharmaceutical'
  | 'registered-medicine'
  | 'regulated-medical-cannabis'
  | 'special-access-unapproved'
  | 'general-cannabis'
  | 'unknown'

export type MedicinalProduct = {
  id: string
  formularyProductId: string | null
  jurisdiction: string
  name: string
  brandName: string | null
  activeIngredients: string[]
  composition: Record<string, string | number | null>
  dosageForm: string | null
  route: string | null
  strengthLabel: string | null
  authorizationStatus: MedicinalProductStatus
  authorizationNumber: string | null
  manufacturerOrSponsor: string | null
  primarySourceUrl: string
  sourceUpdatedAt: string | null
  reviewStatus: 'published' | 'review-required' | 'retired'
}

export type RegimenProtocol = {
  id: string
  productId: string
  conceptId: string | null
  jurisdiction: string
  population: string | null
  indication: string
  regimenStructured: Record<string, unknown>
  titrationStructured: Record<string, unknown>
  administrationInstructions: string[]
  monitoringRequirements: string[]
  stoppingRules: string[]
  primarySourceUrl: string
  sourceLocator: string | null
  sourceVersion: string | null
  reviewStatus: 'published' | 'review-required' | 'retired'
  reviewedAt: string | null
  reviewedBy: string | null
}

export type MonitoringProtocol = {
  id: string
  conceptId: string | null
  productId: string | null
  jurisdiction: string | null
  baselineRequirements: string[]
  therapeuticObjectives: string[]
  efficacyMeasures: string[]
  safetyMeasures: string[]
  laboratoryMonitoring: string[]
  reassessmentSchedule: string[]
  stoppingRules: string[]
  primarySourceUrl: string
  sourceLocator: string | null
  reviewStatus: 'published' | 'review-required' | 'retired'
}

export type GuidelineRecommendation = {
  id: string
  conceptId: string | null
  jurisdiction: string
  authority: string
  title: string
  recommendationText: string
  recommendationStrength: string | null
  population: string | null
  intervention: string | null
  outcome: string | null
  effectiveDate: string | null
  primarySourceUrl: string
  sourceLocator: string | null
  status: 'current' | 'superseded' | 'review-required'
}

export type PatientClinicalContext = {
  patientId: string
  encounterId: string | null
  jurisdiction: string
  conditionConceptIds: string[]
  currentMedicines: string[]
  priorTherapies: string[]
  allergies: string[]
  pregnancyStatus: 'yes' | 'no' | 'unknown' | 'not-applicable'
  hepaticStatus: 'none-known' | 'present' | 'unknown'
  renalStatus: 'none-known' | 'present' | 'unknown'
  cardiovascularStatus: 'none-known' | 'present' | 'unknown'
  psychiatricRiskStatus: 'none-known' | 'present' | 'unknown'
  substanceUseRiskStatus: 'none-known' | 'present' | 'unknown'
  drivingOrSafetySensitiveActivity: 'yes' | 'no' | 'unknown'
  updatedAt: string
}

export type TherapeuticObjective = {
  id: string
  patientId: string
  encounterId: string | null
  conceptId: string | null
  description: string
  outcomeMeasure: string | null
  baselineValue: string | null
  targetValue: string | null
  targetDate: string | null
  status: 'active' | 'met' | 'not-met' | 'stopped'
}

export type ClinicalDecisionRecord = {
  id: string
  patientId: string
  encounterId: string | null
  clinicianUserId: string
  jurisdiction: string
  decisionType: 'consider' | 'initiate' | 'continue' | 'adjust' | 'stop' | 'defer'
  rationale: string
  evidenceClaimIds: string[]
  productIds: string[]
  guidelineRecommendationIds: string[]
  unresolvedSafetyItems: string[]
  sharedDecisionSummary: string | null
  createdAt: string
}

export type ClinicalChangeEvent = {
  id: string
  eventType: 'evidence' | 'guideline' | 'safety' | 'product' | 'regulatory' | 'professional-rule'
  title: string
  summary: string
  jurisdiction: string[]
  affectedConceptIds: string[]
  affectedProductIds: string[]
  materiality: 'informational' | 'review' | 'urgent'
  primarySourceUrl: string
  effectiveAt: string | null
  verifiedAt: string
}

export type PatientImpactReview = {
  id: string
  patientId: string
  changeEventId: string
  matchReasons: string[]
  status: 'unreviewed' | 'reviewed-no-action' | 'reviewed-action-needed' | 'dismissed'
  reviewedAt: string | null
  reviewedBy: string | null
}

export type ReadinessDimension = {
  key: 'context' | 'evidence' | 'authority' | 'product' | 'safety' | 'monitoring' | 'consent'
  label: string
  state: 'ready' | 'attention' | 'blocked' | 'unknown'
  explanation: string
  inspectHref?: string
}

export type PrescriberReadiness = {
  state: 'ready-for-clinician-review' | 'needs-attention' | 'blocked' | 'insufficient-information'
  dimensions: ReadinessDimension[]
}

export type AskClinicalCitation = {
  evidenceRecordId: string
  title: string
  sourceTitle: string
  sourceUrl: string
  verifiedAt: string
  evidenceStrength: string
  supersessionState: string
  conflictStatus: string
}

export type AskClinicalResponse = {
  state: ClinicalSourceState
  question: string
  answer: string
  citations: AskClinicalCitation[]
  unresolved: string[]
}

const NON_INSPECTABLE_SOURCE_URLS = new Set([
  'https://pubmed.ncbi.nlm.nih.gov/',
  'https://www.gov.br/anvisa',
])

/**
 * A prescriber-facing material claim must resolve to a specific inspectable
 * source, not a search landing page or generic regulator homepage.
 */
export function isInspectableClinicalSource(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (NON_INSPECTABLE_SOURCE_URLS.has(parsed.toString())) return false
    return parsed.pathname !== '/' || parsed.search.length > 0
  } catch {
    return false
  }
}

export function normaliseClinicalConceptTerm(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9:+\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function evidenceRecordIsPrescriberInspectable(record: ClinicalEvidenceRecordDTO): boolean {
  return (
    record.reviewStatus === 'published' &&
    record.supersessionState === 'current' &&
    record.publicationScope === 'clinical-synthesis' &&
    isInspectableClinicalSource(record.primarySource?.url)
  )
}

export function buildAskClinicalResponse(question: string, records: ClinicalEvidenceRecordDTO[]): AskClinicalResponse {
  const eligible = records.filter(evidenceRecordIsPrescriberInspectable)
  const conflicts = eligible.filter((record) => record.conflictStatus === 'material-conflict')
  const stale = eligible.filter((record) => ['stale', 'review-required', 'source-degraded'].includes(record.freshnessStatus ?? 'current'))

  if (!question.trim()) {
    return {
      state: 'empty',
      question,
      answer: 'Enter a clinical question to retrieve governed evidence.',
      citations: [],
      unresolved: [],
    }
  }

  if (eligible.length === 0) {
    return {
      state: records.length > 0 ? 'review-required' : 'no-match',
      question,
      answer: records.length > 0
        ? 'Records were found, but none meet the prescriber-inspectable provenance and review contract.'
        : 'No governed evidence matched this question.',
      citations: [],
      unresolved: ['No prescriber-inspectable governed evidence is available for this question.'],
    }
  }

  const summaries = eligible.slice(0, 5).map((record) => record.summary.trim()).filter(Boolean)
  const answer = summaries.join(' ') || 'Governed records matched, but no reviewed summary is available.'

  return {
    state: conflicts.length > 0 ? 'conflicting' : stale.length > 0 ? 'stale' : 'loaded',
    question,
    answer,
    citations: eligible.slice(0, 10).map((record) => ({
      evidenceRecordId: record.id,
      title: record.title,
      sourceTitle: record.primarySource.title,
      sourceUrl: record.primarySource.url,
      verifiedAt: record.verifiedAt,
      evidenceStrength: record.evidenceStrength,
      supersessionState: record.supersessionState,
      conflictStatus: record.conflictStatus,
    })),
    unresolved: [
      ...(conflicts.length ? ['Conflicting governed evidence is present and requires clinician review.'] : []),
      ...(stale.length ? ['One or more sources require a currentness review.'] : []),
    ],
  }
}

export function derivePrescriberReadiness(input: {
  hasClinicalContext: boolean
  hasInspectableEvidence: boolean
  authorityKnown: boolean
  authorityAllowsAction: boolean
  productResolved: boolean
  unresolvedMajorSafetyItems: number
  monitoringDefined: boolean
  consentConfirmed: boolean
}): PrescriberReadiness {
  const dimensions: ReadinessDimension[] = [
    {
      key: 'context',
      label: 'Clinical context',
      state: input.hasClinicalContext ? 'ready' : 'unknown',
      explanation: input.hasClinicalContext ? 'Clinical context is available.' : 'Condition, population and treatment objective are incomplete.',
    },
    {
      key: 'evidence',
      label: 'Evidence',
      state: input.hasInspectableEvidence ? 'ready' : 'unknown',
      explanation: input.hasInspectableEvidence ? 'Governed, inspectable evidence is available.' : 'No prescriber-inspectable evidence is available for this context.',
    },
    {
      key: 'authority',
      label: 'Professional authority',
      state: !input.authorityKnown ? 'unknown' : input.authorityAllowsAction ? 'ready' : 'blocked',
      explanation: !input.authorityKnown ? 'Professional authority has not been resolved.' : input.authorityAllowsAction ? 'Current authority contract allows the requested action.' : 'Current authority contract does not allow the requested action.',
    },
    {
      key: 'product',
      label: 'Product / formulation',
      state: input.productResolved ? 'ready' : 'unknown',
      explanation: input.productResolved ? 'A governed product/formulation record is resolved.' : 'No governed product/formulation has been resolved.',
    },
    {
      key: 'safety',
      label: 'Safety',
      state: input.unresolvedMajorSafetyItems > 0 ? 'blocked' : 'attention',
      explanation: input.unresolvedMajorSafetyItems > 0
        ? `${input.unresolvedMajorSafetyItems} major or contraindicated safety item(s) require review.`
        : 'Safety review remains a clinician responsibility even when no major item is loaded.',
    },
    {
      key: 'monitoring',
      label: 'Monitoring',
      state: input.monitoringDefined ? 'ready' : 'unknown',
      explanation: input.monitoringDefined ? 'Monitoring and stopping criteria are defined.' : 'Monitoring and stopping criteria are not yet defined.',
    },
    {
      key: 'consent',
      label: 'Consent',
      state: input.consentConfirmed ? 'ready' : 'blocked',
      explanation: input.consentConfirmed ? 'Required consent is recorded.' : 'Required clinical consent has not been confirmed.',
    },
  ]

  const hasBlocked = dimensions.some((dimension) => dimension.state === 'blocked')
  const hasUnknown = dimensions.some((dimension) => dimension.state === 'unknown')
  const allReadyOrAttention = dimensions.every((dimension) => dimension.state === 'ready' || dimension.state === 'attention')

  return {
    state: hasBlocked
      ? 'blocked'
      : hasUnknown
        ? 'insufficient-information'
        : allReadyOrAttention
          ? 'ready-for-clinician-review'
          : 'needs-attention',
    dimensions,
  }
}
