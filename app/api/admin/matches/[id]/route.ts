import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'
import { matchStatusUpdateSchema } from '@/lib/marketplace/validation'
import { canTransitionMatch } from '@/lib/marketplace/status'
import { writeAuditEvent, writeStatusHistory } from '@/lib/marketplace/audit'
import type { MatchStatus } from '@/lib/supabase/types'

interface Context { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: Context) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { id } = await context.params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = matchStatusUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }

  const { status: toStatus, notes } = parsed.data

  try {
    const db = createAdminClient()
    const { data: current, error: fetchErr } = await db.from('matches').select('status').eq('id', id).single()
    if (fetchErr || !current) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    const fromStatus = current.status as MatchStatus
    if (!canTransitionMatch(fromStatus, toStatus)) {
      return NextResponse.json({ error: `Invalid transition: ${fromStatus} → ${toStatus}` }, { status: 409 })
    }

    const updateFields: Record<string, unknown> = { status: toStatus }
    if (toStatus === 'introduced') updateFields.introduced_at = new Date().toISOString()
    if (toStatus === 'closed_won') { updateFields.closed_at = new Date().toISOString(); updateFields.closed_outcome = 'won' }
    if (toStatus === 'closed_lost') { updateFields.closed_at = new Date().toISOString(); updateFields.closed_outcome = 'lost' }

    const { error: updateErr } = await db.from('matches').update(updateFields).eq('id', id)
    if (updateErr) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    const actor = req.headers.get('x-admin-actor') ?? 'admin'
    await Promise.all([
      writeStatusHistory({ db, entityType: 'match', entityId: id, fromStatus, toStatus, changedBy: actor, reason: notes }),
      writeAuditEvent({ db, entityType: 'match', entityId: id, action: `match.${toStatus}`, actor, metadata: { from: fromStatus, notes } }),
    ])

    return NextResponse.json({ ok: true, id, status: toStatus })
  } catch (err) {
    console.error('[Admin Match PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: Context) {
  const authError = validateAdminRequest(req)
  if (authError) return authError
  const { id } = await context.params
  try {
    const db = createAdminClient()
    const { data, error } = await db.from('matches').select('*').eq('id', id).single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ match: data })
  } catch (err) {
    console.error('[Admin Match GET id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
