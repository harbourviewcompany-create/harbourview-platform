-- Restore the exact production-owned body for migration 20260720134650.
-- The previous stub omitted public.excluded_source_domains, which later
-- migrations depend on.

-- Policy: never ingest/surface competitor or commercial-aggregator content. Primary sources + licensed feeds only.
create table if not exists public.excluded_source_domains (
  domain text primary key,
  reason text not null default 'competitor/aggregator',
  added_at timestamptz not null default now()
);

insert into public.excluded_source_domains(domain, reason) values
  ('mjbizdaily.com','competitor'),
  ('leafly.com','competitor'),
  ('leafwell.com','competitor'),
  ('herb.co','competitor'),
  ('hightimes.com','competitor'),
  ('cannabisnow.com','aggregator'),
  ('sensiseeds.com','competitor'),
  ('mugglehead.com','aggregator'),
  ('hempindustrydaily.com','competitor'),
  ('hemptoday.net','aggregator'),
  ('news.google.com','aggregator'),
  ('en.wikipedia.org','aggregator')
on conflict (domain) do nothing;

-- Un-publish anything already auto-promoted from an excluded domain (only auto rows; never human).
update public.signals s
set reviewed = false, reviewed_by = null, reviewed_at = null
where s.reviewed_by = 'auto:v1'
  and regexp_replace(s.url, '^https?://(www\.)?([^/]+).*', '\2') in (select domain from public.excluded_source_domains);

-- Promote now refuses excluded domains outright.
create or replace function public.hv_promote_signals(p_min_conf numeric default 0.0)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$fn$;