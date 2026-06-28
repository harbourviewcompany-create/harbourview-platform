-- Intelligence job queue table.
-- Workers read from this table via claim_intelligence_job() RPC.
-- Connects scripts/engine/* workers to intelligence_automation_tables.

CREATE TABLE IF NOT EXISTS public.intelligence_jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type      text        NOT NULL,
  payload       jsonb       NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','in_progress','completed','failed')),
  priority      int         NOT NULL DEFAULT 5,
  attempts      int         NOT NULL DEFAULT 0,
  max_attempts  int         NOT NULL DEFAULT 3,
  worker_id     text,
  result        jsonb,
  last_error    text,
  scheduled_at  timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_jobs_claim
  ON public.intelligence_jobs (job_type, status, priority DESC, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_intelligence_jobs_status
  ON public.intelligence_jobs (status, updated_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_intelligence_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_intelligence_jobs_updated_at ON public.intelligence_jobs;
CREATE TRIGGER trg_intelligence_jobs_updated_at
  BEFORE UPDATE ON public.intelligence_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_intelligence_jobs_updated_at();

-- Atomic job claim RPC — FOR UPDATE SKIP LOCKED prevents duplicate processing
CREATE OR REPLACE FUNCTION public.claim_intelligence_job(
  p_job_type  text,
  p_worker_id text
)
RETURNS SETOF public.intelligence_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_job public.intelligence_jobs;
BEGIN
  SELECT *
    INTO v_job
    FROM public.intelligence_jobs
   WHERE job_type   = p_job_type
     AND status     = 'pending'
     AND scheduled_at <= now()
   ORDER BY priority DESC, scheduled_at ASC
   LIMIT 1
     FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.intelligence_jobs
     SET status     = 'in_progress',
         worker_id  = p_worker_id,
         started_at = now(),
         updated_at = now()
   WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN NEXT v_job;
END;
$$;

-- RLS
ALTER TABLE public.intelligence_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_jobs FORCE ROW LEVEL SECURITY;

-- Workers use service_role — no authenticated user policies needed
-- Admin users can read job status
CREATE POLICY "intelligence_jobs_admin_read"
  ON public.intelligence_jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

REVOKE ALL ON public.intelligence_jobs FROM anon;
GRANT SELECT ON public.intelligence_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_intelligence_job(text, text) TO service_role;
