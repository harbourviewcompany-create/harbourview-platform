import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

async function resolveOrg(userId: string) {
  const svc = await createSupabaseServiceClient()
  const { data } = await svc
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single()
  return { svc, orgId: data?.workspace_id ?? null }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { item_type, title, subtitle, jurisdiction, ref_id } = body

  if (!item_type || !title) {
    return NextResponse.json({ error: 'item_type and title are required' }, { status: 400 })
  }

  const { svc, orgId } = await resolveOrg(user.id)
  if (!orgId) return NextResponse.json({ error: 'No organisation found' }, { status: 403 })

  const { data, error } = await svc
    .from('cc_watchlist_items')
    .insert({
      org_id: orgId,
      added_by: user.id,
      item_type,
      title,
      subtitle: subtitle ?? null,
      jurisdiction: jurisdiction ?? null,
      ref_id: ref_id ?? null,
      watch_status: 'active',
    })
    .select('id, item_type, title, jurisdiction, watch_status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ item: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { svc, orgId } = await resolveOrg(user.id)
  if (!orgId) return NextResponse.json({ error: 'No organisation found' }, { status: 403 })

  const { error } = await svc
    .from('cc_watchlist_items')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
