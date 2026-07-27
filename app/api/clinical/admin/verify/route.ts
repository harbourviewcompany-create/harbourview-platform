import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireClinicalUser } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  professional_id: z.string().uuid(),
  approve: z.boolean(),
  notes: z.string().max(2000).optional().nullable(),
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
  const { error } = await supabase.rpc('clinical_admin_verify_professional', {
    p_professional_id: parsed.data.professional_id,
    p_approve: parsed.data.approve,
    p_notes: parsed.data.notes ?? null,
  })

  if (error) {
    console.error('[clinical] admin verify', error.message)
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  return NextResponse.json({ ok: true })
}
