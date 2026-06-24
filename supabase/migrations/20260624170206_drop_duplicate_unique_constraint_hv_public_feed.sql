-- hv_public_feed had two separate UNIQUE constraints on artifact_id
-- (hv_public_feed_artifact_id_key and hv_public_feed_artifact_unique),
-- flagged by Supabase performance advisor as duplicate indexes.
-- Drop the explicitly-named one, keep the column-constraint-style one.
ALTER TABLE public.hv_public_feed DROP CONSTRAINT hv_public_feed_artifact_unique;
