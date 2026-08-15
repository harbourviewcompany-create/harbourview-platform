-- Gmail OAuth token storage (Phase 3: outreach drafts via Gmail API).
-- Service-role only — never exposed to anon. Single row, upserted on connect.
CREATE TABLE IF NOT EXISTS job_search.gmail_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_email TEXT,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_search.gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON job_search.gmail_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER gmail_tokens_updated_at
  BEFORE UPDATE ON job_search.gmail_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE job_search.outreach_messages
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS gmail_draft_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;
