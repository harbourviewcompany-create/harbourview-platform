import 'server-only'
import { fetchAdminSupabaseJson, type AdminDataSource } from '@/lib/supabase/adminDataClient'
import { toAdminGeneticsReviewDTO, type AdminGeneticsReviewDTO } from './dto'
import { getAdminGeneticsReviewQueue as getAdminGeneticsReviewQueueFixture } from './demoData'
import type {
  CultivarCountryOpportunityRow,
  CultivarPassportRow,
  GeneticsAccessRequestRow,
  GeneticsAuditEventRow,
  GeneticsClaimReviewRow,
  GeneticsEvidenceItemRow,
} from './types'

export type AdminGeneticsReviewQueueResult = AdminGeneticsReviewDTO & { source: AdminDataSource }

/**
 * Live-Supabase-backed replacement for demoData.getAdminGeneticsReviewQueue().
 * Falls back to fixture data when SUPABASE_SERVICE_ROLE_KEY is missing, any
 * request fails, or the DB is reachable but cultivar_passports is empty —
 * matching the AdminDataSource convention used by other admin pages
 * (see lib/supabase/adminDataClient.ts).
 */
export async function getAdminGeneticsReviewQueueLive(): Promise<AdminGeneticsReviewQueueResult> {
  const [cultivars, opportunities, evidence, accessRequests, claimReviews, auditEvents] = await Promise.all([
    fetchAdminSupabaseJson<CultivarPassportRow[]>(
      '/rest/v1/cultivar_passports?select=*&order=created_at.desc&limit=200',
    ),
    fetchAdminSupabaseJson<CultivarCountryOpportunityRow[]>(
      '/rest/v1/cultivar_country_opportunities?select=*&limit=500',
    ),
    fetchAdminSupabaseJson<GeneticsEvidenceItemRow[]>(
      '/rest/v1/genetics_evidence_items?select=*&limit=500',
    ),
    fetchAdminSupabaseJson<GeneticsAccessRequestRow[]>(
      '/rest/v1/genetics_access_requests?select=*&order=created_at.desc&limit=200',
    ),
    fetchAdminSupabaseJson<GeneticsClaimReviewRow[]>(
      '/rest/v1/genetics_claim_reviews?select=*&order=created_at.desc&limit=200',
    ),
    fetchAdminSupabaseJson<GeneticsAuditEventRow[]>(
      '/rest/v1/genetics_audit_events?select=*&order=created_at.desc&limit=200',
    ),
  ])

  const results = [cultivars, opportunities, evidence, accessRequests, claimReviews, auditEvents]
  const allOk = results.every((result) => result.ok)
  const cultivarsEmpty = cultivars.ok && cultivars.data.length === 0

  if (!allOk || cultivarsEmpty) {
    if (!allOk) {
      const failure = results.find((result) => !result.ok)
      if (failure && !failure.ok) {
        console.error('[harbourview:genetics] admin review queue falling back to fixture data', failure.error)
      }
    }
    return { ...getAdminGeneticsReviewQueueFixture(), source: 'fixture' }
  }

  // TypeScript can't narrow the tuple after .every(), so we re-assert ok:true access.
  const cultivarsData = (cultivars as { ok: true; data: CultivarPassportRow[] }).data
  const opportunitiesData = (opportunities as { ok: true; data: CultivarCountryOpportunityRow[] }).data
  const evidenceData = (evidence as { ok: true; data: GeneticsEvidenceItemRow[] }).data
  const accessRequestsData = (accessRequests as { ok: true; data: GeneticsAccessRequestRow[] }).data
  const claimReviewsData = (claimReviews as { ok: true; data: GeneticsClaimReviewRow[] }).data
  const auditEventsData = (auditEvents as { ok: true; data: GeneticsAuditEventRow[] }).data

  return {
    ...toAdminGeneticsReviewDTO({
      cultivars: cultivarsData,
      opportunities: opportunitiesData,
      evidence: evidenceData,
      accessRequests: accessRequestsData,
      claimReviews: claimReviewsData,
      auditEvents: auditEventsData,
    }),
    source: 'db',
  }
}
