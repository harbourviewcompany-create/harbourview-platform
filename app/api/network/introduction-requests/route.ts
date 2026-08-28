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

function mapRequestError(message: string | undefined): { status: number; error: string } {
  const text = message ?? ''
  if (text.includes('NETWORK_INTRODUCTION_UNAUTHENTICATED')) return { status: 401, error: 'Unauthorized' }
  if (text.includes('NETWORK_INTRODUCTION_FORBIDDEN')) return { status: 403, error: 'Active organization membership required.' }
  if (text.includes('NETWORK_MISSION_WORKSPACE_MISMATCH')) return { status: 404, error: 'Mission is not available in the active organization.' }
  if (text.includes('NETWORK_INTRODUCTION_TARGET_NOT_FOUND')) return { status: 404, error: 'Introduction target was not found.' }
  if (text.includes('NETWORK_INTRODUCTION_TARGET_MISMATCH')) return { status: 409, error: 'Introduction target does not match the resolved Network identity.' }
  if (text.includes('NETWORK_INTRODUCTION_INVALID_TARGET')) return { status: 400, error: 'Invalid introduction target.' }
  if (text.includes('NETWORK_INTRODUCTION_INVALID_REASON')) return { status: 400, error: 'Invalid introduction reason.' }
  if (text.includes('NETWORK_INTRODUCTION_INVALID_DISCLOSURE_SCOPE')) return { status: 400, error: 'Invalid disclosure scope.' }
  if (text.includes('NETWORK_INTRODUCTION_INVALID_SOURCE_KIND') || text.includes('NETWORK_INTRODUCTION_INVALID_SOURCE_ID')) {
    return { status: 400, error: 'Invalid introduction source reference.' }
  }
  return { status: 400, error: 'Introduction request failed.' }
}

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

  const { data, error } = await context.supabase.rpc('hv_network_request_introduction', {
    p_workspace_id: context.workspaceId,
    p_reason: parsed.data.reason,
    p_requested_disclosure_scope: parsed.data.requestedDisclosureScope,
    p_mission_id: parsed.data.missionId ?? null,
    p_target_entity_id: parsed.data.target.entityId ?? null,
    p_target_source_kind: parsed.data.target.sourceKind ?? null,
    p_target_source_id: parsed.data.target.sourceId ?? null,
  })

  if (error) {
    const mapped = mapRequestError(error.message)
    return NextResponse.json({ error: mapped.error }, { status: mapped.status })
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return NextResponse.json({ error: 'Introduction request returned no row.' }, { status: 500 })

  return NextResponse.json(
    {
      introduction: {
        id: row.id,
        status: row.status,
        created_at: row.created_at,
      },
    },
    { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
  )
}
