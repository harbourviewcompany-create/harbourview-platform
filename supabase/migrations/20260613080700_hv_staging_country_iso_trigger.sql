-- hv_staging_country_iso_trigger: auto-populate proposed_country_iso on hv_import_staging insert
-- Applied: 2026-06-13

-- Backfill source_registry.iso from country name
update public.source_registry set iso = case country
  when 'USA'          then 'US'
  when 'Canada'       then 'CA'
  when 'UK'           then 'GB'
  when 'Netherlands'  then 'NL'
  when 'Israel'       then 'IL'
  when 'Australia'    then 'AU'
  when 'Uruguay'      then 'UY'
  when 'Colombia'     then 'CO'
  when 'Spain'        then 'ES'
  when 'Thailand'     then 'TH'
  when 'Sweden'       then 'SE'
  when 'South Africa' then 'ZA'
  when 'Brazil'       then 'BR'
  else null
end
where iso is null and country is not null
  and country not in ('Global','Europe','LATAM','Africa','Asia','Pacific','Middle East');

-- Backfill proposed_country_iso on existing staging rows
update public.hv_import_staging sis
set
  proposed_country_iso  = sr.iso,
  proposed_jurisdiction = coalesce(sis.proposed_jurisdiction, sr.jurisdiction_code, sr.jurisdiction)
from public.source_snapshots ss
join public.source_registry sr on sr.id = ss.source_id
where ss.id::text = sis.source_record_id
  and sis.proposed_country_iso is null
  and sr.iso is not null;

-- Trigger function
create or replace function public.hv_staging_backfill_country_iso()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.proposed_country_iso is null and new.source_record_id is not null then
    select sr.iso, coalesce(sr.jurisdiction_code, sr.jurisdiction)
    into new.proposed_country_iso, new.proposed_jurisdiction
    from public.source_snapshots ss
    join public.source_registry sr on sr.id = ss.source_id
    where ss.id::text = new.source_record_id
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists hv_staging_country_iso_fill on public.hv_import_staging;
create trigger hv_staging_country_iso_fill
  before insert on public.hv_import_staging
  for each row execute function public.hv_staging_backfill_country_iso();
