-- Reconstructed from production by auto-reconcile-migration-drift.mjs.
-- This version was applied directly against production (outside
-- apply_migration) and had no corresponding repository file, which is
-- exactly what "Compare repository and live migration ledgers" checks for.
-- Statements below are verbatim from supabase_migrations.schema_migrations
-- for version 20260915111552. Adding this file cannot affect production: the
-- version is already applied, so a future `supabase db push` skips it.
-- Auto-generated -- review before merging, same as any other PR.

-- Every table below already has correct, existing RLS policies that have been
-- completely inert since they have no baseline GRANT at all -- Postgres denies
-- at the grant-check step before RLS is ever evaluated. Granting exactly what
-- each table's own policies already expect, nothing broader.

-- buyer_requests_public_read (anon,authenticated) + buyer_requests_anon_insert (anon)
grant select on public.buyer_requests to anon, authenticated;
grant insert on public.buyer_requests to anon;

-- listings_select (anon,authenticated) + listings_anon_insert (anon)
grant select on public.listings to anon, authenticated;
grant insert on public.listings to anon;

-- network_* family: authenticated + hv_network_active_workspace_member() workspace check.
-- Paid B2B "network" feature (intros/missions) -- currently unreachable for real
-- workspace members, not just anon.
grant select, insert on public.network_interactions to authenticated;
grant select on public.network_introductions to authenticated;
grant select on public.network_introduction_events to authenticated;
grant select, insert, update on public.network_missions to authenticated;
grant select, insert, update on public.network_mission_requirements to authenticated;

-- talent_alerts_own / talent_saved_jobs_own: FOR ALL, auth.uid() ownership.
grant select, insert, update, delete on public.talent_alerts to authenticated;
grant select, insert, update, delete on public.talent_saved_jobs to authenticated;

-- talent_applications: anon,authenticated can insert (apply without an account);
-- authenticated can read/update only their own.
grant select, update on public.talent_applications to authenticated;
grant insert on public.talent_applications to anon, authenticated;
