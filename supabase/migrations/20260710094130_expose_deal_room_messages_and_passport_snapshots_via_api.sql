-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710094130.
--
-- Rewriting this file cannot affect production: 20260710094130 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create view api.deal_room_messages as
select id, room_id, sender_id, message_type, body, attachments, read_at, created_at
from public.deal_room_messages;
grant select on api.deal_room_messages to anon, authenticated, service_role;

create view api.hv_public_profile_snapshots as
select id, org_id, snapshot_data, snapshot_version, generated_at
from public.hv_public_profile_snapshots;
grant select on api.hv_public_profile_snapshots to anon, authenticated, service_role;
