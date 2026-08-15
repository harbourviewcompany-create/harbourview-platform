import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 }) }
  const jobId = typeof body.jobId === 'string' ? body.jobId : ''
  const personId = typeof body.personId === 'string' ? body.personId : ''
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : null
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !/^[0-9a-f-]{36}$/i.test(personId) || (workspaceId && !/^[0-9a-f-]{36}$/i.test(workspaceId))) {
    return NextResponse.json({ error: 'INVALID_MATCH_REQUEST' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_generate_match', { p_job_id: jobId, p_person_id: personId, p_workspace_id: workspaceId })
  if (error) {
    const denied = error.code === '42501'
    return NextResponse.json({ error: denied ? 'MATCH_FORBIDDEN' : 'MATCH_UNAVAILABLE' }, { status: denied ? 403 : 400, headers: { 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store, private' } })
}
