-- Add self-serve columns to marketplace_candidates

ALTER TABLE public.marketplace_candidates
  ADD COLUMN IF NOT EXISTS submitted_by      uuid   REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submission_source text   NOT NULL DEFAULT 'intelligence',
  ADD COLUMN IF NOT EXISTS submission_images jsonb  NOT NULL DEFAULT '[]'::jsonb;

-- Index for seller portal queries

CREATE INDEX IF NOT EXISTS marketplace_candidates_submitted_by_idx
  ON public.marketplace_candidates (submitted_by, discovered_at DESC)
  WHERE submitted_by IS NOT NULL;

-- RLS: sellers can insert and view their own submissions
-- (RLS must already be enabled; if not, enable it first)

ALTER TABLE public.marketplace_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated sellers can insert own candidates" ON public.marketplace_candidates;
CREATE POLICY "Authenticated sellers can insert own candidates"
  ON public.marketplace_candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND submission_source = 'self_serve'
  );

DROP POLICY IF EXISTS "Authenticated sellers can view own submissions" ON public.marketplace_candidates;
CREATE POLICY "Authenticated sellers can view own submissions"
  ON public.marketplace_candidates
  FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

GRANT INSERT, SELECT ON public.marketplace_candidates TO authenticated;

-- Storage policies for the submissions/ prefix in marketplace-item-originals

DROP POLICY IF EXISTS "Sellers upload submission images" ON storage.objects;
CREATE POLICY "Sellers upload submission images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'marketplace-item-originals'
    AND (storage.foldername(name))[1] = 'submissions'
  );

DROP POLICY IF EXISTS "Sellers read own submission images" ON storage.objects;
CREATE POLICY "Sellers read own submission images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'marketplace-item-originals'
    AND (storage.foldername(name))[1] = 'submissions'
  );
