import 'server-only'
import { fetchAdminSupabaseJson, type AdminDataSource } from '@/lib/supabase/adminDataClient'

export type GeneticsRoutingRecordRow = {
  id: string
  profile_slug: string
  drop_id: string
  requester_company: string
  requester_country: string | null
  requester_email: string
  intent: string
  target_market: string | null
  score: number
  score_band: string
  status: string
  buyer_permission_approved: boolean
  holder_permission_approved: boolean
  introduction_ready: boolean
  next_action: string | null
  private_intro_draft: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type GeneticsRoutingEventRow = {
  id: string
  routing_record_id: string | null
  event_type: string
  event_summary: string
  actor: string | null
  private_notes: string | null
  created_at: string
}

export type GeneticsRoutingQueueResult = {
  records: GeneticsRoutingRecordRow[]
  events: GeneticsRoutingEventRow[]
  source: AdminDataSource
}

/**
 * Replaces the hardcoded sample previously rendered on
 * app/admin/(protected)/routing/genetics/page.tsx with the real
 * genetics_routing_records/events tables, written to by
 * app/api/genetics/access-request/route.ts.
 */
export async function getGeneticsRoutingQueueLive(): Promise<GeneticsRoutingQueueResult> {
  const [records, events] = await Promise.all([
    fetchAdminSupabaseJson<GeneticsRoutingRecordRow[]>(
      '/rest/v1/genetics_routing_records?select=*&order=score.desc,created_at.desc&limit=200',
    ),
    fetchAdminSupabaseJson<GeneticsRoutingEventRow[]>(
      '/rest/v1/genetics_routing_events?select=*&order=created_at.desc&limit=200',
    ),
  ])

  if (!records.ok || !events.ok) {
    const failure = !records.ok ? records : events
    if (!failure.ok) {
      console.error('[harbourview:genetics] routing queue request failed', failure.error)
    }
    return { records: [], events: [], source: 'fixture' }
  }

  return { records: records.data, events: events.data, source: 'db' }
}
