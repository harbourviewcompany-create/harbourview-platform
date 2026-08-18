import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireClinicalUser } from '@/lib/clinical/auth'
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
 * Auth: signed-in clinical user. Uses service role for write (RLS is read-only public).
 * Tighten to admin-only RPC before broad staff access.
 */
export async function POST(req: Request) {
  const auth = await requireClinicalUser()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
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

  const { entity, id, review_status, notes } = parsed.data
  // Map retired → under-review for evidence table which only allows published | under-review
  const evidenceStatus = review_status === 'retired' ? 'under-review' : review_status

  try {
    const admin = await createSupabaseServiceClient()
    if (entity === 'formulary') {
      const { error } = await admin
        .from('clinical_formulary_products')
        .update({
          review_status,
          updated_at: new Date().toISOString(),
          reviewed_by: auth.userId,
        })
        .eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    } else {
      const { error } = await admin
        .from('clinical_evidence_records')
        .update({
          review_status: evidenceStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      ok: true,
      entity,
      id,
      review_status: entity === 'evidence' ? evidenceStatus : review_status,
      notes: notes ?? null,
      actor: auth.userId,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Review update failed' },
      { status: 500 },
    )
  }
}

/** List under-review + published for admin queue */
export async function GET(req: Request) {
  const auth = await requireClinicalUser()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const url = new URL(req.url)
  const entity = url.searchParams.get('entity') ?? 'both'

  try {
    const admin = await createSupabaseServiceClient()
    const out: {
      evidence: unknown[]
      formulary: unknown[]
    } = { evidence: [], formulary: [] }

    if (entity === 'evidence' || entity === 'both') {
      const { data } = await admin
        .from('clinical_evidence_records')
        .select('id,slug,title,review_status,evidence_strength,jurisdictions,verified_at,updated_at')
        .order('updated_at', { ascending: false })
        .limit(100)
      out.evidence = data ?? []
    }
    if (entity === 'formulary' || entity === 'both') {
      const { data } = await admin
        .from('clinical_formulary_products')
        .select('id,slug,name,country_iso2,authorization_status,review_status,last_reviewed,updated_at')
        .order('updated_at', { ascending: false })
        .limit(100)
      out.formulary = data ?? []
    }

    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Review list failed' },
      { status: 500 },
    )
  }
}
