import { NextResponse } from 'next/server'
import { requireClinicalUser } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'
import { CLINICAL_DISCLAIMER } from '@/lib/clinical/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireClinicalUser()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = await createClient()
  const { data: verified } = await supabase.rpc('is_verified_clinician', {
    p_user_id: auth.userId,
  })

  return NextResponse.json({
    userId: auth.userId,
    isVerifiedClinician: Boolean(verified),
    professional: auth.professional,
    disclaimer: CLINICAL_DISCLAIMER,
  })
}
