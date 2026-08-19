import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveActiveNetworkContext } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const context = await resolveActiveNetworkContext()
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!context.workspaceId) return NextResponse.json({ error: 'No active organization selected.' }, { status: 409 })

  const { id } = await ctx.params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Invalid watch id.' }, { status: 400 })

  const { error } = await context.supabase
    .from('cc_watchlist_items')
    .delete()
    .eq('id', id)
    .eq('org_id', context.workspaceId)
    .eq('item_type', 'network_counterparty')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
