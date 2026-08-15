import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 }) }
  const purpose = typeof body.purpose === 'string' ? body.purpose : ''
  const policyVersion = typeof body.policyVersion === 'string' ? body.policyVersion.trim().slice(0, 80) : ''
  if (!policyVersion || !['talent_discoverability','employer_contact','application_processing','matching','alert_delivery'].includes(purpose)) {
    return NextResponse.json({ error: 'INVALID_CONSENT' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_set_my_consent', { p_purpose: purpose, p_policy_version: policyVersion, p_granted: body.granted === true })
  if (error) return NextResponse.json({ error: 'CONSENT_UPDATE_FAILED' }, { status: 400 })
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store, private' } })
}
