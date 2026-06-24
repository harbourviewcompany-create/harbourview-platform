import 'server-only'
import { createClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import {
  toAdminGeneticsReviewDTO,
  toInternalCultivarPassportDTO,
  toPublicCultivarPassportDTO,
  type PublicCultivarPassportDTO,
} from './dto'
import type {
  CultivarAliasRow,
  CultivarCountryOpportunityRow,
  CultivarPassportRow,
  GeneticsAccessGrantRow,
  GeneticsAccessRequestRow,
  GeneticsAuditEventRow,
  GeneticsClaimReviewRow,
  GeneticsCollaborationProjectRow,
  GeneticsEvidenceItemRow,
  GeneticsProfileRow,
  GeneticsServiceProviderRow,
} from './types'

// Live Supabase-backed replacement for lib/genetics/demoData.ts.
// Public functions rely on RLS (cultivar_passports_public_read, etc.) via the
// session-aware client — they never use the service-role client, matching the
// boundary enforced by tests/genetics/cultivarPassportNetwork.test.tsx.
// Dashboard functions also use the session-aware client so RLS scopes results
// to the signed-in user's own profiles/passports (or admin/reviewer roles).
// Only the admin review queue — gated behind requireAdminAuth() upstream —
// uses the service-role client to see the full unfiltered queue.

type SupabaseLike = Awaited<ReturnType<typeof createClient>>

async function fetchRelatedRowsForCultivars(supabase: SupabaseLike, cultivarIds: string[]) {
  if (cultivarIds.length === 0) {
    return {
      aliases: [] as CultivarAliasRow[],
      opportunities: [] as CultivarCountryOpportunityRow[],
      evidence: [] as GeneticsEvidenceItemRow[],
      collaborations: [] as GeneticsCollaborationProjectRow[],
    }
  }

  const [aliasesRes, opportunitiesRes, evidenceRes, collaborationsRes] = await Promise.all([
    supabase.from('cultivar_aliases').select('*').in('cultivar_id', cultivarIds),
    supabase.from('cultivar_country_opportunities').select('*').in('cultivar_id', cultivarIds),
    supabase.from('genetics_evidence_items').select('*').in('cultivar_id', cultivarIds),
    supabase.from('genetics_collaboration_projects').select('*').in('linked_cultivar_id', cultivarIds),
  ])

  if (aliasesRes.error) console.error('[genetics_queries] cultivar_aliases fetch failed', aliasesRes.error.message)
  if (opportunitiesRes.error) console.error('[genetics_queries] cultivar_country_opportunities fetch failed', opportunitiesRes.error.message)
  if (evidenceRes.error) console.error('[genetics_queries] genetics_evidence_items fetch failed', evidenceRes.error.message)
  if (collaborationsRes.error) console.error('[genetics_queries] genetics_collaboration_projects fetch failed', collaborationsRes.error.message)

  return {
    aliases: (aliasesRes.data ?? []) as CultivarAliasRow[],
    opportunities: (opportunitiesRes.data ?? []) as CultivarCountryOpportunityRow[],
    evidence: (evidenceRes.data ?? []) as GeneticsEvidenceItemRow[],
    collaborations: (collaborationsRes.data ?? []) as GeneticsCollaborationProjectRow[],
  }
}

async function fetchProfilesByIds(supabase: SupabaseLike, ids: Array<string | null>) {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  const map = new Map<string, GeneticsProfileRow>()
  if (uniqueIds.length === 0) return map

  const { data, error } = await supabase.from('genetics_profiles').select('*').in('id', uniqueIds)
  if (error) {
    console.error('[genetics_queries] genetics_profiles fetch failed', error.message)
    return map
  }
  for (const row of (data ?? []) as GeneticsProfileRow[]) map.set(row.id, row)
  return map
}

function buildPublicDto(
  cultivar: CultivarPassportRow,
  related: {
    aliases: CultivarAliasRow[]
    opportunities: CultivarCountryOpportunityRow[]
    evidence: GeneticsEvidenceItemRow[]
    collaborations: GeneticsCollaborationProjectRow[]
  },
  profiles: Map<string, GeneticsProfileRow>,
): PublicCultivarPassportDTO {
  return toPublicCultivarPassportDTO({
    cultivar,
    aliases: related.aliases.filter((alias) => alias.cultivar_id === cultivar.id),
    breeder: cultivar.breeder_profile_id ? profiles.get(cultivar.breeder_profile_id) ?? null : null,
    rightsHolder: cultivar.rights_holder_profile_id ? profiles.get(cultivar.rights_holder_profile_id) ?? null : null,
    opportunities: related.opportunities.filter((opportunity) => opportunity.cultivar_id === cultivar.id),
    evidence: related.evidence.filter((item) => item.cultivar_id === cultivar.id),
    collaborations: related.collaborations.filter((project) => project.linked_cultivar_id === cultivar.id),
  })
}

/** Public passport list — used by /genetics and /genetics/cultivars. RLS scopes to is_public rows only. */
export async function getPublicCultivarPassports(): Promise<PublicCultivarPassportDTO[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cultivar_passports')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[genetics_queries] getPublicCultivarPassports failed', error.message)
    return []
  }

  const cultivars = (data ?? []) as CultivarPassportRow[]
  if (cultivars.length === 0) return []

  const ids = cultivars.map((cultivar) => cultivar.id)
  const related = await fetchRelatedRowsForCultivars(supabase, ids)
  const profileIds = cultivars.flatMap((cultivar) => [cultivar.breeder_profile_id, cultivar.rights_holder_profile_id])
  const profiles = await fetchProfilesByIds(supabase, profileIds)

  return cultivars.map((cultivar) => buildPublicDto(cultivar, related, profiles))
}

/** Single public passport by slug — used by /genetics/cultivars/[slug]. */
export async function getPublicCultivarPassportBySlug(slug: string): Promise<PublicCultivarPassportDTO | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cultivar_passports')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (error) {
    console.error('[genetics_queries] getPublicCultivarPassportBySlug failed', error.message)
    return null
  }
  if (!data) return null

  const cultivar = data as CultivarPassportRow
  const related = await fetchRelatedRowsForCultivars(supabase, [cultivar.id])
  const profiles = await fetchProfilesByIds(supabase, [cultivar.breeder_profile_id, cultivar.rights_holder_profile_id])

  return buildPublicDto(cultivar, related, profiles)
}

/**
 * Dashboard-scoped passports (internal view) — used by /dashboard/genetics/*.
 * Uses the session-aware client so RLS (cultivar_passports_owner_all, etc.)
 * naturally restricts rows to the signed-in user's own passports, or to the
 * full set for admin/reviewer roles. Unlike the public lookup, this does not
 * require is_public — a draft/private passport must still be visible to its
 * own owner in their dashboard.
 */
export async function getInternalCultivarPassports() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('cultivar_passports').select('*').order('created_at', { ascending: false })

  if (error) {
    console.error('[genetics_queries] getInternalCultivarPassports failed', error.message)
    return []
  }

  const cultivars = (data ?? []) as CultivarPassportRow[]
  if (cultivars.length === 0) return []

  const ids = cultivars.map((cultivar) => cultivar.id)
  const related = await fetchRelatedRowsForCultivars(supabase, ids)
  const profileIds = cultivars.flatMap((cultivar) => [cultivar.breeder_profile_id, cultivar.rights_holder_profile_id])
  const profiles = await fetchProfilesByIds(supabase, profileIds)

  const { data: accessRequestData, error: accessRequestError } = await supabase
    .from('genetics_access_requests')
    .select('*')
    .in('cultivar_id', ids)
  if (accessRequestError) console.error('[genetics_queries] genetics_access_requests fetch failed', accessRequestError.message)
  const accessRequests = (accessRequestData ?? []) as GeneticsAccessRequestRow[]

  return cultivars.map((cultivar) => {
    const publicDto = buildPublicDto(cultivar, related, profiles)
    return toInternalCultivarPassportDTO(publicDto, {
      cultivar,
      evidence: related.evidence.filter((item) => item.cultivar_id === cultivar.id),
      accessRequests: accessRequests.filter((request) => request.cultivar_id === cultivar.id),
      opportunities: related.opportunities.filter((opportunity) => opportunity.cultivar_id === cultivar.id),
    })
  })
}

/**
 * The current user's own active access grants as a *grantee* (not owner) —
 * i.e. cultivars/evidence someone else approved them to view. Distinct
 * from getInternalCultivarPassports(), which is the owner's view of their
 * own cultivars. Relies on RLS (genetics_profiles_owner_all,
 * genetics_access_grants_grantee_read, genetics_evidence_items_grant_read)
 * to scope everything to the current session — same pattern as
 * getInternalCultivarPassports().
 */
export async function getGranteeAccessGrants() {
  const supabase = await createClient()

  const { data: profileData, error: profileError } = await supabase.from('genetics_profiles').select('id')
  if (profileError) {
    console.error('[genetics_queries] getGranteeAccessGrants profile lookup failed', profileError.message)
    return []
  }
  const profileIds = (profileData ?? []).map((p: { id: string }) => p.id)
  if (profileIds.length === 0) return []

  const { data: grantData, error: grantError } = await supabase
    .from('genetics_access_grants')
    .select('*')
    .in('grantee_profile_id', profileIds)
    .eq('status', 'active')
  if (grantError) {
    console.error('[genetics_queries] getGranteeAccessGrants grant fetch failed', grantError.message)
    return []
  }
  const grants = (grantData ?? []) as GeneticsAccessGrantRow[]
  if (grants.length === 0) return []

  const cultivarIds = Array.from(new Set(grants.map((g) => g.cultivar_id)))
  const [{ data: cultivarData }, { data: evidenceData }] = await Promise.all([
    supabase.from('cultivar_passports').select('id, display_name, slug').in('id', cultivarIds),
    supabase.from('genetics_evidence_items').select('id, cultivar_id, evidence_type, title, visibility').in('cultivar_id', cultivarIds),
  ])

  const cultivarsById = new Map((cultivarData ?? []).map((c: { id: string }) => [c.id, c]))
  const evidenceByCultivar = new Map<string, GeneticsEvidenceItemRow[]>()
  for (const item of (evidenceData ?? []) as GeneticsEvidenceItemRow[]) {
    if (!item.cultivar_id) continue
    const list = evidenceByCultivar.get(item.cultivar_id) ?? []
    list.push(item)
    evidenceByCultivar.set(item.cultivar_id, list)
  }

  return grants.map((grant) => ({
    grant,
    cultivar: cultivarsById.get(grant.cultivar_id) as { id: string; display_name: string; slug: string } | undefined,
    evidenceItems: (evidenceByCultivar.get(grant.cultivar_id) ?? []).filter(
      (item) => grant.allowed_evidence_item_ids.includes(item.id) || grant.allowed_evidence_types.includes(item.evidence_type),
    ),
  }))
}
// Column lists scoped to what toAdminGeneticsReviewDTO actually consumes.
// Avoids transferring large unneeded columns (e.g. raw evidence blobs, JSONB payloads)
// and adds per-table row limits so the admin queue page stays fast as data grows.
const ADMIN_CULTIVAR_COLS =
  'id,slug,display_name,breeder_profile_id,rights_holder_profile_id,owner_user_id,is_public,claim_status,claim_review_status,evidence_score_summary,verification_summary,created_at,updated_at'
const ADMIN_OPPORTUNITY_COLS =
  'id,cultivar_id,country_code,jurisdiction_label,opportunity_type,status,material_transfer_status,jurisdiction_gate_status,public_note,private_note,requires_admin_review,review_status,created_at'
const ADMIN_EVIDENCE_COLS =
  'id,cultivar_id,evidence_type,title,public_summary,visibility,claim_status,review_status,private_notes,file_path,file_is_private,expires_at,created_at'
const ADMIN_ACCESS_REQUEST_COLS =
  'id,cultivar_id,requester_profile_id,request_type,declared_purpose,target_country_code,target_jurisdiction_label,status,requires_nda,requires_licence_review,requires_admin_review,review_notes_private,created_at,updated_at'
const ADMIN_CLAIM_REVIEW_COLS =
  'id,cultivar_id,evidence_item_id,reviewer_user_id,claim_label,claim_status,review_status,public_note,private_note,created_at'

export async function getAdminGeneticsReviewQueue() {
  const supabase = await createSupabaseServiceClient()

  const [cultivarsRes, opportunitiesRes, evidenceRes, accessRequestsRes, claimReviewsRes, auditEventsRes] = await Promise.all([
    supabase.from('cultivar_passports').select(ADMIN_CULTIVAR_COLS).order('created_at', { ascending: false }).limit(500),
    supabase.from('cultivar_country_opportunities').select(ADMIN_OPPORTUNITY_COLS).order('created_at', { ascending: false }).limit(500),
    supabase.from('genetics_evidence_items').select(ADMIN_EVIDENCE_COLS).order('created_at', { ascending: false }).limit(500),
    supabase.from('genetics_access_requests').select(ADMIN_ACCESS_REQUEST_COLS).order('created_at', { ascending: false }).limit(500),
    supabase.from('genetics_claim_reviews').select(ADMIN_CLAIM_REVIEW_COLS).order('created_at', { ascending: false }).limit(500),
    supabase.from('genetics_audit_events').select('*').order('created_at', { ascending: false }).limit(200),
  ])

  for (const [label, res] of Object.entries({
    cultivars: cultivarsRes,
    opportunities: opportunitiesRes,
    evidence: evidenceRes,
    accessRequests: accessRequestsRes,
    claimReviews: claimReviewsRes,
    auditEvents: auditEventsRes,
  })) {
    if (res.error) console.error(`[genetics_queries] admin queue fetch failed (${label})`, res.error.message)
  }

  return toAdminGeneticsReviewDTO({
    cultivars: (cultivarsRes.data ?? []) as unknown as CultivarPassportRow[],
    opportunities: (opportunitiesRes.data ?? []) as unknown as CultivarCountryOpportunityRow[],
    evidence: (evidenceRes.data ?? []) as unknown as GeneticsEvidenceItemRow[],
    accessRequests: (accessRequestsRes.data ?? []) as unknown as GeneticsAccessRequestRow[],
    claimReviews: (claimReviewsRes.data ?? []) as unknown as GeneticsClaimReviewRow[],
    auditEvents: (auditEventsRes.data ?? []) as unknown as GeneticsAuditEventRow[],
  })
}

/** Public service-provider directory — used by /genetics/services. */
export async function getPublicServiceProviders() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('genetics_service_providers').select('*').eq('is_public', true)

  if (error) {
    console.error('[genetics_queries] getPublicServiceProviders failed', error.message)
    return []
  }

  const providers = (data ?? []) as GeneticsServiceProviderRow[]
  if (providers.length === 0) return []

  const profiles = await fetchProfilesByIds(supabase, providers.map((provider) => provider.profile_id))

  return providers.map((provider) => ({
    id: provider.id,
    displayName: profiles.get(provider.profile_id)?.display_name ?? 'Harbourview-listed provider',
    service_category: provider.service_category,
    service_summary: provider.service_summary,
    country_code: provider.country_code,
    jurisdiction_label: provider.jurisdiction_label,
    verification_level: provider.verification_level,
  }))
}

/** Public collaboration-project list — used by /genetics/collaboration. */
export async function getPublicCollaborationProjects() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('genetics_collaboration_projects')
    .select('*')
    .eq('visibility', 'public_summary')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[genetics_queries] getPublicCollaborationProjects failed', error.message)
    return []
  }

  return ((data ?? []) as GeneticsCollaborationProjectRow[]).map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    projectType: project.project_type,
    status: project.status,
    countryCode: project.country_code,
    jurisdictionLabel: project.jurisdiction_label,
    publicSummary: project.public_summary,
    evidenceNeeded: project.evidence_needed,
    cta: 'Start collaboration' as const,
  }))
}
