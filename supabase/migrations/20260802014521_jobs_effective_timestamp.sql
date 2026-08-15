ALTER TABLE job_search.jobs
  ADD COLUMN IF NOT EXISTS effective_at timestamptz
  GENERATED ALWAYS AS (
    COALESCE(posted_at::timestamp AT TIME ZONE 'UTC', fetched_at)
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_effective_at
  ON job_search.jobs (effective_at DESC, id ASC);