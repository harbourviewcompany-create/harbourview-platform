import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export async function POST(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  const { jobId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return NextResponse.json({ error: 'INVALID_JOB' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_save_job', { p_job_id: jobId, p_saved: true })
  if (error) return NextResponse.json({ error: 'SAVE_FAILED' }, { status: 400 })
  return NextResponse.json({ data: { saved: data === true } }, { headers: { 'Cache-Control': 'no-store, private' } })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  const { jobId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return NextResponse.json({ error: 'INVALID_JOB' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_save_job', { p_job_id: jobId, p_saved: false })
  if (error) return NextResponse.json({ error: 'SAVE_FAILED' }, { status: 400 })
  return NextResponse.json({ data: { saved: data === true } }, { headers: { 'Cache-Control': 'no-store, private' } })
}
