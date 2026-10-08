-- Replay-only restoration of production's pg_trgm prerequisite.
-- The immediately-following reconstructed migration calls similarity(text, text),
-- but no recorded repository migration installs pg_trgm. This file exists only in
-- the temporary production-faithful replay workspace and is never a production
-- migration or migration-ledger entry.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
