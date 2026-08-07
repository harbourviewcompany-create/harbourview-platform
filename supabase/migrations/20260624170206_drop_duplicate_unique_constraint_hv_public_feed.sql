-- hv_public_feed historically had two separate UNIQUE constraints on artifact_id
-- (hv_public_feed_artifact_id_key and hv_public_feed_artifact_unique),
-- flagged by Supabase performance advisor as duplicate indexes.
--
-- Production removed the explicitly named duplicate and retains
-- hv_public_feed_artifact_id_key. Zero-state replay foundations already create
-- only that canonical constraint, so the cleanup must be state-aware.
alter table public.hv_public_feed
  drop constraint if exists hv_public_feed_artifact_unique;
