-- Covering indexes for the 23 remaining unindexed foreign keys
-- (Supabase performance advisor / Jun 24 audit backlog item).
-- Applied to prod 2026-07-01 via MCP and registered in the ledger.
CREATE INDEX IF NOT EXISTS idx_coverage_gaps_resolved_by_source ON public.coverage_gaps (resolved_by_source_id);
CREATE INDEX IF NOT EXISTS idx_dead_letter_tasks_original_task ON public.dead_letter_tasks (original_task_id);
CREATE INDEX IF NOT EXISTS idx_discovery_documents_fetch_run ON public.discovery_documents (fetch_run_id);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_source_group ON public.discovery_sources (source_group_id);
CREATE INDEX IF NOT EXISTS idx_extraction_contradictions_document ON public.extraction_contradictions (document_id);
CREATE INDEX IF NOT EXISTS idx_hv_entity_mentions_snapshot ON public.hv_entity_mentions (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_link_observations_source_candidate ON public.link_observations (source_candidate_id);
CREATE INDEX IF NOT EXISTS idx_link_observations_source ON public.link_observations (source_id);
CREATE INDEX IF NOT EXISTS idx_network_public_projections_published_by ON public.network_public_projections (published_by);
CREATE INDEX IF NOT EXISTS idx_network_review_items_created_by ON public.network_review_items (created_by);
CREATE INDEX IF NOT EXISTS idx_network_review_items_reviewed_by ON public.network_review_items (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_promotion_decisions_promoted_source ON public.promotion_decisions (promoted_source_id);
CREATE INDEX IF NOT EXISTS idx_promotion_decisions_review_queue_item ON public.promotion_decisions (review_queue_item_id);
CREATE INDEX IF NOT EXISTS idx_promotion_decisions_source_candidate ON public.promotion_decisions (source_candidate_id);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_duplicate_group ON public.signal_candidates (duplicate_group_id);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_source_document ON public.signal_candidates (source_document_id);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_source_chunk ON public.signal_candidates (source_chunk_id);
CREATE INDEX IF NOT EXISTS idx_signal_duplicate_groups_canonical_candidate ON public.signal_duplicate_groups (canonical_signal_candidate_id);
CREATE INDEX IF NOT EXISTS idx_source_candidates_discovered_from ON public.source_candidates (discovered_from_source_id);
CREATE INDEX IF NOT EXISTS idx_source_candidates_merged_into ON public.source_candidates (merged_into_source_id);
CREATE INDEX IF NOT EXISTS idx_source_fetch_jobs_source ON public.source_fetch_jobs (source_id);
CREATE INDEX IF NOT EXISTS idx_source_fetch_runs_job ON public.source_fetch_runs (job_id);
CREATE INDEX IF NOT EXISTS idx_source_watchlist_links_watchlist ON public.source_watchlist_links (watchlist_id);
