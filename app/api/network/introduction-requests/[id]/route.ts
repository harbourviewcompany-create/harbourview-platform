import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  isIntroductionTransitionAllowed,
  isNetworkIntroductionStatus,
  NETWORK_INTRODUCTION_STATUSES,
} from '@/lib/network/introductionStatus'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'
import { resolveActiveNetworkContext } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

const AdvanceSchema = z.object({
  toStatus: z.enum(NETWORK_INTRODUCTION_STATUSES as unknown as [string, ...string[]]),
  outcome: z.string().trim().max(1000).optional().nullable(),
  detail: z.record(z.string(), z.unknown()).optional(),
})

function mapAdvanceError(message: string | undefined): { status: number; error: string } {
  const text = message ?? ''
  if (text.includes('NETWORK_INTRODUCTION_NOT_FOUND')) {
    return { status: 404, error: 'Introduction not found.' }
  }
  if (text.includes('NETWORK_INTRODUCTION_FORBIDDEN')) {
    return { status: 403, error: 'Not allowed to advance this introduction.' }
  }
  if (text.includes('NETWORK_INTRODUCTION_INVALID_TRANSITION')) {
    return { status: 409, error: 'That status transition is not allowed.' }
  }
  if (text.includes('NETWORK_INTRODUCTION_INVALID_STATUS')) {
    return { status: 400, error: 'Invalid target status.' }
  }
  if (text.includes('NETWORK_INTRODUCTION_OUTCOME_TOO_LONG')) {
    return { status: 400, error: 'Outcome text is too long.' }
  }
  return { status: 400, error: text || 'Introduction advancement failed.' }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid introduction id.' }, { status: 400 })
  }

  const context = await resolveActiveNetworkContext()
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!context.workspaceId) {
    return NextResponse.json(
      { error: 'Select an active organization before advancing an introduction.' },
      { status: 409 },
    )
  }

  const rateLimit = await enforceRateLimit({
    route: '/api/network/introduction-requests/advance',
    ip: getClientIp(req),
    identity: context.userId,
    limit: 30,
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

  const parsed = AdvanceSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid advancement payload.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (!isNetworkIntroductionStatus(parsed.data.toStatus)) {
    return NextResponse.json({ error: 'Invalid target status.' }, { status: 400 })
  }

  // Pre-check existence + workspace tenancy with the session client (RLS).
  const { data: existing, error: loadError } = await context.supabase
    .from('network_introductions')
    .select('id,workspace_id,status')
    .eq('id', id)
    .eq('workspace_id', context.workspaceId)
    .maybeSingle()

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 400 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Introduction not found in the active organization.' }, { status: 404 })
  }

  // Optimistic client-side matrix check (member path). Staff path is enforced in SQL.
  // We cannot know staff role here without an extra query; invalid member jumps still
  // fail inside hv_network_advance_introduction.
  if (
    !isIntroductionTransitionAllowed(existing.status, parsed.data.toStatus, true)
    && !isIntroductionTransitionAllowed(existing.status, parsed.data.toStatus, false)
  ) {
    return NextResponse.json({ error: 'That status transition is not allowed.' }, { status: 409 })
  }

  const { data, error } = await context.supabase.rpc('hv_network_advance_introduction', {
    p_introduction_id: id,
    p_to_status: parsed.data.toStatus,
    p_outcome: parsed.data.outcome ?? null,
    p_detail: parsed.data.detail ?? {},
  })

  if (error) {
    const mapped = mapAdvanceError(error.message)
    return NextResponse.json({ error: mapped.error }, { status: mapped.status })
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    return NextResponse.json({ error: 'Introduction advancement returned no row.' }, { status: 500 })
  }

  return NextResponse.json(
    {
      introduction: {
        id: row.id,
        status: row.status,
        outcome: row.outcome ?? null,
        introducedAt: row.introduced_at ?? null,
        updatedAt: row.updated_at,
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
