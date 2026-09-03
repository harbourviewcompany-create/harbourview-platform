-- One-time backfill: strip leaked site-name suffixes ("Article Title - Site
-- Name") from already-stored signals.headline values, using the same
-- matching logic as the source-engine-fetch fix (deployed v49) -- including
-- matching against the article-source's own "Brand - Article Title" style
-- source_name (signals.source), not just a flat substring check.
--
-- Preview showed 411 of ~1,900 dash-suffixed headlines were genuine site-name
-- leaks (the rest were legitimate titles with a trailing dash clause, left
-- untouched). All 411 verified by manual sample before running. No unique
-- constraint on signals.headline, so no collision risk.

CREATE OR REPLACE FUNCTION public._backfill_strip_site_suffix(title text, source_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when source_name is null then title
    when (regexp_match(title, '\s+[-|–—]\s+([^-|–—]{2,60})$'))[1] is null then title
    else (
      with m as (
        select (regexp_match(title, '\s+[-|–—]\s+([^-|–—]{2,60})$'))[1] as suffix_raw,
               lower(trim(source_name)) as src
      ),
      m2 as (
        select lower(trim(suffix_raw)) as suffix, src,
               lower(trim((regexp_match(src, '^(.*?)\s+[-|–—]\s+'))[1])) as src_brand
        from m
      )
      select case
        when m2.suffix = m2.src or m2.src like '%'||m2.suffix||'%' or m2.suffix like '%'||m2.src||'%'
          or (m2.src_brand is not null and length(m2.src_brand) >= 3 and
              (m2.suffix = m2.src_brand or m2.src_brand like '%'||m2.suffix||'%' or m2.suffix like '%'||m2.src_brand||'%'))
        then regexp_replace(title, '\s+[-|–—]\s+[^-|–—]{2,60}$', '')
        else title
      end
      from m2
    )
  end;
$$;

update public.signals
set headline = public._backfill_strip_site_suffix(headline, source)
where public._backfill_strip_site_suffix(headline, source) <> headline;
