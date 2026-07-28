import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVerifiedClinician } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  jurisdiction: z.string().trim().min(2).max(16),
  consent_type: z.enum([
    'treatment',
    'data_processing',
    'sharing_with_care_team',
    'research_optional',
    'marketing_optional',
  ]),
  lawful_basis: z.enum([
    'consent',
    'contract',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests',
  ]),
  method: z.enum(['written', 'verbal', 'electronic', 'implied_documented']).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireVerifiedClinician()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: patientId } = await ctx.params
  if (!z.string().uuid().safeParse(patientId).success) {
    return NextResponse.json({ error: 'Invalid patient id' }, { status: 400 })
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
    .from('clinical_consent_records')
    .insert({
      patient_id: patientId,
      recorded_by: auth.userId,
      jurisdiction: parsed.data.jurisdiction.toUpperCase(),
      consent_type: parsed.data.consent_type,
      lawful_basis: parsed.data.lawful_basis,
      method: parsed.data.method ?? 'electronic',
      notes: parsed.data.notes ?? null,
      status: 'granted',
    })
    .select('id,patient_id,consent_type,lawful_basis,status,recorded_at,jurisdiction')
    .single()

  if (error) {
    console.error('[clinical] consent insert', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ consent: data }, { status: 201 })
}
