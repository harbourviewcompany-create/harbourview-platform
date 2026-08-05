-- Restore the production-owned async signal extraction queue that existed
-- before provider tracking was added but was never captured in repository
-- migration history. The following migration adds the provider column.
CREATE TABLE IF NOT EXISTS public._sig_extract_jobs (
  request_id bigint PRIMARY KEY,
  snapshot_id text,
  source_name text,
  captured_url text,
  collected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
