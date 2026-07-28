import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireClinicalUser } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'
import { CLINICAL_ROLES } from '@/lib/clinical/types'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  licence_number: z.string().trim().min(2).max(120),
  licence_jurisdiction: z.string().trim().min(2).max(16),
  clinical_role: z.enum(CLINICAL_ROLES),
  professional_id: z.string().uuid().optional(),
})

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

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('clinical_request_verification', {
    p_licence_number: parsed.data.licence_number,
    p_licence_jurisdiction: parsed.data.licence_jurisdiction,
    p_clinical_role: parsed.data.clinical_role,
    p_professional_id: parsed.data.professional_id ?? null,
  })

  if (error) {
    console.error('[clinical] verification request failed', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ professionalId: data, status: 'pending_review' })
}
