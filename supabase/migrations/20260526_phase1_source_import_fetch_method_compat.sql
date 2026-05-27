begin;

-- Compatibility guard for the live source_registry_fetch_method_check constraint.
-- Live allowed values are: manual_url, blocked, rss, api, scraper.
-- HTML snapshot sources therefore use manual_url as the fetch_method while retaining adapter='html_snapshot'.

create or replace function public.hv_source_import_fetch_method(input_type text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'rss'
    when lower(coalesce(input_type, '')) in ('api', 'open api', 'json api') then 'api'
    else 'manual_url'
  end;
$$;

commit;
