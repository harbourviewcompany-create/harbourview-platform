-- Replay-safe restoration of the api schema itself.
--
-- No recorded migration anywhere in the production ledger creates schema api;
-- it was created out of band, like the relations restored elsewhere in this
-- series. The repository only creates it in
-- 20260629210000_expose_cc_jurisdiction_briefings_api_schema.sql, but the
-- first migration that needs it is 20260626110925, three days earlier, so
-- zero-state replay fails there with schema "api" does not exist.
--
-- The three statements below are exactly the ones 20260629210000 already
-- uses. That migration keeps them, and because all three are idempotent it
-- simply becomes a no-op once this has run.
--
-- Matches the live schema: owner postgres, no privileges for PUBLIC, USAGE for
-- anon, authenticated and service_role.

create schema if not exists api authorization postgres;
revoke create on schema api from public;
grant usage on schema api to anon, authenticated, service_role;
