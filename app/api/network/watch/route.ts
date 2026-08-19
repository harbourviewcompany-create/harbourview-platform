import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'
import { resolveActiveNetworkContext } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

const WatchSchema = z.object({
  sourceKind: z.string().trim().min(1).max(80),
  sourceId: z.string().trim().min(1).max(240),
  title: z.string().trim().min(1).max(240),
  subtitle: z.string().trim().max(500).optional().nullable(),
  jurisdiction: z.string().trim().max(120).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const context = await resolveActiveNetworkContext()
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!context.workspaceId) {
    return NextResponse.json({ error: 'Select an active organization before watching a Network record.' }, { status: 409 })
  }

  const rateLimit = await enforceRateLimit({
    route: '/api/network/watch',
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
  const parsed = WatchSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid watch payload.', details: parsed.error.flatten() }, { status: 400 })

  const refId = `${parsed.data.sourceKind}:${parsed.data.sourceId}`
  const { data: existing } = await context.supabase
    .from('cc_watchlist_items')
    .select('id,item_type,title,jurisdiction,watch_status,created_at')
    .eq('org_id', context.workspaceId)
    .eq('ref_id', refId)
    .eq('watch_status', 'active')
    .maybeSingle()

  if (existing) return NextResponse.json({ item: existing, alreadyWatching: true })

  const { data, error } = await context.supabase
    .from('cc_watchlist_items')
    .insert({
      org_id: context.workspaceId,
      added_by: context.userId,
      item_type: 'network_counterparty',
      ref_id: refId,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      jurisdiction: parsed.data.jurisdiction ?? null,
      tags: ['network-command'],
      watch_status: 'active',
      next_action: 'Review Network changes',
    })
    .select('id,item_type,title,jurisdiction,watch_status,created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Watch creation failed.' }, { status: 400 })
  return NextResponse.json({ item: data }, { status: 201 })
}
