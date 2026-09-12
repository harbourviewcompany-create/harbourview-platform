import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildMarketEntryPlan } from '@/lib/market-entry-os'
import type { MarketEntryInput } from '@/lib/market-entry-os/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isInput(value: unknown): value is MarketEntryInput {
  if (!value || typeof value !== 'object') return false
  const input = value as Record<string, unknown>
  return typeof input.originIso2 === 'string' && typeof input.destinationIso2 === 'string' && typeof input.productClass === 'string'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { data, error } = await supabase
    .from('market_entry_missions')
    .select('id, origin_iso2, destination_iso2, product_class, status, plan_version, reproducibility_key, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Mission workspace is unavailable.', detail: error.message }, { status: 503 })
  return NextResponse.json({ missions: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }
  if (!isInput(body)) return NextResponse.json({ error: 'originIso2, destinationIso2, and productClass are required.' }, { status: 400 })

  const plan = await buildMarketEntryPlan(body)
  if (!plan) return NextResponse.json({ error: 'Invalid or unsupported market-entry corridor input.' }, { status: 400 })

  const { data: mission, error: missionError } = await supabase
    .from('market_entry_missions')
    .insert({
      owner_user_id: user.id,
      origin_iso2: plan.input.originIso2,
      destination_iso2: plan.input.destinationIso2,
      product_class: plan.input.productClass,
      status: plan.status,
      plan_version: plan.planVersion,
      plan_snapshot: plan,
      evidence_snapshot: plan.evidence,
      reproducibility_key: plan.reproducibilityKey,
    })
    .select('id, origin_iso2, destination_iso2, product_class, status, plan_version, reproducibility_key, created_at, updated_at')
    .single()

  if (missionError || !mission) return NextResponse.json({ error: 'Unable to persist the mission workspace.', detail: missionError?.message }, { status: 503 })

  const taskRows = plan.execution.tasks.map((task) => ({
    mission_id: mission.id,
    task_key: task.id,
    title: task.title,
    description: task.description,
    side: task.side,
    status: task.status,
    prerequisite_task_keys: task.prerequisiteIds,
    estimated_weeks: task.estimatedWeeks,
    evidence_ids: task.evidenceIds,
  }))
  if (taskRows.length) {
    const { error: taskError } = await supabase.from('market_entry_tasks').insert(taskRows)
    if (taskError) {
      await supabase.from('market_entry_missions').delete().eq('id', mission.id)
      return NextResponse.json({ error: 'Unable to persist mission tasks.', detail: taskError.message }, { status: 503 })
    }
  }

  const { error: eventError } = await supabase.from('market_entry_events').insert({
    mission_id: mission.id,
    actor_user_id: user.id,
    event_type: 'mission_created',
    to_status: plan.status,
    payload: { planVersion: plan.planVersion, reproducibilityKey: plan.reproducibilityKey },
  })
  if (eventError) {
    await supabase.from('market_entry_missions').delete().eq('id', mission.id)
    return NextResponse.json({ error: 'Unable to record the mission audit event.', detail: eventError.message }, { status: 503 })
  }

  return NextResponse.json({ mission, plan }, { status: 201 })
}
