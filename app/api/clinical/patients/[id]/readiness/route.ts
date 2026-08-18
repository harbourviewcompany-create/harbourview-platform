import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVerifiedClinician } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

const QuerySchema = z.object({
  country: z.string().trim().min(2).max(16),
})

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireVerifiedClinician()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid patient id' }, { status: 400 })
  }

  const query = QuerySchema.safeParse({
    country: request.nextUrl.searchParams.get('country') ?? '',
  })
  if (!query.success) {
    return NextResponse.json({ error: 'country required' }, { status: 400 })
  }
  const expectedJurisdiction = query.data.country.toUpperCase()

  const supabase = await createClient()
  const { data: patient, error: patientError } = await supabase
    .from('clinical_patients')
    .select('id,jurisdiction,status')
    .eq('id', id)
    .maybeSingle()

  if (patientError) {
    return NextResponse.json({ state: 'error', error: patientError.message }, { status: 500 })
  }
  if (!patient) {
    return NextResponse.json({ state: 'permission', error: 'Patient unavailable in this clinical access context.' }, { status: 404 })
  }
  if (String(patient.jurisdiction).toUpperCase() !== expectedJurisdiction) {
    return NextResponse.json(
      {
        state: 'error',
        error: 'Patient jurisdiction does not match the active Clinical jurisdiction.',
      },
      { status: 409 },
    )
  }

  const [treatmentConsent, dataConsent, encounterResult] = await Promise.all([
    supabase.rpc('clinical_has_active_consent', {
      p_patient_id: id,
      p_consent_type: 'treatment',
    }),
    supabase.rpc('clinical_has_active_consent', {
      p_patient_id: id,
      p_consent_type: 'data_processing',
    }),
    supabase
      .from('clinical_encounters')
      .select('id,started_at,jurisdiction,encounter_type,status')
      .eq('patient_id', id)
      .eq('jurisdiction', expectedJurisdiction)
      .eq('status', 'open')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const errors = [treatmentConsent.error, dataConsent.error, encounterResult.error].filter(Boolean)
  if (errors.length) {
    return NextResponse.json(
      {
        state: 'error',
        error: errors.map((error) => error?.message ?? '').filter(Boolean).join('; '),
      },
      { status: 500 },
    )
  }

  const hasTreatmentConsent = Boolean(treatmentConsent.data)
  const hasDataProcessingConsent = Boolean(dataConsent.data)

  return NextResponse.json(
    {
      state: 'loaded',
      patient: {
        id: patient.id,
        jurisdiction: patient.jurisdiction,
        status: patient.status,
      },
      consent: {
        treatment: hasTreatmentConsent,
        dataProcessing: hasDataProcessingConsent,
        core: hasTreatmentConsent && hasDataProcessingConsent,
      },
      openEncounter: encounterResult.data ?? null,
    },
    {
      headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
    },
  )
}
