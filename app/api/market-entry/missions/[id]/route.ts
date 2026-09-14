import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid mission id.' }, { status: 400 })

  const { data: mission, error: missionError } = await supabase
    .from('market_entry_missions')
    .select('id,origin_iso2,destination_iso2,product_class,status,plan_version,plan_snapshot,evidence_snapshot,reproducibility_key,payment_status,report_status,checkout_session_id,paid_at,delivered_at,created_at,updated_at')
    .eq('id', id)
    .maybeSingle()
  if (missionError) return NextResponse.json({ error: 'Mission workspace is unavailable.' }, { status: 503 })
  if (!mission) return NextResponse.json({ error: 'Mission not found.' }, { status: 404 })

  const [{ data: tasks, error: tasksError }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from('market_entry_tasks').select('*').eq('mission_id', id).order('created_at', { ascending: true }),
    supabase.from('market_entry_events').select('*').eq('mission_id', id).order('created_at', { ascending: false }),
  ])
  if (tasksError || eventsError) return NextResponse.json({ error: 'Mission execution state is unavailable.' }, { status: 503 })
  return NextResponse.json({ mission, tasks: tasks ?? [], events: events ?? [] })
}
