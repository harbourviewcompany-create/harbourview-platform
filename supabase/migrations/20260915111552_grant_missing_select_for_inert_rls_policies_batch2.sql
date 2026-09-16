-- Restored from production migration ledger on 2026-09-16.
grant select on public.buyer_requests to anon, authenticated;
grant insert on public.buyer_requests to anon;
grant select on public.listings to anon, authenticated;
grant insert on public.listings to anon;
grant select, insert on public.network_interactions to authenticated;
grant select on public.network_introductions to authenticated;
grant select on public.network_introduction_events to authenticated;
grant select, insert, update on public.network_missions to authenticated;
grant select, insert, update on public.network_mission_requirements to authenticated;
grant select, insert, update, delete on public.talent_alerts to authenticated;
grant select, insert, update, delete on public.talent_saved_jobs to authenticated;
grant select, update on public.talent_applications to authenticated;
grant insert on public.talent_applications to anon, authenticated;
