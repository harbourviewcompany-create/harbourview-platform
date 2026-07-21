-- Backfill: scraped marketplace candidates that reached needs_review without
-- the basics a reviewer needs (price, real title) are reclassified to
-- needs_enrichment. This clears the human review queue of ~527 rows that were
-- never actually reviewable -- confirmed via status history that status had
-- never once moved past needs_review for any row in this table.
--
-- Idempotent: only touches rows still in needs_review matching the junk
-- criteria, so re-running this after lib/scrapers/ingestor.ts's matching code
-- fix (same session, prevents recurrence) is a safe no-op.
update marketplace_candidates
set status = 'needs_enrichment'
where status = 'needs_review'
  and candidate_type = 'scraped'
  and (price_amount is null or title_public_draft is null or length(title_public_draft) < 5);
