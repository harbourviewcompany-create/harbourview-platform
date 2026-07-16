import 'server-only'
import {
  fetchAdminSupabaseJson,
  type AdminDataResult,
} from '@/lib/supabase/adminDataClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RegulatoryPathway = {
  id: string
  country_id: string | null
  iso_alpha2: string
  slug: string
  name: string
  pathway_type: string
  legal_basis: string | null
  regulator: string | null
  status: string
  effective_date: string | null
  sunset_date: string | null
  summary: string | null
  prescription_notes: string | null
  source_urls: string[] | null
  verification: string
  last_verified_at: string | null
  qualifying_conditions: string[] | null
  prescriber_scope: string | null
  min_age: number | null
  reimbursement: string | null
  created_at: string
  updated_at: string
}

export type ProductFormat = {
  id: string
  slug: string
  name: string
  category: string | null
  description: string | null
  sort_order: number
}

export type PathwayFormatRule = {
  id: string
  pathway_id: string
  format_id: string
  status: string
  thc_limit: string | null
  cbd_limit: string | null
  possession_limit: string | null
  unit_dose_limit: string | null
  packaging_labelling: string | null
  conditions: Record<string, unknown> | null
  notes: string | null
  source_urls: string[] | null
  verification: string
  last_verified_at: string | null
  effective_date: string | null
}

export type RegulatoryCitation = {
  id: string
  entity_type: 'pathway' | 'rule'
  entity_id: string
  instrument: string | null
  article: string | null
  source_type: string
  citation_url: string | null
  published_date: string | null
  accessed_date: string | null
  excerpt: string | null
}

export type OperatorLicence = {
  id: string
  operator_id: string
  country_iso2: string
  licence_number: string | null
  licence_class: string | null
  issuing_regulator: string | null
  authorized_activities: string[] | null
  issue_date: string | null
  expiry_date: string | null
  licence_status: string | null
  facility_city: string | null
  facility_province_state: string | null
  gmp_certified: boolean | null
  gacp_certified: boolean | null
  source_url: string | null
  last_verified: string | null
}

export type OperatorLicenceWithOperator = OperatorLicence & {
  operator_legal_name: string | null
  operator_type: string | null
}

// ---------------------------------------------------------------------------
// Pathways
// ---------------------------------------------------------------------------

const PATHWAY_SELECT =
  'id,country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,sunset_date,summary,prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement,created_at,updated_at'

export async function listPathwaysByCountry(iso2: string): Promise<AdminDataResult<RegulatoryPathway[]>> {
  const params = new URLSearchParams({
    select: PATHWAY_SELECT,
    iso_alpha2: `eq.${iso2.toUpperCase()}`,
    order: 'pathway_type.asc,name.asc',
  })
  return fetchAdminSupabaseJson<RegulatoryPathway[]>(`/rest/v1/regulatory_pathways?${params}`)
}

/** Lightweight fetch (iso_alpha2 only) used to build the country index without loading full rows. */
export async function listPathwayCountries(): Promise<AdminDataResult<{ iso_alpha2: string }[]>> {
  const params = new URLSearchParams({ select: 'iso_alpha2', order: 'iso_alpha2.asc' })
  return fetchAdminSupabaseJson<{ iso_alpha2: string }[]>(`/rest/v1/regulatory_pathways?${params}`)
}

// ---------------------------------------------------------------------------
// Product formats (small reference table)
// ---------------------------------------------------------------------------

export async function listProductFormats(): Promise<AdminDataResult<ProductFormat[]>> {
  const params = new URLSearchParams({
    select: 'id,slug,name,category,description,sort_order',
    order: 'sort_order.asc',
  })
  return fetchAdminSupabaseJson<ProductFormat[]>(`/rest/v1/product_formats?${params}`)
}

// ---------------------------------------------------------------------------
// Format rules (pathway x format -> limits)
// ---------------------------------------------------------------------------

const RULE_SELECT =
  'id,pathway_id,format_id,status,thc_limit,cbd_limit,possession_limit,unit_dose_limit,packaging_labelling,conditions,notes,source_urls,verification,last_verified_at,effective_date'

export async function listFormatRulesForPathways(
  pathwayIds: string[],
): Promise<AdminDataResult<PathwayFormatRule[]>> {
  if (pathwayIds.length === 0) return { ok: true, data: [], source: 'db' }
  const params = new URLSearchParams({
    select: RULE_SELECT,
    pathway_id: `in.(${pathwayIds.join(',')})`,
  })
  return fetchAdminSupabaseJson<PathwayFormatRule[]>(`/rest/v1/pathway_format_rules?${params}`)
}

// ---------------------------------------------------------------------------
// Citations (polymorphic: entity_type 'pathway' | 'rule')
// ---------------------------------------------------------------------------

export async function listCitationsForEntities(
  entityType: 'pathway' | 'rule',
  entityIds: string[],
): Promise<AdminDataResult<RegulatoryCitation[]>> {
  if (entityIds.length === 0) return { ok: true, data: [], source: 'db' }
  const params = new URLSearchParams({
    select: 'id,entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt',
    entity_type: `eq.${entityType}`,
    entity_id: `in.(${entityIds.join(',')})`,
  })
  return fetchAdminSupabaseJson<RegulatoryCitation[]>(`/rest/v1/regulatory_citations?${params}`)
}

// ---------------------------------------------------------------------------
// Operator licensing by country (joined with cannabis_operators for name)
// ---------------------------------------------------------------------------

const LICENCE_SELECT =
  'id,operator_id,country_iso2,licence_number,licence_class,issuing_regulator,authorized_activities,issue_date,expiry_date,licence_status,facility_city,facility_province_state,gmp_certified,gacp_certified,source_url,last_verified'

export async function listOperatorLicencesByCountry(
  iso2: string,
): Promise<AdminDataResult<OperatorLicenceWithOperator[]>> {
  const params = new URLSearchParams({
    select: LICENCE_SELECT,
    country_iso2: `eq.${iso2.toUpperCase()}`,
    order: 'licence_status.asc,expiry_date.asc',
  })
  const licenceResult = await fetchAdminSupabaseJson<OperatorLicence[]>(`/rest/v1/operator_licences?${params}`)
  if (!licenceResult.ok) return licenceResult
  if (licenceResult.data.length === 0) return { ok: true, data: [], source: licenceResult.source }

  const operatorIds = [...new Set(licenceResult.data.map(l => l.operator_id))]
  const opParams = new URLSearchParams({
    select: 'id,legal_name,operator_type',
    id: `in.(${operatorIds.join(',')})`,
  })
  const operatorResult = await fetchAdminSupabaseJson<{ id: string; legal_name: string; operator_type: string }[]>(
    `/rest/v1/cannabis_operators?${opParams}`,
  )
  const operatorsById = new Map(
    (operatorResult.ok ? operatorResult.data : []).map(o => [o.id, o]),
  )

  return {
    ok: true,
    data: licenceResult.data.map(l => ({
      ...l,
      operator_legal_name: operatorsById.get(l.operator_id)?.legal_name ?? null,
      operator_type: operatorsById.get(l.operator_id)?.operator_type ?? null,
    })),
    source: licenceResult.source,
  }
}

/** Distinct countries that have at least one operator licence on file — used for the index page. */
export async function listLicenceCountries(): Promise<AdminDataResult<{ country_iso2: string }[]>> {
  const params = new URLSearchParams({ select: 'country_iso2', order: 'country_iso2.asc' })
  return fetchAdminSupabaseJson<{ country_iso2: string }[]>(`/rest/v1/operator_licences?${params}`)
}

/** Country display names, sourced live from the canonical countries table (not a hardcoded list). */
export async function listCountryNames(): Promise<AdminDataResult<{ iso_alpha2: string; country_name: string }[]>> {
  const params = new URLSearchParams({ select: 'iso_alpha2,country_name' })
  return fetchAdminSupabaseJson<{ iso_alpha2: string; country_name: string }[]>(`/rest/v1/countries?${params}`)
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const VERIFICATION_LABELS: Record<string, string> = {
  verified: 'Verified',
  needs_review: 'Needs review',
  unverified: 'Unverified',
  stale: 'Stale — needs re-verification',
}

export const VERIFICATION_COLORS: Record<string, string> = {
  verified: 'text-emerald-400',
  needs_review: 'text-amber-400',
  unverified: 'text-[#F5F1E8]/40',
  stale: 'text-red-400',
}

export const PATHWAY_TYPE_LABELS: Record<string, string> = {
  registered_medicine: 'Registered Medicine',
  medical_access_program: 'Medical Access Program',
  special_access_import: 'Special Access / Import',
  domestic_authorization: 'Domestic Authorization',
  adult_use_noncommercial: 'Adult Use (Non-commercial)',
  adult_use_commercial: 'Adult Use (Commercial)',
  magistral_compounding: 'Magistral Compounding',
  research_only: 'Research Only',
  low_thc_consumer: 'Low-THC Consumer',
  pilot_program: 'Pilot Program',
  export_oriented: 'Export-Oriented',
}
