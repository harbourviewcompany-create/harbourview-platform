-- Corrects an earlier fix this same day (20260719190929): that migration
-- invented a 'needs_enrichment' status without knowing lib/marketplace/candidates.ts
-- already defines a strict CANDIDATE_STATUSES enum + ALLOWED_TRANSITIONS state
-- machine that does NOT include it. Candidates sitting in an unrecognized
-- status would show up in /admin/candidates (which lists with no status
-- filter) with zero available transitions -- a dead end, not a fix.
--
-- The existing state machine already has the right status for this exact
-- case: 'captured' -- explicitly the pre-review entry point, with an allowed
-- transition captured -> needs_review once ready. Using it instead of an
-- invented value.
update marketplace_candidates
set status = 'captured'
where status = 'needs_enrichment';
