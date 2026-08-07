-- ============================================================
-- lib/dashboard/commandCentreLiveData.ts calls
-- supabase.rpc('get_command_centre_stats').maybeSingle(), wrapped in
-- .catch(() => ({ data: null, error: null })) with a comment noting
-- "avoids needing an RPC if it doesn't exist yet" — the function was
-- never created, so this has always silently no-op'd, and the same
-- stats get computed instead via ~8 separate inline round-trip
-- queries later in that file.
--
-- Production already had public.signals_quality and
-- public.admin_dashboard_counts out of band before this migration. Zero-state
-- replay restores their original contracts only when absent; later dated
-- migrations remain the owners of subsequent signal-quality refinements.
-- ============================================================

do $restore_initial_signals_quality$
begin
  if not exists (
    select 1
    from information_schema.views
    where table_schema = 'public'
      and table_name = 'signals_quality'
  ) then
    execute $view$
      create view public.signals_quality as
      select
        id,
        date,
        cat,
        pri,
        score,
        headline,
        summary,
        source,
        url,
        verification,
        tier,
        lang,
        company,
        country,
        in_network,
        lane_r,
        lane_e,
        lane_t,
        top_lane,
        query_pack,
        commercial_impact,
        reviewed,
        action,
        created_at,
        embedding_1024,
        embedding_model,
        embedded_at
      from public.signals
      where cat <> 'SOURCE_ENGINE'
         or (cat = 'SOURCE_ENGINE' and reviewed = true and score >= 50)
    $view$;
  end if;
end
$restore_initial_signals_quality$;

do $restore_admin_dashboard_counts$
begin
  if not exists (
    select 1
    from information_schema.views
    where table_schema = 'public'
      and table_name = 'admin_dashboard_counts'
  ) then
    execute $view$
      create view public.admin_dashboard_counts
      with (security_invoker = true)
      as
      select
        (select count(*) from public.listings
          where status::text = 'pending_review') as pending_listings,
        (select count(*) from public.buyer_requests
          where status::text = 'pending_review') as pending_buyer_requests,
        (select count(*) from public.marketplace_inquiries
          where review_status = 'received') as new_inquiries,
        (select count(*) from public.matches
          where status::text = 'proposed') as pending_matches,
        (select count(*) from public.disclosure_requests
          where status::text = 'requested') as pending_disclosures
    $view$;

    revoke all on table public.admin_dashboard_counts
      from public, anon, authenticated;
    grant select on table public.admin_dashboard_counts to service_role;
  end if;
end
$restore_admin_dashboard_counts$;

create or replace function public.get_command_centre_stats()
returns table (
  total_signals integer,
  urgent_signals integer,
  high_signals integer,
  monitor_signals integer,
  signal_countries integer,
  approved_listings integer,
  listing_categories integer,
  listing_countries integer,
  active_sources integer,
  inactive_sources integer,
  checked_last_24h integer,
  stale_sources integer,
  candidates_needs_review integer,
  pending_listings integer,
  pending_buyer_requests integer,
  new_inquiries integer,
  pending_matches integer,
  pending_disclosures integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    (select count(*) from public.signals_quality)::int,
    (select count(*) from public.signals_quality where upper(pri) = 'URGENT')::int,
    (select count(*) from public.signals_quality where upper(pri) = 'HIGH')::int,
    (select count(*) from public.signals_quality where upper(pri) = 'MONITOR')::int,
    (select count(distinct country) from public.signals_quality where country is not null)::int,
    (select count(*) from public.listings where status::text = 'approved')::int,
    (select count(distinct category) from public.listings)::int,
    (select count(distinct location_country) from public.listings where location_country is not null)::int,
    (select count(*) from public.source_registry where is_active is true)::int,
    (select count(*) from public.source_registry where is_active is not true)::int,
    (select count(*) from public.source_registry
       where last_checked_at is not null and now() - last_checked_at < interval '24 hours')::int,
    (select count(*) from public.source_registry
       where last_checked_at is null or now() - last_checked_at > interval '7 days')::int,
    (select count(*) from public.marketplace_candidates where status = 'needs_review')::int,
    (select pending_listings from public.admin_dashboard_counts)::int,
    (select pending_buyer_requests from public.admin_dashboard_counts)::int,
    (select new_inquiries from public.admin_dashboard_counts)::int,
    (select pending_matches from public.admin_dashboard_counts)::int,
    (select pending_disclosures from public.admin_dashboard_counts)::int;
$$;

comment on function public.get_command_centre_stats() is
  'Single-round-trip aggregate for the CommandCentre dashboard '
  '(lib/dashboard/commandCentreLiveData.ts). Replicates the semantics of '
  'the inline per-field queries that file falls back to, including '
  'source-health null-handling (is_active null/false both count as '
  'inactive; null last_checked_at counts as stale).';

create or replace function api.get_command_centre_stats()
returns table (
  total_signals integer,
  urgent_signals integer,
  high_signals integer,
  monitor_signals integer,
  signal_countries integer,
  approved_listings integer,
  listing_categories integer,
  listing_countries integer,
  active_sources integer,
  inactive_sources integer,
  checked_last_24h integer,
  stale_sources integer,
  candidates_needs_review integer,
  pending_listings integer,
  pending_buyer_requests integer,
  new_inquiries integer,
  pending_matches integer,
  pending_disclosures integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select * from public.get_command_centre_stats();
$$;

comment on function api.get_command_centre_stats() is
  'PostgREST-exposed wrapper for public.get_command_centre_stats().';

-- Read-only aggregate; service_role only, consistent with every other
-- wrapper this session (this project has no anon/authenticated dashboard
-- surface for this data outside the admin-authenticated app layer).
revoke all on function public.get_command_centre_stats() from public;
grant execute on function public.get_command_centre_stats() to service_role;
revoke all on function api.get_command_centre_stats() from public;
grant execute on function api.get_command_centre_stats() to service_role;
