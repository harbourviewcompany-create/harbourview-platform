-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- Production no longer depends on the legacy snapshot_hash column, while a
-- zero-state repository replay still carries snapshot_hash NOT NULL from the
-- earlier source_snapshots contract. The deterministic hash below is therefore
-- a replay-only compatibility value. The historical fixture source was also
-- transient and is no longer present in production; preserve the original test
-- insert only when that parent source exists instead of inventing source data.
--
-- Rewriting this file cannot affect production: 20260712070915 is already
-- recorded in schema_migrations, so production migration execution skips it.

INSERT INTO public.source_snapshots (
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
  md5('20260712070915:https://www.theguardian.com/world/2026/jul/11/thailand-cannabis-3tier-test'),
  'https://www.theguardian.com/world/2026/jul/11/thailand-cannabis-3tier-test',
  'TEST: Thailand cannabis inspection order v3',
  'Thailand''s Ministry of Public Health tightened inspections of licensed cannabis farms this week following seizures of Thai-grown cannabis in the UK, Germany, Indonesia and Hong Kong.',
  'success',
  'en',
  'pending',
  NULL
FROM public.source_registry source
WHERE source.id = '431f3158-b037-471c-8ae7-af55efc8ea35'
RETURNING id;
