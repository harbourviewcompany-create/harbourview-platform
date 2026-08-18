import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVerifiedClinician } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  patient_id: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

const CreateSchema = z.object({
  patient_id: z.string().uuid(),
  encounter_id: z.string().uuid().optional().nullable(),
  jurisdiction: z.string().trim().min(2).max(16),
  formulary_product_id: z.string().uuid().optional().nullable(),
  formulary_sku_id: z.string().uuid().optional().nullable(),
  suspected_product_name: z.string().trim().min(1).max(300),
  lot_number: z.string().trim().max(200).optional().nullable(),
  event_summary: z.string().trim().min(4).max(8000),
  seriousness: z.enum(['serious', 'non-serious', 'unknown']).optional().default('unknown'),
  onset_at: z.string().datetime().optional().nullable(),
  concomitant_products: z.array(z.string().trim().min(1).max(300)).max(100).optional().default([]),
  action_taken: z.string().trim().max(4000).optional().nullable(),
  outcome: z.string().trim().max(4000).optional().nullable(),
  authority_report_required: z.boolean().optional().nullable(),
  authority_report_status: z.enum(['not-assessed', 'not-required', 'pending', 'submitted', 'failed']).optional().default('not-assessed'),
  authority_report_reference: z.string().trim().max(500).optional().nullable(),
  authority_reported_at: z.string().datetime().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const auth = await requireVerifiedClinician()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const parsed = QuerySchema.safeParse({
    patient_id: request.nextUrl.searchParams.get('patient_id') ?? '',
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'patient_id required', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_adverse_events')
    .select('id,created_at,updated_at,patient_id,encounter_id,jurisdiction,formulary_product_id,formulary_sku_id,suspected_product_name,lot_number,event_summary,seriousness,onset_at,concomitant_products,action_taken,outcome,authority_report_required,authority_report_status,authority_report_reference,authority_reported_at,status')
    .eq('patient_id', parsed.data.patient_id)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit)

  if (error) {
    const status = /permission|row-level security|42501/i.test(error.message) ? 403 : 400
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ adverseEvents: data ?? [] }, {
    headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireVerifiedClinician()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: professional } = await supabase
    .from('clinical_my_professional')
    .select('id')
    .maybeSingle()

  const { data, error } = await supabase
    .from('clinical_adverse_events')
    .insert({
      patient_id: parsed.data.patient_id,
      encounter_id: parsed.data.encounter_id ?? null,
      reporter_user_id: auth.userId,
      professional_id: professional?.id ?? null,
      jurisdiction: parsed.data.jurisdiction.toUpperCase(),
      formulary_product_id: parsed.data.formulary_product_id ?? null,
      formulary_sku_id: parsed.data.formulary_sku_id ?? null,
      suspected_product_name: parsed.data.suspected_product_name,
      lot_number: parsed.data.lot_number ?? null,
      event_summary: parsed.data.event_summary,
      seriousness: parsed.data.seriousness,
      onset_at: parsed.data.onset_at ?? null,
      concomitant_products: parsed.data.concomitant_products,
      action_taken: parsed.data.action_taken ?? null,
      outcome: parsed.data.outcome ?? null,
      authority_report_required: parsed.data.authority_report_required ?? null,
      authority_report_status: parsed.data.authority_report_status,
      authority_report_reference: parsed.data.authority_report_reference ?? null,
      authority_reported_at: parsed.data.authority_reported_at ?? null,
      status: 'open',
    })
    .select('id,created_at,patient_id,encounter_id,jurisdiction,suspected_product_name,lot_number,seriousness,onset_at,authority_report_required,authority_report_status,authority_report_reference,authority_reported_at,status')
    .single()

  if (error) {
    const status = /permission|row-level security|42501|consent_required/i.test(error.message) ? 403 : 400
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({
    adverseEvent: data,
    reportingBoundary: 'Recorded in Harbourview only. No external regulator submission was performed.',
  }, { status: 201 })
}
