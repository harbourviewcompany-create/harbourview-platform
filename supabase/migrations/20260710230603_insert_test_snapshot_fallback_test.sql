-- Reconstructed from production.
--
-- The production ledger statement for version 20260710230603 inserted a
-- transient test snapshot against source UUID
-- 431f3158-b037-471c-8ae7-af55efc8ea35. Fresh read-only production metadata
-- shows that source is no longer present and no recorded production migration
-- creates it. Repository zero-state replay also retains the legacy snapshot_hash
-- NOT NULL column from 20260303000000 although production no longer does.
--
-- Preserve the production-facing test payload, supply only a deterministic
-- replay compatibility hash, and execute the historical insert only when its
-- parent source exists. No source metadata is invented or reassociated.
--
-- Rewriting this file cannot affect production: 20260710230603 is already
-- recorded in schema_migrations and is skipped by production migration push.

INSERT INTO source_snapshots (
  source_id,
  snapshot_hash,
  captured_url,
  captured_title,
  captured_text,
  fetch_status,
  language_detected,
  processing_status,
  signal_candidates
)
SELECT
  source.id,
  md5('20260710230603:https://www.theguardian.com/world/2026/jul/10/thailand-cannabis-fallback-test'),
  'https://www.theguardian.com/world/2026/jul/10/thailand-cannabis-fallback-test',
  'TEST: Thailand health ministry cannabis inspection order',
  'Thailand''s Ministry of Public Health ordered stricter joint inspections of licensed cannabis cultivation sites this week, threatening suspension or revocation of licences for violations, following a string of cannabis seizures traced to Thai growers surfacing in the UK, Germany, Indonesia and Hong Kong.',
  'success',
  'en',
  'pending',
  NULL
FROM public.source_registry source
WHERE source.id = '431f3158-b037-471c-8ae7-af55efc8ea35'
RETURNING id;
