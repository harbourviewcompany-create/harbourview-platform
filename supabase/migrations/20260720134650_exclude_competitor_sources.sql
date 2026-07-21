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

-- Robust host extraction: strips scheme, optional www., and everything from the
-- first '/', '?' or '#' onward, so subdomains and URLs with query params/anchors
-- resolve to their registrable host instead of producing false negatives.
create or replace function public.hv_extract_host(p_url text)
returns text
language sql
immutable
as $fn$
  select lower(regexp_replace(coalesce(p_url, ''), '^[a-zA-Z]+://(www\.)?([^/?#]+).*$', '\2'));
$fn$;

-- Un-publish anything already auto-promoted from an excluded domain.
-- Targets all non-human-reviewed rows (auto:v1 AND legacy seed rows that
-- predate reviewed_by metadata), not just reviewed_by = 'auto:v1'.
update public.signals s
set reviewed = false, reviewed_by = null, reviewed_at = null
where (s.reviewed_by = 'auto:v1' or s.reviewed_by is null)
  and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
  and exists (
    select 1 from public.excluded_source_domains d
    where d.domain = public.hv_extract_host(s.url)
  );

-- Promote now refuses excluded domains outright.
create or replace function public.hv_promote_signals(p_min_conf numeric default 0.0)
returns int
language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and not exists (
      select 1 from public.excluded_source_domains d
      where d.domain = public.hv_extract_host(s.url)
    );
  get diagnostics n = row_count;
  return n;
end$fn$;
