-- Build the regulatory-calendar layer from already verified pathways only.
-- No future event is inferred; each row is an effective-date record tied to a
-- verified pathway with a primary source URL.

insert into public.regulatory_calendar
(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select rp.iso_alpha2,
       'effective',
       rp.name || ' — effective date',
       'Verified regulatory pathway effective date recorded from the pathway primary source.',
       rp.effective_date,
       'confirmed',
       rp.source_urls[1],
       coalesce(sr.source_name,'Primary regulatory source'),
       case when rp.effective_date <= current_date then 'effective' else 'scheduled' end
from public.regulatory_pathways rp
left join lateral (
  select source_name from public.source_registry
  where source_url=rp.source_urls[1] and is_active=true
  order by tier asc limit 1
) sr on true
where rp.verification='verified'
  and rp.effective_date is not null
  and cardinality(rp.source_urls) > 0
  and not exists (
    select 1 from public.regulatory_calendar rc
    where rc.iso2=rp.iso_alpha2
      and rc.title=rp.name || ' — effective date'
      and rc.expected_date=rp.effective_date
  );
