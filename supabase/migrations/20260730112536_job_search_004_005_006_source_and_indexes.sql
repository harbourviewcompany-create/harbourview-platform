ALTER TABLE job_search.jobs DROP CONSTRAINT IF EXISTS jobs_source_check;
ALTER TABLE job_search.jobs ADD CONSTRAINT jobs_source_check
  CHECK (source IN ('indeed', 'ziprecruiter', 'manual', 'adzuna', 'linkedin'));

CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON job_search.applications (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_resume_version_id ON job_search.applications (resume_version_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_contact_id ON job_search.outreach_messages (contact_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_application_id ON job_search.resume_versions (application_id);