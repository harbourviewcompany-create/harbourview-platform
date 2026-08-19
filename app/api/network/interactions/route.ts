import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'
import { resolveActiveNetworkContext } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

const InteractionSchema = z.object({
  missionId: z.string().uuid().optional().nullable(),
  introductionId: z.string().uuid().optional().nullable(),
  entityId: z.string().uuid().optional().nullable(),
  sourceKind: z.string().trim().min(1).max(80).optional().nullable(),
  sourceId: z.string().trim().min(1).max(240).optional().nullable(),
  interactionType: z.string().trim().min(1).max(100),
  channel: z.string().trim().max(100).optional().nullable(),
  direction: z.enum(['outbound', 'inbound', 'mutual', 'internal']).optional().default('outbound'),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  summary: z.string().trim().min(1).max(4000),
  outcome: z.string().trim().max(1000).optional().nullable(),
  classification: z.enum(['workspace', 'restricted']).optional().default('workspace'),
}).refine(
  data => Boolean(data.entityId || (data.sourceKind && data.sourceId)),
  { message: 'A canonical entity or source record is required.' },
)

export async function POST(req: NextRequest) {
  const context = await resolveActiveNetworkContext()
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!context.workspaceId) {
    return NextResponse.json({ error: 'Select an active organization before recording an interaction.' }, { status: 409 })
  }

  const rateLimit = await enforceRateLimit({
    route: '/api/network/interactions',
    ip: getClientIp(req),
    identity: context.userId,
    limit: 40,
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
  const parsed = InteractionSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid interaction payload.', details: parsed.error.flatten() }, { status: 400 })
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

  if (parsed.data.introductionId) {
    const { data: introduction } = await context.supabase
      .from('network_introductions')
      .select('id')
      .eq('id', parsed.data.introductionId)
      .eq('workspace_id', context.workspaceId)
      .maybeSingle()
    if (!introduction) return NextResponse.json({ error: 'Introduction is not available in the active organization.' }, { status: 404 })
  }

  const { data, error } = await context.supabase
    .from('network_interactions')
    .insert({
      workspace_id: context.workspaceId,
      mission_id: parsed.data.missionId ?? null,
      introduction_id: parsed.data.introductionId ?? null,
      entity_id: parsed.data.entityId ?? null,
      source_kind: parsed.data.sourceKind ?? null,
      source_id: parsed.data.sourceId ?? null,
      interaction_type: parsed.data.interactionType,
      channel: parsed.data.channel ?? null,
      direction: parsed.data.direction,
      occurred_at: parsed.data.occurredAt ?? new Date().toISOString(),
      summary: parsed.data.summary,
      outcome: parsed.data.outcome ?? null,
      classification: parsed.data.classification,
      created_by: context.userId,
    })
    .select('id,occurred_at,interaction_type,outcome')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Interaction creation failed.' }, { status: 400 })
  return NextResponse.json({ interaction: data }, { status: 201 })
}
