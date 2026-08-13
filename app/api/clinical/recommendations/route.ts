import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVerifiedClinician } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'
import { APPROPRIATENESS_CLAIMS, CLINICAL_DISCLAIMER } from '@/lib/clinical/types'

export const dynamic = 'force-dynamic'

const RECOMMENDATION_EVIDENCE_VERSION = '2026.08.clinical.1'

const BodySchema = z.object({
  patient_id: z.string().uuid(),
  encounter_id: z.string().uuid().optional().nullable(),
  calculation_id: z.string().uuid().optional().nullable(),
  jurisdiction: z.string().trim().min(2).max(16),
  recommendation_key: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(8).max(2000),
  detail: z.record(z.string(), z.unknown()).optional(),
  appropriateness_claim: z.enum(APPROPRIATENESS_CLAIMS).optional().nullable(),
  appropriateness_rationale: z.string().trim().max(4000).optional().nullable(),
  clinician_attestation_note: z.string().trim().max(1000).optional().nullable(),
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

  if (parsed.data.appropriateness_claim && !parsed.data.appropriateness_rationale) {
    return NextResponse.json(
      { error: 'appropriateness_rationale required when claim is set' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_recommendations')
    .insert({
      patient_id: parsed.data.patient_id,
      encounter_id: parsed.data.encounter_id ?? null,
      calculation_id: parsed.data.calculation_id ?? null,
      clinician_user_id: auth.userId,
      jurisdiction: parsed.data.jurisdiction.toUpperCase(),
      recommendation_key: parsed.data.recommendation_key,
      evidence_version: RECOMMENDATION_EVIDENCE_VERSION,
      summary: parsed.data.summary,
      detail: parsed.data.detail ?? {},
      appropriateness_claim: parsed.data.appropriateness_claim ?? null,
      appropriateness_rationale: parsed.data.appropriateness_rationale ?? null,
      clinician_attestation_note: parsed.data.clinician_attestation_note ?? null,
      status: 'active',
    })
    .select(
      'id,created_at,patient_id,recommendation_key,evidence_version,summary,appropriateness_claim,appropriateness_rationale,status,jurisdiction',
    )
    .single()

  if (error) {
    console.error('[clinical] recommendation insert', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(
    {
      recommendation: data,
      disclaimer: CLINICAL_DISCLAIMER,
    },
    { status: 201 },
  )
}
