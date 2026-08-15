import { createClient } from '@/lib/supabase/server'

export type TalentFeatureKey =
  | 'find_jobs'
  | 'find_talent'
  | 'external_ingestion'
  | 'candidate_semantic_search'
  | 'candidate_identity_disclosure'
  | 'applications'
  | 'professional_claiming'
  | 'canonical_job_reads'

export async function talentFeatureEnabled(featureKey: TalentFeatureKey) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_feature_enabled', { p_feature_key: featureKey })
  return !error && data === true
}
