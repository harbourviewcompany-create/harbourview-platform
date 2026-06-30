/**
 * Intelligence worker queue connector.
 * Workers read job rows from intelligence_automation_tables,
 * process them, and write results back — rather than running ad-hoc via CLI.
 *
 * Job lifecycle:
 *   pending → in_progress → completed | failed
 *
 * Usage (in a worker entry point):
 *   import { claimNextJob, completeJob, failJob } from '@/lib/intelligence/queue-connector'
 */
import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface IntelligenceJob {
  id:          string
  job_type:    string
  payload:     Record<string, unknown>
  priority:    number
  attempts:    number
  max_attempts: number
  scheduled_at: string
  created_at:  string
}

function getAdminClient(): SupabaseClient<any, any, 'api'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('[harbourview:queue] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })
}

/**
 * Atomically claim the next pending job of a given type.
 * Uses FOR UPDATE SKIP LOCKED to prevent duplicate processing across parallel workers.
 */
export async function claimNextJob(
  jobType: string,
  workerId: string
): Promise<IntelligenceJob | null> {
  const supabase = getAdminClient()

  // Use an RPC that does atomic claim — define this in a migration if not present
  const { data, error } = await supabase.rpc('claim_intelligence_job', {
    p_job_type:  jobType,
    p_worker_id: workerId,
  })

  if (error) {
    console.error('[harbourview:queue] claimNextJob failed', error)
    return null
  }

  return data as IntelligenceJob | null
}

/**
 * Mark a job as completed with result data.
 */
export async function completeJob(
  jobId: string,
  result: Record<string, unknown>
): Promise<void> {
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('intelligence_jobs')
    .update({
      status:       'completed' as JobStatus,
      result,
      completed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) console.error('[harbourview:queue] completeJob failed', error)
}

/**
 * Mark a job as failed. Increments attempt counter.
 * If attempts >= max_attempts, status becomes 'failed'; otherwise reverts to 'pending'
 * so it can be retried by the next worker sweep.
 */
export async function failJob(
  jobId: string,
  errorMessage: string
): Promise<void> {
  const supabase = getAdminClient()

  const { data: job } = await supabase
    .from('intelligence_jobs')
    .select('attempts, max_attempts')
    .eq('id', jobId)
    .single()

  if (!job) return

  const nextAttempts  = (job.attempts ?? 0) + 1
  const exhausted     = nextAttempts >= (job.max_attempts ?? 3)
  const nextStatus: JobStatus = exhausted ? 'failed' : 'pending'

  await supabase
    .from('intelligence_jobs')
    .update({
      status:      nextStatus,
      attempts:    nextAttempts,
      last_error:  errorMessage,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', jobId)
}

/**
 * Enqueue a new intelligence job.
 */
export async function enqueueJob(
  jobType: string,
  payload: Record<string, unknown>,
  options: { priority?: number; scheduledAt?: Date } = {}
): Promise<string | null> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('intelligence_jobs')
    .insert({
      job_type:     jobType,
      payload,
      priority:     options.priority ?? 5,
      scheduled_at: (options.scheduledAt ?? new Date()).toISOString(),
      status:       'pending' as JobStatus,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[harbourview:queue] enqueueJob failed', error)
    return null
  }

  return data.id
}
