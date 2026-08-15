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
-- version 20260710170151.
--
-- Rewriting this file cannot affect production: 20260710170151 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

grant select on public.trade_flows to anon, authenticated;
grant select on public.market_metrics to anon, authenticated;
grant select on public.hv_public_profile_snapshots to anon, authenticated;

grant select on public.subscriptions to authenticated;
grant select on public.deal_room_messages to authenticated;
grant select on public.hv_evidence_documents to authenticated;
grant select on public.cc_org_pathway_progress to authenticated;
grant select on public.cc_org_requirement_status to authenticated;
grant select on public.cc_watch_rules to authenticated;
grant select on public.cc_watchlist_items to authenticated;
grant select on public.cc_watchlist_notifications to authenticated;

grant select on public.workspace_members to authenticated;

notify pgrst, 'reload schema';
