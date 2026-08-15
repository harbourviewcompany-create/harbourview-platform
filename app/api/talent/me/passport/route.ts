import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_get_my_passport')
  if (error) return NextResponse.json({ error: 'PASSPORT_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store, private' } })
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 }) }

  const allowed = new Set(['headline','summary','countryIso2','regionCode','locality','availabilityState','availableFrom'])
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) if (allowed.has(key)) patch[key] = value
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'NO_SUPPORTED_FIELDS' }, { status: 400 })
  if (typeof patch.headline === 'string' && patch.headline.length > 180) return NextResponse.json({ error: 'HEADLINE_TOO_LONG' }, { status: 400 })
  if (typeof patch.summary === 'string' && patch.summary.length > 4000) return NextResponse.json({ error: 'SUMMARY_TOO_LONG' }, { status: 400 })
  if (typeof patch.countryIso2 === 'string' && !/^[A-Za-z]{2}$/.test(patch.countryIso2)) return NextResponse.json({ error: 'INVALID_COUNTRY' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_patch_my_passport', { p_patch: patch })
  if (error) return NextResponse.json({ error: 'PASSPORT_UPDATE_FAILED' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store, private' } })
}
