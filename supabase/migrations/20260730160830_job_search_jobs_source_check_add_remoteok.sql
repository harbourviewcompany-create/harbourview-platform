ALTER TABLE job_search.jobs DROP CONSTRAINT IF EXISTS jobs_source_check;
ALTER TABLE job_search.jobs ADD CONSTRAINT jobs_source_check
  CHECK (source IN (
    'indeed', 'ziprecruiter', 'manual', 'adzuna', 'linkedin', 'remoteok'
  ));