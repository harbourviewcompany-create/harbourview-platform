import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVerifiedClinician } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'
import { CLINICAL_DISCLAIMER } from '@/lib/clinical/types'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  patient_id: z.string().uuid(),
  encounter_id: z.string().uuid().optional().nullable(),
  recommendation_id: z.string().uuid().optional().nullable(),
  jurisdiction: z.string().trim().min(2).max(16),
  product_name: z.string().trim().min(1).max(240),
  product_code: z.string().trim().max(80).optional().nullable(),
  dose_text: z.string().trim().min(1).max(500),
  quantity: z.string().trim().max(120).optional().nullable(),
  directions: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(['draft', 'signed']).default('draft'),
})

export async function GET() {
  const auth = await requireVerifiedClinician()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_prescriptions')
    .select(
      'id,created_at,patient_id,prescriber_user_id,jurisdiction,product_name,dose_text,quantity,directions,status,signed_at',
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ prescriptions: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await requireVerifiedClinician()
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

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_prescriptions')
    .insert({
      patient_id: parsed.data.patient_id,
      encounter_id: parsed.data.encounter_id ?? null,
      recommendation_id: parsed.data.recommendation_id ?? null,
      prescriber_user_id: auth.userId,
      jurisdiction: parsed.data.jurisdiction.toUpperCase(),
      product_name: parsed.data.product_name,
      product_code: parsed.data.product_code ?? null,
      dose_text: parsed.data.dose_text,
      quantity: parsed.data.quantity ?? null,
      directions: parsed.data.directions ?? null,
      status: parsed.data.status,
      signed_at: parsed.data.status === 'signed' ? new Date().toISOString() : null,
    })
    .select(
      'id,created_at,patient_id,prescriber_user_id,jurisdiction,product_name,dose_text,quantity,directions,status,signed_at',
    )
    .single()

  if (error) {
    console.error('[clinical] prescription insert', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(
    { prescription: data, disclaimer: CLINICAL_DISCLAIMER },
    { status: 201 },
  )
}
