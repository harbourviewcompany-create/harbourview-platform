import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuthCheck } from '@/lib/auth/adminGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  entity: z.enum(['evidence', 'formulary']),
  id: z.string().uuid(),
  review_status: z.enum(['published', 'under-review', 'retired']),
  notes: z.string().max(2000).optional().nullable(),
})

/**
 * Publish / retire clinical evidence or formulary rows.
 * Auth: platform admin/operator only (adminGuard).
 */
export async function POST(req: Request) {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) {
    const status = auth.reason === 'missing_access_token' || auth.reason === 'invalid_access_token' ? 401 : 403
    return NextResponse.json({ error: 'Admin authentication required', reason: auth.reason }, { status })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const { entity, id, review_status } = parsed.data
  const evidenceStatus = review_status === 'retired' ? 'under-review' : review_status

  try {
    const admin = await createSupabaseServiceClient()
    if (entity === 'formulary') {
      const { error } = await admin
        .from('clinical_formulary_products')
        .update({
          review_status,
          updated_at: new Date().toISOString(),
          reviewed_by: auth.auth.user.id,
        })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    } else {
      const { error } = await admin
        .from('clinical_evidence_records')
        .update({
          review_status: evidenceStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      entity,
      id,
      review_status: entity === 'evidence' ? evidenceStatus : review_status,
      actor: auth.auth.user.id,
      roles: auth.auth.roles,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Review update failed' },
      { status: 500 },
    )
  }
}

export async function GET() {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) {
    const status = auth.reason === 'missing_access_token' || auth.reason === 'invalid_access_token' ? 401 : 403
    return NextResponse.json({ error: 'Admin authentication required', reason: auth.reason }, { status })
  }

  try {
    const admin = await createSupabaseServiceClient()
    const [ev, form] = await Promise.all([
      admin
        .from('clinical_evidence_records')
        .select('id,slug,title,review_status,evidence_strength,jurisdictions,verified_at,updated_at')
        .order('updated_at', { ascending: false })
        .limit(100),
      admin
        .from('clinical_formulary_products')
        .select('id,slug,name,country_iso2,authorization_status,review_status,last_reviewed,updated_at,brand_name,registration_code')
        .order('updated_at', { ascending: false })
        .limit(100),
    ])

    return NextResponse.json({
      evidence: ev.data ?? [],
      formulary: form.data ?? [],
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Review list failed' },
      { status: 500 },
    )
  }
}
