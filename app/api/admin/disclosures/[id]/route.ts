import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'
import { disclosureApprovalSchema } from '@/lib/marketplace/validation'
import { writeAuditEvent } from '@/lib/marketplace/audit'
import type { DisclosureApprovalInsert } from '@/lib/supabase/types'

interface Context { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: Context) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { id } = await context.params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const action = (body as Record<string, unknown>)?.action as string
  if (!['approve', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'action must be "approve" or "decline"' }, { status: 422 })
  }

  try {
    const db = createAdminClient()

    // Verify exists and is in requested state
    const { data: existing, error: fetchErr } = await db
      .from('disclosure_requests').select('status, match_id').eq('id', id).single()
    if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.status !== 'requested') {
      return NextResponse.json({ error: `Already ${existing.status}` }, { status: 409 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'declined'
    const actor = req.headers.get('x-admin-actor') ?? 'admin'

    await db.from('disclosure_requests').update({
      status: newStatus,
      responded_at: new Date().toISOString(),
    }).eq('id', id)

    // If approved, create an approval record
    if (action === 'approve') {
      const parsedApproval = disclosureApprovalSchema.safeParse(body)
      if (parsedApproval.success) {
        const approvalInsert: DisclosureApprovalInsert = {
          disclosure_request_id: id,
          approved_by: parsedApproval.data.approved_by,
          approved_at: new Date().toISOString(),
          notes: parsedApproval.data.notes || null,
        }
        await db.from('disclosure_approvals').insert(approvalInsert)
      }
    }

    await writeAuditEvent({
      db, entityType: 'disclosure_request', entityId: id,
      action: `disclosure_request.${newStatus}`,
      actor,
      metadata: { match_id: existing.match_id },
    })

    return NextResponse.json({ ok: true, id, status: newStatus })
  } catch (err) {
    console.error('[Admin Disclosure PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: Context) {
  const authError = validateAdminRequest(req)
  if (authError) return authError
  const { id } = await context.params
  try {
    const db = createAdminClient()
    const { data, error } = await db.from('disclosure_requests').select('*').eq('id', id).single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ disclosure: data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
