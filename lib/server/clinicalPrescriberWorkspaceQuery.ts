import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type ClinicalWorkspaceSafetyRow = {
  id: string
  kind: string
  subject: string
  severity: string
  rationale: string
  actionText: string | null
  primarySourceUrl: string
  sourceLocator: string | null
}

export type ClinicalWorkspaceRegimenRow = {
  id: string
  formularyProductId: string | null
  formularySkuId: string | null
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
}

export type ClinicalWorkspaceMonitoringRow = {
  id: string
  formularyProductId: string | null
  formularySkuId: string | null
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
}

export type ClinicalWorkspaceGuidelineRow = {
  id: string
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
}

export type ClinicalPrescriberWorkspaceResult = {
  state: 'loaded' | 'empty' | 'permission' | 'error'
  safety: ClinicalWorkspaceSafetyRow[]
  regimens: ClinicalWorkspaceRegimenRow[]
  monitoring: ClinicalWorkspaceMonitoringRow[]
  guidelines: ClinicalWorkspaceGuidelineRow[]
  error?: string
}

type Row = Record<string, unknown>

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function isPermissionMessage(message: string): boolean {
  return /permission|row-level security|42501|not authorized|not authenticated/i.test(message)
}

export async function getClinicalPrescriberWorkspace(input: {
  jurisdiction: string
}): Promise<ClinicalPrescriberWorkspaceResult> {
  try {
    const supabase = await createClient()
    const jurisdiction = input.jurisdiction.toUpperCase()

    const [safetyResult, regimenResult, monitoringResult, guidelineResult] = await Promise.all([
      supabase
        .from('clinical_safety_rules')
        .select('id,rule_kind,subject,severity,rationale,action_text,primary_source_url,source_locator,jurisdictions,review_status')
        .eq('review_status', 'published')
        .contains('jurisdictions', [jurisdiction])
        .limit(100),
      supabase
        .from('clinical_regimen_protocols')
        .select('id,formulary_product_id,formulary_sku_id,jurisdiction,population,indication,regimen_structured,titration_structured,administration_instructions,monitoring_requirements,stopping_rules,primary_source_url,source_locator,source_version,review_status')
        .eq('review_status', 'published')
        .eq('jurisdiction', jurisdiction)
        .limit(100),
      supabase
        .from('clinical_monitoring_protocols')
        .select('id,formulary_product_id,formulary_sku_id,jurisdiction,baseline_requirements,therapeutic_objectives,efficacy_measures,safety_measures,laboratory_monitoring,reassessment_schedule,stopping_rules,primary_source_url,source_locator,review_status')
        .eq('review_status', 'published')
        .or(`jurisdiction.eq.${jurisdiction},jurisdiction.is.null`)
        .limit(100),
      supabase
        .from('clinical_guideline_recommendations')
        .select('id,jurisdiction,authority,title,recommendation_text,recommendation_strength,population,intervention,outcome,effective_date,primary_source_url,source_locator,status')
        .eq('status', 'current')
        .eq('jurisdiction', jurisdiction)
        .limit(100),
    ])

    const errors = [safetyResult.error, regimenResult.error, monitoringResult.error, guidelineResult.error].filter(Boolean)
    if (errors.length) {
      const message = errors.map((error) => error?.message ?? '').join('; ')
      return {
        state: isPermissionMessage(message) ? 'permission' : 'error',
        safety: [],
        regimens: [],
        monitoring: [],
        guidelines: [],
        error: message,
      }
    }

    const safety: ClinicalWorkspaceSafetyRow[] = (safetyResult.data ?? []).map((raw) => {
      const row = raw as Row
      return {
        id: String(row.id),
        kind: String(row.rule_kind),
        subject: String(row.subject),
        severity: String(row.severity),
        rationale: String(row.rationale),
        actionText: text(row.action_text),
        primarySourceUrl: String(row.primary_source_url),
        sourceLocator: text(row.source_locator),
      }
    })

    const regimens: ClinicalWorkspaceRegimenRow[] = (regimenResult.data ?? []).map((raw) => {
      const row = raw as Row
      return {
        id: String(row.id),
        formularyProductId: text(row.formulary_product_id),
        formularySkuId: text(row.formulary_sku_id),
        jurisdiction: String(row.jurisdiction),
        population: text(row.population),
        indication: String(row.indication),
        regimenStructured: object(row.regimen_structured),
        titrationStructured: object(row.titration_structured),
        administrationInstructions: strings(row.administration_instructions),
        monitoringRequirements: strings(row.monitoring_requirements),
        stoppingRules: strings(row.stopping_rules),
        primarySourceUrl: String(row.primary_source_url),
        sourceLocator: text(row.source_locator),
        sourceVersion: text(row.source_version),
      }
    })

    const monitoring: ClinicalWorkspaceMonitoringRow[] = (monitoringResult.data ?? []).map((raw) => {
      const row = raw as Row
      return {
        id: String(row.id),
        formularyProductId: text(row.formulary_product_id),
        formularySkuId: text(row.formulary_sku_id),
        jurisdiction: text(row.jurisdiction),
        baselineRequirements: strings(row.baseline_requirements),
        therapeuticObjectives: strings(row.therapeutic_objectives),
        efficacyMeasures: strings(row.efficacy_measures),
        safetyMeasures: strings(row.safety_measures),
        laboratoryMonitoring: strings(row.laboratory_monitoring),
        reassessmentSchedule: strings(row.reassessment_schedule),
        stoppingRules: strings(row.stopping_rules),
        primarySourceUrl: String(row.primary_source_url),
        sourceLocator: text(row.source_locator),
      }
    })

    const guidelines: ClinicalWorkspaceGuidelineRow[] = (guidelineResult.data ?? []).map((raw) => {
      const row = raw as Row
      return {
        id: String(row.id),
        jurisdiction: String(row.jurisdiction),
        authority: String(row.authority),
        title: String(row.title),
        recommendationText: String(row.recommendation_text),
        recommendationStrength: text(row.recommendation_strength),
        population: text(row.population),
        intervention: text(row.intervention),
        outcome: text(row.outcome),
        effectiveDate: text(row.effective_date),
        primarySourceUrl: String(row.primary_source_url),
        sourceLocator: text(row.source_locator),
      }
    })

    return {
      state: safety.length || regimens.length || monitoring.length || guidelines.length ? 'loaded' : 'empty',
      safety,
      regimens,
      monitoring,
      guidelines,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clinical workspace query failed'
    return {
      state: isPermissionMessage(message) ? 'permission' : 'error',
      safety: [],
      regimens: [],
      monitoring: [],
      guidelines: [],
      error: message,
    }
  }
}
