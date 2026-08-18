import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'
import { resolveActiveNetworkContext } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

const IntroductionSchema = z.object({
  missionId: z.string().uuid().optional().nullable(),
  target: z.object({
    entityId: z.string().uuid().optional().nullable(),
    sourceKind: z.string().trim().min(1).max(80).optional().nullable(),
    sourceId: z.string().trim().min(1).max(240).optional().nullable(),
  }).refine(
    target => Boolean(target.entityId || (target.sourceKind && target.sourceId)),
    { message: 'A canonical entity or source record is required.' },
  ),
  reason: z.string().trim().min(1).max(2000),
  requestedDisclosureScope: z.string().trim().min(1).max(160).optional().default('identity_and_business_context'),
})

export async function POST(req: NextRequest) {
  const context = await resolveActiveNetworkContext()
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!context.workspaceId) {
    return NextResponse.json({ error: 'Select an active organization before requesting an introduction.' }, { status: 409 })
  }

  const rateLimit = await enforceRateLimit({
    route: '/api/network/introduction-requests',
    ip: getClientIp(req),
    identity: context.userId,
    limit: 20,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }
  const parsed = IntroductionSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid introduction request.', details: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.missionId) {
    const { data: mission } = await context.supabase
      .from('network_missions')
      .select('id')
      .eq('id', parsed.data.missionId)
      .eq('workspace_id', context.workspaceId)
      .maybeSingle()
    if (!mission) return NextResponse.json({ error: 'Mission is not available in the active organization.' }, { status: 404 })
  }

  const { data: introduction, error } = await context.supabase
    .from('network_introductions')
    .insert({
      workspace_id: context.workspaceId,
      mission_id: parsed.data.missionId ?? null,
      requester_user_id: context.userId,
      target_entity_id: parsed.data.target.entityId ?? null,
      target_source_kind: parsed.data.target.sourceKind ?? null,
      target_source_id: parsed.data.target.sourceId ?? null,
      reason: parsed.data.reason,
      requested_disclosure_scope: parsed.data.requestedDisclosureScope,
      status: 'review',
      consent_required: true,
    })
    .select('id,status,created_at')
    .single()

  if (error || !introduction) {
    return NextResponse.json({ error: error?.message ?? 'Introduction request failed.' }, { status: 400 })
  }

  const { error: eventError } = await context.supabase
    .from('network_introduction_events')
    .insert({
      introduction_id: introduction.id,
      workspace_id: context.workspaceId,
      actor_user_id: context.userId,
      event_type: 'requested',
      from_status: null,
      to_status: 'review',
      detail: { requested_disclosure_scope: parsed.data.requestedDisclosureScope },
    })

  if (eventError) {
    console.error('[network] introduction event insert failed', eventError.message)
  }

  return NextResponse.json({ introduction }, { status: 201 })
}
