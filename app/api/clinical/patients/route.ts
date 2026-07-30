import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVerifiedClinician } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const CreateSchema = z.object({
  jurisdiction: z.string().trim().min(2).max(16),
  given_name: z.string().trim().min(1).max(120),
  family_name: z.string().trim().min(1).max(120),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  sex_at_birth: z
    .enum(['female', 'male', 'intersex', 'unknown', 'unspecified'])
    .optional()
    .nullable(),
  external_mrn: z.string().trim().max(80).optional().nullable(),
})

export async function GET() {
  const auth = await requireVerifiedClinician()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_patients')
    .select(
      'id,created_at,updated_at,created_by,jurisdiction,status,given_name,family_name,date_of_birth,sex_at_birth,external_mrn',
    )
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[clinical] list patients', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ patients: data ?? [] })
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

  const parsed = CreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_patients')
    .insert({
      created_by: auth.userId,
      jurisdiction: parsed.data.jurisdiction.toUpperCase(),
      given_name: parsed.data.given_name,
      family_name: parsed.data.family_name,
      date_of_birth: parsed.data.date_of_birth ?? null,
      sex_at_birth: parsed.data.sex_at_birth ?? null,
      external_mrn: parsed.data.external_mrn ?? null,
      status: 'active',
    })
    .select(
      'id,created_at,updated_at,created_by,jurisdiction,status,given_name,family_name,date_of_birth,sex_at_birth,external_mrn',
    )
    .single()

  if (error) {
    console.error('[clinical] create patient', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ patient: data }, { status: 201 })
}
