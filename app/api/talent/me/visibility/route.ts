import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 }) }
  const mode = typeof body.mode === 'string' ? body.mode : ''
  if (!['private','anonymous_discoverable','verified_employers','public'].includes(mode)) return NextResponse.json({ error: 'INVALID_VISIBILITY' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_set_my_visibility', { p_mode: mode, p_search_enabled: body.searchEnabled === true })
  if (error) return NextResponse.json({ error: 'VISIBILITY_UPDATE_FAILED' }, { status: 400 })
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store, private' } })
}
