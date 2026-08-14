-- Reconciliation commit, 2026-08-13.
--
-- This migration was applied directly to the live project on 2026-08-12
-- 23:42:07 UTC and was never committed, so `Compare repository and live
-- migration ledgers` reported `applied_not_committed: 20260812234207` and
-- failed on every open pull request. The body below is the exact SQL recorded
-- in `supabase_migrations.schema_migrations` for that version, reproduced
-- verbatim so the repository once again describes production. Nothing is
-- re-applied: the statement is `CREATE TABLE IF NOT EXISTS`, and the table
-- already exists.
--
-- Observed while reconciling, deliberately NOT changed here because that would
-- reintroduce the drift this commit exists to close: the table has RLS
-- disabled. It is not exposed — `anon` and `authenticated` both have no SELECT
-- privilege, so only the service role reaches it — but the absence of RLS is a
-- latent risk if a grant is ever added. Enabling RLS is a separate, reviewable
-- change.

-- Without attempt-memory, source-discovery-engine re-selects the same
-- permanently-failing (iso, class) pairs every run (confirmed live: 5 runs,
-- barely past Afghanistan) since a failed attempt never leaves the "missing"
-- set. This table lets the function prioritize never-tried pairs first, then
-- oldest-attempted, so it actually advances through the full country list
-- instead of stalling on the first alphabetical country.

CREATE TABLE IF NOT EXISTS public.source_discovery_attempts (
  iso text NOT NULL,
  regulator_class text NOT NULL,
  attempt_count int NOT NULL DEFAULT 0,
  last_attempted_at timestamptz,
  last_provider text,
  last_succeeded boolean,
  last_error text,
  PRIMARY KEY (iso, regulator_class)
);

COMMENT ON TABLE public.source_discovery_attempts IS 'Attempt-memory for source-discovery-engine so it advances through the full (country, regulator_class) space instead of re-retrying the same failing pairs every run forever. Added 2026-08-12.';
