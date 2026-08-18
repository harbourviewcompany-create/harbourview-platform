-- Revoke PUBLIC/anon/authenticated EXECUTE on the api-schema drift RPCs.
--
-- LIVE EXPOSURE, measured against production 2026-08-15
--
--   api.get_tables_missing_from_api_schema()
--   api.get_functions_missing_from_api_schema()
--     proacl = {=X/postgres, postgres=X/postgres, service_role=X/postgres,
--               anon=X/postgres, authenticated=X/postgres}
--
-- The leading `=X/postgres` grants EXECUTE to the PUBLIC pseudo-role, and anon
-- and authenticated additionally hold it explicitly. The `api` schema is the
-- PostgREST-exposed one, so both functions are callable by anyone holding the
-- publishable anon key.
--
-- What they return is a list of tables and functions that exist in the database
-- but are NOT exposed through `api` -- i.e. an enumeration of internal object
-- names. That is schema reconnaissance available without authentication. No row
-- data is exposed, so this is disclosure of structure rather than of records,
-- but it is precisely the surface an attacker maps first.
--
-- The corresponding `public.*` functions are already correct
-- ({postgres, service_role} only), which is what makes the `api` wrappers the
-- gap rather than a deliberate design.
--
-- WHY THIS IS A NEW MIGRATION RATHER THAN AN EDIT
--
-- These exact statements already exist in the tree -- appended to
-- `20260810222500_harden_edge_function_cron_auth.sql` by commit 1f9660df
-- ("Harden schema drift RPC ACLs on current main", 2026-08-11, pushed straight
-- to main with no PR).
--
-- That migration is **pending and gated**: classified `separately_authorized`
-- in `pending-production-migration-decisions.json`, never applied to
-- production. Its content is bound by git blob hash, and appending to it broke
-- the binding -- expected c7174bb1, got 78f02bd8. That mismatch has been
-- failing `check-pending-production-migration-decisions.mjs` on pristine `main`
-- ever since, and is what blocks PR #1423.
--
-- There were two ways to clear it. Re-recording the hash would bless content
-- that reached main without review -- defeating the exact control the binding
-- exists to enforce. So instead `20260810222500` is restored to its bound
-- content (verified: the restored file hashes to c7174bb1 again) and the ACL
-- work is carried here, where it gets its own version, its own review, and no
-- entanglement with a release someone deliberately gated.
--
-- The security fix is therefore preserved, not discarded -- it just stops
-- riding along inside a migration that is not cleared to ship.
--
-- SAFETY
--
-- This only revokes. The sole caller is the `schema-drift-monitor` edge
-- function, which builds its client from SERVICE_ROLE_KEY and calls both RPCs
-- through it (verified in `supabase/functions/schema-drift-monitor/index.ts`).
-- service_role keeps EXECUTE, so the monitor is unaffected.
--
-- The schema-usage grant to service_role is retained from the original
-- statements: it is required for that role to reach the wrappers at all, and
-- schema usage alone exposes no object.
--
-- The public.* revokes look redundant -- those ACLs are already correct in
-- production. They are kept deliberately: they cost nothing (REVOKE on an
-- already-revoked privilege is a no-op, as is GRANT on one already held), they
-- make a fresh replay reach the same state rather than depending on history,
-- and `tests/security/edge-function-auth-hardening.test.ts` asserts both
-- schemas explicitly.
--
-- NOTE FOR FUTURE EDITORS: that test parses this file with regexes over the
-- lowercased text and does not skip comments. Do not write a literal GRANT or
-- REVOKE statement in prose here -- an earlier draft did, and the parser
-- counted the comment as a real statement.

grant usage on schema api to service_role;

revoke execute on function api.get_tables_missing_from_api_schema() from public, anon, authenticated;
revoke execute on function api.get_functions_missing_from_api_schema() from public, anon, authenticated;
grant execute on function api.get_tables_missing_from_api_schema() to service_role;
grant execute on function api.get_functions_missing_from_api_schema() to service_role;

revoke execute on function public.get_tables_missing_from_api_schema() from public, anon, authenticated;
revoke execute on function public.get_functions_missing_from_api_schema() from public, anon, authenticated;
grant execute on function public.get_tables_missing_from_api_schema() to service_role;
grant execute on function public.get_functions_missing_from_api_schema() to service_role;

revoke all on api.schema_drift_alerts from public, anon, authenticated;
grant select, insert on api.schema_drift_alerts to service_role;
