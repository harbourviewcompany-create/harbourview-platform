-- Repair the production 291x32 state matrix after the initial control-plane migration
-- was unable to materialize rows under the project's RLS execution context.
-- This migration is idempotent and does not create regulatory facts.
create or replace function public.__harbourview_backfill_291x32_matrix()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as 'declare v_j integer; v_m integer;
begin
  execute ''alter table public.jurisdiction_data_depth_dimension_state disable row level security'';
  insert into public.jurisdiction_data_depth_dimension_state
    (jurisdiction_key, dimension_key, contract_version)
  select c.iso_alpha2, d.dimension_key, d.contract_version
  from public.countries c
  cross join public.jurisdiction_data_depth_dimensions d
  where d.contract_version = ''2026-09-23.v2''
  on conflict (jurisdiction_key, dimension_key, contract_version) do nothing;

  update public.jurisdiction_data_depth_dimension_state s
  set applicability = ''applicable'',
      status = ''complete'',
      evidence_basis = ''canonical countries registry'',
      last_evaluated_at = now(),
      updated_at = now()
  where s.contract_version = ''2026-09-23.v2''
    and s.dimension_key = ''identity'';

  update public.jurisdiction_data_depth_dimension_state s
  set applicability = ''applicable'',
      status = ''complete'',
      evidence_basis = ''canonical jurisdiction registry'',
      last_evaluated_at = now(),
      updated_at = now()
  where s.contract_version = ''2026-09-23.v2''
    and s.dimension_key = ''hierarchy'';

  update public.jurisdiction_data_depth_dimension_state s
  set applicability = ''applicable'',
      status = case
        when c.verified_regulatory_tier is not null
         and c.regulatory_tier_evidence_key is not null then ''complete''
        else ''missing''
      end,
      evidence_count = case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
      primary_source_count = case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
      evidence_basis = case
        when c.regulatory_tier_evidence_key is not null then ''countries.regulatory_tier_evidence_key''
        else ''missing authoritative tier evidence''
      end,
      last_evaluated_at = now(),
      updated_at = now()
  from public.countries c
  where s.jurisdiction_key = c.iso_alpha2
    and s.dimension_key = ''regulatory_tier''
    and s.contract_version = ''2026-09-23.v2'';

  select count(distinct jurisdiction_key), count(*)
    into v_j, v_m
  from public.jurisdiction_data_depth_dimension_state
  where contract_version = ''2026-09-23.v2'';

  if v_j <> 291 or v_m <> 9312 then
    raise exception ''291x32 backfill failed: jurisdictions %, matrix rows %, expected 291/9312'', v_j, v_m;
  end if;

  execute ''alter table public.jurisdiction_data_depth_dimension_state enable row level security'';
  execute ''alter table public.jurisdiction_data_depth_dimension_state force row level security'';
end';
select public.__harbourview_backfill_291x32_matrix();
drop function public.__harbourview_backfill_291x32_matrix();