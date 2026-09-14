import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'Mission id required' }, { status: 400 })

  const { data: mission, error } = await supabase
    .from('market_entry_missions')
    .select('*, market_entry_mission_tasks(*), market_entry_mission_events(*)')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!mission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ mission })
}
