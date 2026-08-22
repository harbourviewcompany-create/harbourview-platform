/**
 * Harbourview Talent — write / mutation operations
 * Session-aware. Callers must be authenticated for save/alerts.
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * The message every unauthenticated path in this module throws. Exported so the
 * route handlers can map it to 401 without each of them restating the literal
 * and drifting from it.
 */
export const TALENT_AUTH_ERROR_MESSAGE = 'Authentication required'

/**
 * True only for the authentication failure this module raises.
 *
 * Deliberately requires an actual Error with the exact marker. Arbitrary thrown
 * strings, error-like objects, or Errors that merely contain this text are not
 * our authentication signal and must stay on the generic 500 path.
 */
export function isTalentAuthError(err: unknown): boolean {
  return err instanceof Error && err.message === TALENT_AUTH_ERROR_MESSAGE
}

export async function saveTalentJob(opportunityId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error(TALENT_AUTH_ERROR_MESSAGE)
  }

  const { error } = await supabase.from('talent_saved_jobs').upsert({
    user_id: user.id,
    opportunity_id: opportunityId,
  })

  if (error) {
    console.error('[talentOperations] save error', error)
    throw error
  }
}

export async function unsaveTalentJob(opportunityId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error(TALENT_AUTH_ERROR_MESSAGE)
  }

  const { error } = await supabase
    .from('talent_saved_jobs')
    .delete()
    .eq('user_id', user.id)
    .eq('opportunity_id', opportunityId)

  if (error) {
    console.error('[talentOperations] unsave error', error)
    throw error
  }
}

export async function createTalentAlert(opts: {
  name?: string | null
  jurisdictions?: string[]
  roleFamilies?: string[]
  locationTypes?: string[]
  minSalary?: number | null
  frequency?: 'instant' | 'daily' | 'weekly'
}): Promise<{ id: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error(TALENT_AUTH_ERROR_MESSAGE)
  }

  const { data, error } = await supabase
    .from('talent_alerts')
    .insert({
      user_id: user.id,
      name: opts.name ?? null,
      jurisdictions: opts.jurisdictions ?? [],
      role_families: opts.roleFamilies ?? [],
      location_types: opts.locationTypes ?? [],
      min_salary: opts.minSalary ?? null,
      frequency: opts.frequency ?? 'daily',
      is_active: true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[talentOperations] createAlert error', error)
    throw error
  }

  return { id: data.id }
}
