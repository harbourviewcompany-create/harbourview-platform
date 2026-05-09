import { GeneticsRoutingRecord } from './geneticsExecution'

type SupabaseMutationResult = PromiseLike<{ data: unknown; error: unknown }>

type SupabaseInsertResult = {
  select?: (cols?: string) => {
    single?: () => SupabaseMutationResult
  }
}

type SupabaseLike = {
  from: (table: string) => {
    insert: (payload: any) => SupabaseInsertResult
    update: (payload: any) => { eq: (column: string, value: string) => SupabaseMutationResult }
  }
}

export function toGeneticsRoutingRecordRow(record: GeneticsRoutingRecord) {
  return {
    id: record.id,
    profile_slug: record.profileSlug,
    drop_id: record.dropId,
    requester_company: record.requesterCompany,
    requester_country: record.requesterCountry,
    requester_email: record.requesterEmail,
    intent: record.intent,
    target_market: record.targetMarket,
    score: record.score,
    score_band: record.scoreBand,
    status: record.status,
    buyer_permission_approved: record.buyerPermissionApproved,
    holder_permission_approved: record.holderPermissionApproved,
    introduction_ready: record.introductionReady,
    next_action: record.nextAction,
    private_intro_draft: record.privateIntroDraft,
  }
}

export function toGeneticsRoutingEventRow(args: {
  routingRecordId: string
  eventType: string
  eventSummary: string
  actor?: string
  privateNotes?: string
}) {
  return {
    routing_record_id: args.routingRecordId,
    event_type: args.eventType,
    event_summary: args.eventSummary,
    actor: args.actor ?? 'system',
    private_notes: args.privateNotes,
  }
}

export async function persistGeneticsRoutingRecord(args: {
  client: SupabaseLike
  record: GeneticsRoutingRecord
}) {
  const insertResult = args.client
    .from('genetics_routing_records')
    .insert(toGeneticsRoutingRecordRow(args.record))

  if ('select' in insertResult && insertResult.select) {
    const selected = insertResult.select('*')
    if (selected.single) return selected.single()
  }

  return { data: null, error: null }
}

export async function persistGeneticsRoutingEvent(args: {
  client: SupabaseLike
  routingRecordId: string
  eventType: string
  eventSummary: string
  actor?: string
  privateNotes?: string
}) {
  const insertResult = args.client
    .from('genetics_routing_events')
    .insert(toGeneticsRoutingEventRow(args))

  if ('select' in insertResult && insertResult.select) {
    const selected = insertResult.select('*')
    if (selected.single) return selected.single()
  }

  return { data: null, error: null }
}
