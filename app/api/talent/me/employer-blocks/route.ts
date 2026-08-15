import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 }) }
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : ''
  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) return NextResponse.json({ error: 'INVALID_WORKSPACE' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_add_my_employer_block', { p_workspace_id: workspaceId, p_include_affiliates: body.includeAffiliates === true })
  if (error) return NextResponse.json({ error: 'BLOCK_UPDATE_FAILED' }, { status: 400 })
  return NextResponse.json({ data: { id: data } }, { headers: { 'Cache-Control': 'no-store, private' } })
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')?.trim() ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'INVALID_BLOCK' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_remove_my_employer_block', { p_block_id: id })
  if (error) return NextResponse.json({ error: 'BLOCK_UPDATE_FAILED' }, { status: 400 })
  return NextResponse.json({ data: { removed: data === true } }, { headers: { 'Cache-Control': 'no-store, private' } })
}
