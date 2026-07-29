import 'server-only'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ClinicalMyProfessional } from '@/lib/clinical/types'

export type ClinicalAuthOk = {
  ok: true
  userId: string
  professional: ClinicalMyProfessional | null
}

export type ClinicalAuthFail = {
  ok: false
  status: 401 | 403
  error: string
}

/** Require signed-in user. Does not require verified clinician. */
export async function requireClinicalUser(): Promise<ClinicalAuthOk | ClinicalAuthFail> {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, status: 401, error: 'Authentication required' }

  const supabase = await createClient()
  const { data } = await supabase.from('clinical_my_professional').select('*').maybeSingle()

  return {
    ok: true,
    userId: user.id,
    professional: (data as ClinicalMyProfessional | null) ?? null,
  }
}

/** Require verified clinician (RPC + link). */
export async function requireVerifiedClinician(): Promise<ClinicalAuthOk | ClinicalAuthFail> {
  const base = await requireClinicalUser()
  if (!base.ok) return base

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('is_verified_clinician', {
    p_user_id: base.userId,
  })

  if (error) {
    console.error('[clinical] is_verified_clinician rpc failed', error.message)
    return { ok: false, status: 403, error: 'Clinician verification check failed' }
  }

  if (!data) {
    return {
      ok: false,
      status: 403,
      error: 'Verified clinician credentials required',
    }
  }

  return base
}
