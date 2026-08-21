/**
 * Harbourview Talent — write / mutation operations
 * Session-aware. Callers must be authenticated.
 */

import { createClient } from '@/lib/supabase/server'; // adjust to actual path
import type { ApplicationStatus } from '@/types/talent';

export async function applyToTalentOpportunity(opts: {
  opportunityId: string;
  coverNote?: string | null;
  resumeUrl?: string | null;
  professionalProfileSnapshot?: Record<string, unknown> | null;
}): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication required to apply');
  }

  // Ensure the opportunity is published
  const { data: opp, error: oppError } = await supabase
    .from('talent_opportunities')
    .select('id, status')
    .eq('id', opts.opportunityId)
    .eq('status', 'published')
    .maybeSingle();

  if (oppError || !opp) {
    throw new Error('Opportunity not found or not open for applications');
  }

  const { data, error } = await supabase
    .from('talent_applications')
    .upsert(
      {
        opportunity_id: opts.opportunityId,
        user_id: user.id,
        status: 'submitted' as ApplicationStatus,
        cover_note: opts.coverNote ?? null,
        resume_url: opts.resumeUrl ?? null,
        professional_profile_snapshot:
          opts.professionalProfileSnapshot ?? null,
      },
      { onConflict: 'opportunity_id,user_id' }
    )
    .select('id')
    .single();

  if (error) {
    console.error('[talentOperations] apply error', error);
    throw error;
  }

  // Best-effort application_count increment
  await supabase.rpc('increment_talent_application_count', {
    opportunity_id: opts.opportunityId,
  }).maybeSingle();

  return { id: data.id };
}

export async function saveTalentJob(opportunityId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase.from('talent_saved_jobs').upsert({
    user_id: user.id,
    opportunity_id: opportunityId,
  });

  if (error) {
    console.error('[talentOperations] save error', error);
    throw error;
  }
}

export async function unsaveTalentJob(opportunityId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('talent_saved_jobs')
    .delete()
    .eq('user_id', user.id)
    .eq('opportunity_id', opportunityId);

  if (error) {
    console.error('[talentOperations] unsave error', error);
    throw error;
  }
}

export async function createTalentAlert(opts: {
  name?: string | null;
  jurisdictions?: string[];
  roleFamilies?: string[];
  locationTypes?: string[];
  minSalary?: number | null;
  frequency?: 'instant' | 'daily' | 'weekly';
}): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication required');
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
    .single();

  if (error) {
    console.error('[talentOperations] createAlert error', error);
    throw error;
  }

  return { id: data.id };
}
