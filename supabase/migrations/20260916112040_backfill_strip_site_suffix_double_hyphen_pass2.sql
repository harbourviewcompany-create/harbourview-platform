-- Second backfill pass, following the source-engine-fetch v50 fix for the
-- double-hyphen source_name separator bug (source-side split regex didn't
-- match "Brand -- Article Title", so stripSiteSuffix silently failed for
-- every source using that convention -- ~89 already-stored headlines were
-- affected, on top of the 411 from the first backfill on 2026-08-31).

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
               lower(trim((regexp_match(src, '^(.*?)\s+(?:-{1,2}|\||–|—)\s+'))[1])) as src_brand
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
