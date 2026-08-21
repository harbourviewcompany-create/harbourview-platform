/**
 * Harbourview Talent — write / mutation operations
 * Session-aware. Callers must be authenticated for save/alerts.
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function saveTalentJob(opportunityId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Authentication required')
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
    throw new Error('Authentication required')
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
    throw new Error('Authentication required')
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
