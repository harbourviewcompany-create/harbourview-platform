import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'
import { listingStatusUpdateSchema } from '@/lib/marketplace/validation'
import { canTransitionListing } from '@/lib/marketplace/status'
import { writeAuditEvent, writeStatusHistory } from '@/lib/marketplace/audit'
import type { ListingStatus } from '@/lib/supabase/types'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: Context) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { id } = await context.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = listingStatusUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { status: toStatus, reason } = parsed.data

  try {
    const db = createAdminClient()

    // Fetch current status
    const { data: current, error: fetchError } = await db
      .from('listings')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const fromStatus = current.status as ListingStatus

    // Validate transition
    if (!canTransitionListing(fromStatus, toStatus)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${fromStatus} → ${toStatus}` },
        { status: 409 }
      )
    }

    // Update
    const updateFields: Record<string, unknown> = { status: toStatus }
    if (toStatus === 'archived') updateFields.archived_at = new Date().toISOString()

    const { error: updateError } = await db
      .from('listings')
      .update(updateFields)
      .eq('id', id)

    if (updateError) {
      console.error('[Admin Listing PATCH]', updateError)
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
    }

    // Write status history + audit event (fire-and-forget pattern)
    const actor = req.headers.get('x-admin-actor') ?? 'admin'
    await Promise.all([
      writeStatusHistory({ db, entityType: 'listing', entityId: id, fromStatus, toStatus, changedBy: actor, reason }),
      writeAuditEvent({ db, entityType: 'listing', entityId: id, action: `listing.${toStatus}`, actor, metadata: { from: fromStatus, reason } }),
    ])

    return NextResponse.json({ ok: true, id, status: toStatus })
  } catch (err) {
    console.error('[Admin Listing PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: Context) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { id } = await context.params

  try {
    const db = createAdminClient()
    const { data, error } = await db.from('listings').select('*').eq('id', id).single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ listing: data })
  } catch (err) {
    console.error('[Admin Listing GET id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
