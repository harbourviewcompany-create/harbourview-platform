import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { isInspectableClinicalSource, type ClinicalStructuredObject, type ClinicalStructuredValue } from '@/lib/clinical/prescriber'
import { searchClinicalInteractions } from '@/lib/server/clinicalInteractionQuery'
import { searchClinicalFormulary } from '@/lib/server/clinicalFormularyQuery'
import { resolveClinicalProfessionalAuthority } from '@/lib/server/clinicalProfessionalAuthority'
import type {
  ClinicalPrescriberWorkspaceDTO,
  ClinicalWorkspaceGuidelineDTO,
  ClinicalWorkspaceMonitoringDTO,
  ClinicalWorkspaceRegimenDTO,
  ClinicalWorkspaceSafetyDTO,
  ClinicalWorkspaceState,
} from '@/lib/clinical/workspace'

type SafetyRow = {
  id: string
  rule_kind: ClinicalWorkspaceSafetyDTO['kind']
  subject: string
  severity: ClinicalWorkspaceSafetyDTO['severity']
  rationale: string
  action_text: string | null
  primary_source_url: string
  source_locator: string
  reviewed_at: string | null
  review_status: string
}

type RegimenRow = {
  id: string
  formulary_product_id: string
  formulary_sku_id: string | null
  jurisdiction: string
  population: string | null
  indication: string
  regimen_structured: unknown
  titration_structured: unknown
  administration_instructions: string[] | null
  monitoring_requirements: string[] | null
  stopping_rules: string[] | null
  primary_source_url: string
  source_locator: string
  source_version: string | null
  review_status: string
}

type MonitoringRow = {
  id: string
  protocol_name: string
  context: string
  cannabinoid: string | null
  jurisdiction: string | null
  monitoring_parameter: string
  baseline_required: boolean
  follow_up_interval: string | null
  rationale: string
  baseline_requirements: string[] | null
  therapeutic_objectives: string[] | null
  efficacy_measures: string[] | null
  safety_measures: string[] | null
  laboratory_monitoring: string[] | null
  reassessment_schedule: string[] | null
  stopping_rules: string[] | null
  primary_source_title: string
  primary_source_url: string | null
  source_locator: string | null
  verified_at: string
  review_status: string
  provenance_status: string
}

type GuidelineRow = {
  id: string
  jurisdiction: string
  authority: string
  title: string
  recommendation_text: string
  recommendation_strength: string | null
  population: string | null
  intervention: string | null
  outcome: string | null
  effective_date: string | null
  primary_source_url: string
  source_locator: string
  status: string
}

function stringArray(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim().length > 0) : []
}

function structuredValue(value: unknown): ClinicalStructuredValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value.map(structuredValue).filter((item): item is ClinicalStructuredValue => item !== undefined)
  }
  if (typeof value === 'object') {
    const output: ClinicalStructuredObject = {}
    for (const [key, child] of Object.entries(value)) {
      const mapped = structuredValue(child)
      if (mapped !== undefined) output[key] = mapped
    }
    return output
  }
  return undefined
}

function structuredObject(value: unknown): ClinicalStructuredObject {
  const mapped = structuredValue(value)
  return mapped && !Array.isArray(mapped) && typeof mapped === 'object' ? mapped as ClinicalStructuredObject : {}
}

function isPermissionMessage(message: string): boolean {
  return /permission|row-level security|42501|not authorized|not authenticated/i.test(message)
}

export async function getClinicalPrescriberWorkspace(input: {
  jurisdiction: string
}): Promise<ClinicalPrescriberWorkspaceDTO> {
  const jurisdiction = input.jurisdiction.trim().toUpperCase()
  if (!/^[A-Z]{2}(?:-[A-Z0-9]{2,3})?$/.test(jurisdiction) || jurisdiction === 'GLOBAL') {
    return {
      state: 'error',
      jurisdiction,
      safety: [],
      regimens: [],
      monitoring: [],
      guidelines: [],
      interactions: [],
      interactionState: 'empty',
      interactionProvenanceRejected: 0,
      formulary: [],
      authority: {
        state: 'unknown',
        verifiedClinician: false,
        jurisdiction,
        professional: null,
        capabilities: { recommend: null, prescribe: null, dispense: null, claimAppropriateness: null },
        evidenceVersion: null,
        effectiveFrom: null,
        effectiveTo: null,
        notes: 'A specific clinical jurisdiction is required.',
      },
      diagnostics: ['clinical_jurisdiction_required'],
    }
  }

  try {
    const supabase = await createClient()
    const [safetyResult, regimenResult, monitoringResult, guidelineResult, interactionResult, formularyResult, authority] = await Promise.all([
      supabase
        .from('clinical_safety_rules')
        .select('id,rule_kind,subject,severity,rationale,action_text,primary_source_url,source_locator,reviewed_at,review_status,jurisdictions')
        .eq('review_status', 'published')
        .overlaps('jurisdictions', [jurisdiction, 'global'])
        .limit(100),
      supabase
        .from('clinical_regimen_protocols')
        .select('id,formulary_product_id,formulary_sku_id,jurisdiction,population,indication,regimen_structured,titration_structured,administration_instructions,monitoring_requirements,stopping_rules,primary_source_url,source_locator,source_version,review_status')
        .eq('review_status', 'published')
        .eq('jurisdiction', jurisdiction)
        .limit(100),
      supabase
        .from('clinical_monitoring_protocols')
        .select('id,protocol_name,context,cannabinoid,jurisdiction,monitoring_parameter,baseline_required,follow_up_interval,rationale,baseline_requirements,therapeutic_objectives,efficacy_measures,safety_measures,laboratory_monitoring,reassessment_schedule,stopping_rules,primary_source_title,primary_source_url,source_locator,verified_at,review_status,provenance_status')
        .eq('review_status', 'published')
        .eq('provenance_status', 'inspectable')
        .or(`jurisdiction.eq.${jurisdiction},jurisdiction.is.null`)
        .limit(100),
      supabase
        .from('clinical_guideline_recommendations')
        .select('id,jurisdiction,authority,title,recommendation_text,recommendation_strength,population,intervention,outcome,effective_date,primary_source_url,source_locator,status')
        .eq('status', 'current')
        .eq('jurisdiction', jurisdiction)
        .limit(100),
      searchClinicalInteractions({ limit: 100 }),
      searchClinicalFormulary({ countryIso2: jurisdiction.slice(0, 2), limit: 100 }),
      resolveClinicalProfessionalAuthority(jurisdiction),
    ])

    const queryErrors = [safetyResult.error, regimenResult.error, monitoringResult.error, guidelineResult.error]
      .filter((error): error is NonNullable<typeof error> => Boolean(error))
    if (queryErrors.length > 0) {
      const message = queryErrors.map((error) => error.message).join('; ')
      const state: ClinicalWorkspaceState = isPermissionMessage(message) ? 'permission' : 'error'
      return {
        state,
        jurisdiction,
        safety: [],
        regimens: [],
        monitoring: [],
        guidelines: [],
        interactions: interactionResult.interactions,
        interactionState: interactionResult.state,
        interactionProvenanceRejected: interactionResult.rejectedForProvenance,
        formulary: formularyResult.products,
        authority,
        diagnostics: [message],
      }
    }

    const safety: ClinicalWorkspaceSafetyDTO[] = ((safetyResult.data ?? []) as SafetyRow[])
      .filter((row) => isInspectableClinicalSource(row.primary_source_url) && Boolean(row.source_locator?.trim()))
      .map((row) => ({
        id: row.id,
        kind: row.rule_kind,
        subject: row.subject,
        severity: row.severity,
        rationale: row.rationale,
        actionText: row.action_text,
        primarySourceUrl: row.primary_source_url,
        sourceLocator: row.source_locator,
        reviewedAt: row.reviewed_at,
      }))

    const regimens: ClinicalWorkspaceRegimenDTO[] = ((regimenResult.data ?? []) as RegimenRow[])
      .filter((row) => isInspectableClinicalSource(row.primary_source_url) && Boolean(row.source_locator?.trim()))
      .map((row) => ({
        id: row.id,
        formularyProductId: row.formulary_product_id,
        formularySkuId: row.formulary_sku_id,
        jurisdiction: row.jurisdiction,
        population: row.population,
        indication: row.indication,
        regimenStructured: structuredObject(row.regimen_structured),
        titrationStructured: structuredObject(row.titration_structured),
        administrationInstructions: stringArray(row.administration_instructions),
        monitoringRequirements: stringArray(row.monitoring_requirements),
        stoppingRules: stringArray(row.stopping_rules),
        primarySourceUrl: row.primary_source_url,
        sourceLocator: row.source_locator,
        sourceVersion: row.source_version,
      }))

    const monitoring: ClinicalWorkspaceMonitoringDTO[] = ((monitoringResult.data ?? []) as MonitoringRow[])
      .filter((row) => isInspectableClinicalSource(row.primary_source_url) && Boolean(row.source_locator?.trim()))
      .map((row) => {
        const baseline = stringArray(row.baseline_requirements)
        if (baseline.length === 0 && row.baseline_required) baseline.push(row.monitoring_parameter)
        const reassessment = stringArray(row.reassessment_schedule)
        if (reassessment.length === 0 && row.follow_up_interval) reassessment.push(row.follow_up_interval)
        const safetyMeasures = stringArray(row.safety_measures)
        if (safetyMeasures.length === 0 && row.rationale) safetyMeasures.push(row.rationale)
        return {
          id: row.id,
          protocolName: row.protocol_name,
          context: row.context,
          cannabinoid: row.cannabinoid,
          jurisdiction: row.jurisdiction,
          baselineRequirements: baseline,
          therapeuticObjectives: stringArray(row.therapeutic_objectives),
          efficacyMeasures: stringArray(row.efficacy_measures),
          safetyMeasures,
          laboratoryMonitoring: stringArray(row.laboratory_monitoring),
          reassessmentSchedule: reassessment,
          stoppingRules: stringArray(row.stopping_rules),
          primarySourceTitle: row.primary_source_title,
          primarySourceUrl: row.primary_source_url as string,
          sourceLocator: row.source_locator as string,
          verifiedAt: row.verified_at,
        }
      })

    const guidelines: ClinicalWorkspaceGuidelineDTO[] = ((guidelineResult.data ?? []) as GuidelineRow[])
      .filter((row) => isInspectableClinicalSource(row.primary_source_url) && Boolean(row.source_locator?.trim()))
      .map((row) => ({
        id: row.id,
        jurisdiction: row.jurisdiction,
        authority: row.authority,
        title: row.title,
        recommendationText: row.recommendation_text,
        recommendationStrength: row.recommendation_strength,
        population: row.population,
        intervention: row.intervention,
        outcome: row.outcome,
        effectiveDate: row.effective_date,
        primarySourceUrl: row.primary_source_url,
        sourceLocator: row.source_locator,
      }))

    const diagnostics: string[] = []
    if (interactionResult.state === 'review-required' || interactionResult.rejectedForProvenance > 0) {
      diagnostics.push(`${interactionResult.rejectedForProvenance} interaction record(s) withheld pending inspectable provenance.`)
    }
    if (interactionResult.state === 'error') diagnostics.push(interactionResult.error ?? 'Interaction source unavailable.')
    if (formularyResult.state === 'error') diagnostics.push(formularyResult.error ?? 'Formulary source unavailable.')
    if (authority.state === 'error' && authority.error) diagnostics.push(authority.error)

    const hasData = safety.length || regimens.length || monitoring.length || guidelines.length || interactionResult.interactions.length || formularyResult.products.length
    const needsReview = interactionResult.state === 'review-required' || diagnostics.some((item) => /withheld|review/i.test(item))
    const state: ClinicalWorkspaceState = authority.state === 'permission'
      ? 'permission'
      : hasData
        ? needsReview ? 'review-required' : 'loaded'
        : needsReview ? 'review-required' : 'empty'

    return {
      state,
      jurisdiction,
      safety,
      regimens,
      monitoring,
      guidelines,
      interactions: interactionResult.interactions,
      interactionState: interactionResult.state,
      interactionProvenanceRejected: interactionResult.rejectedForProvenance,
      formulary: formularyResult.products,
      authority,
      diagnostics,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clinical workspace query failed'
    return {
      state: isPermissionMessage(message) ? 'permission' : 'error',
      jurisdiction,
      safety: [],
      regimens: [],
      monitoring: [],
      guidelines: [],
      interactions: [],
      interactionState: 'error',
      interactionProvenanceRejected: 0,
      formulary: [],
      authority: {
        state: isPermissionMessage(message) ? 'permission' : 'error',
        verifiedClinician: false,
        jurisdiction,
        professional: null,
        capabilities: { recommend: null, prescribe: null, dispense: null, claimAppropriateness: null },
        evidenceVersion: null,
        effectiveFrom: null,
        effectiveTo: null,
        notes: null,
        error: message,
      },
      diagnostics: [message],
    }
  }
}
