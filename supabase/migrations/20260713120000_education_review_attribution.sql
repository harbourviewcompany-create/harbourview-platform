-- Reviewer attribution for education_modules content review workflow.
--
-- content_review_status previously had no downstream consumer: a repo-wide
-- search found exactly one reference to this column (the migration that
-- sets it via the batch generation job). Nothing in application code reads
-- or gates on it, which is why AI-generated content lands in
-- publication_state = 'published' regardless of review status.
--
-- education_modules currently has SELECT-only RLS policies
-- (education_modules_admin_select, education_modules_public_select) and no
-- UPDATE policy. Writes go through lib/supabase/adminDataClient.ts's
-- service-role mutation helper (the established pattern for admin writes in
-- this codebase), which bypasses RLS by design; requireAdminAuth() is the
-- actual authorization gate, enforced before the server action runs.
--
-- This does NOT change publication_state or unpublish anything currently
-- live -- by explicit decision, existing published-but-unreviewed content
-- stays published. This only adds the ability to mark items reviewed going
-- forward.

alter table public.education_modules
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz;
