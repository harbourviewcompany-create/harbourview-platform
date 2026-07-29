import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVerifiedClinician } from '@/lib/clinical/auth'
import { CALCULATOR_REGISTRY, DOSING_ALGORITHM_VERSION } from '@/lib/clinical/dosing'
import { createClient } from '@/lib/supabase/server'
import { CLINICAL_DISCLAIMER } from '@/lib/clinical/types'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  patient_id: z.string().uuid(),
  encounter_id: z.string().uuid().optional().nullable(),
  jurisdiction: z.string().trim().min(2).max(16),
  calculator_key: z.literal('cannabinoid.weight_based.v1'),
  inputs: z.object({
    weightKg: z.number().positive().max(400),
    mgPerKgPerDay: z.number().positive().max(50),
    dosesPerDay: z.number().int().min(1).max(8),
    productThcPercent: z.number().min(0).max(100).optional().nullable(),
    productCbdPercent: z.number().min(0).max(100).optional().nullable(),
  }),
})

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

  const calc = CALCULATOR_REGISTRY[parsed.data.calculator_key]
  let outputs: ReturnType<typeof calc.compute>
  try {
    outputs = calc.compute(parsed.data.inputs)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Calculation failed' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_calculations')
    .insert({
      patient_id: parsed.data.patient_id,
      encounter_id: parsed.data.encounter_id ?? null,
      clinician_user_id: auth.userId,
      jurisdiction: parsed.data.jurisdiction.toUpperCase(),
      calculator_key: parsed.data.calculator_key,
      algorithm_version: DOSING_ALGORITHM_VERSION,
      inputs: parsed.data.inputs,
      outputs,
      unit: 'mg',
      status: 'computed',
    })
    .select('id,created_at,patient_id,calculator_key,algorithm_version,inputs,outputs,unit,status,jurisdiction')
    .single()

  if (error) {
    console.error('[clinical] calculation persist', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(
    {
      calculation: data,
      disclaimer: CLINICAL_DISCLAIMER,
    },
    { status: 201 },
  )
}
