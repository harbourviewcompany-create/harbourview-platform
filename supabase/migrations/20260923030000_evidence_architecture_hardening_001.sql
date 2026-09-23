-- Phase 1 is intentionally non-destructive: historical verified rows may predate
-- snapshot provenance. They remain visible to diagnostics but are not publication-grade.
-- Future writes are fail-closed so new verified facts cannot bypass provenance.

do $$
begin
  execute 'drop constraint if exists jurisdiction_regulatory_rules_verified_provenance_ck on public.jurisdiction_regulatory_rules';
  execute 'drop constraint if exists jurisdiction_regulators_verified_provenance_ck on public.jurisdiction_regulators';
  execute 'drop constraint if exists jurisdiction_regulatory_changes_verified_provenance_ck on public.jurisdiction_regulatory_changes';
  execute 'drop constraint if exists jurisdiction_market_participants_verified_provenance_ck on public.jurisdiction_market_participants';
  execute 'drop constraint if exists jurisdiction_relationships_verified_provenance_ck on public.jurisdiction_relationships';
  execute 'drop constraint if exists jurisdiction_opportunities_verified_provenance_ck on public.jurisdiction_opportunities';
end $$;

create or replace function public.enforce_verified_evidence_provenance()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.verification_status = 'verified' then
    if new.source_url is null or new.source_url !~ '^https://' then
      raise exception 'verified evidence requires an HTTPS source_url';
    end if;
    if new.source_snapshot_id is null then
      raise exception 'verified evidence requires source_snapshot_id';
    end if;
    if new.verified_at is null then
      raise exception 'verified evidence requires verified_at';
    end if;
    if tg_table_name = 'jurisdiction_regulatory_changes' and new.effective_at is null then
      raise exception 'verified regulatory changes require effective_at';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_verified_evidence_provenance() from public, anon, authenticated;
grant execute on function public.enforce_verified_evidence_provenance() to service_role;

drop trigger if exists jurisdiction_regulatory_rules_verified_provenance_trg on public.jurisdiction_regulatory_rules;
create trigger jurisdiction_regulatory_rules_verified_provenance_trg
before insert or update on public.jurisdiction_regulatory_rules
for each row execute function public.enforce_verified_evidence_provenance();

drop trigger if exists jurisdiction_regulators_verified_provenance_trg on public.jurisdiction_regulators;
create trigger jurisdiction_regulators_verified_provenance_trg
before insert or update on public.jurisdiction_regulators
for each row execute function public.enforce_verified_evidence_provenance();

drop trigger if exists jurisdiction_market_participants_verified_provenance_trg on public.jurisdiction_market_participants;
create trigger jurisdiction_market_participants_verified_provenance_trg
before insert or update on public.jurisdiction_market_participants
for each row execute function public.enforce_verified_evidence_provenance();

drop trigger if exists jurisdiction_relationships_verified_provenance_trg on public.jurisdiction_relationships;
create trigger jurisdiction_relationships_verified_provenance_trg
before insert or update on public.jurisdiction_relationships
for each row execute function public.enforce_verified_evidence_provenance();

drop trigger if exists jurisdiction_opportunities_verified_provenance_trg on public.jurisdiction_opportunities;
create trigger jurisdiction_opportunities_verified_provenance_trg
before insert or update on public.jurisdiction_opportunities
for each row execute function public.enforce_verified_evidence_provenance();

-- Regulatory changes also require an explicit effective date when verified.
drop trigger if exists jurisdiction_regulatory_changes_verified_provenance_trg on public.jurisdiction_regulatory_changes;
create trigger jurisdiction_regulatory_changes_verified_provenance_trg
before insert or update on public.jurisdiction_regulatory_changes
for each row execute function public.enforce_verified_evidence_provenance();

create or replace view public.v_jurisdiction_evidence_provenance_gates
with (security_invoker = on) as
with inventory as (
  select c.iso_alpha2 jurisdiction_key,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end jurisdiction_level,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then null else substring(c.iso_alpha2 from 1 for 2) end parent_jurisdiction_key
  from public.countries c
  where c.iso_alpha2 is not null
),
rule_gate as (
  select jurisdiction_key,
    count(*) filter (where verification_status='verified') verified_rows,
    count(*) filter (where verification_status='verified' and source_snapshot_id is null) missing_snapshot_rows,
    count(*) filter (where verification_status='verified' and source_url !~ '^https://') invalid_url_rows,
    count(*) filter (where verification_status='verified' and verified_at is null) missing_verification_rows,
    count(*) filter (where verification_status='conflict') conflict_rows
  from public.jurisdiction_regulatory_rules group by jurisdiction_key
),
reg_gate as (
  select jurisdiction_key,
    count(*) filter (where verification_status='verified') verified_rows,
    count(*) filter (where verification_status='verified' and source_snapshot_id is null) missing_snapshot_rows,
    count(*) filter (where verification_status='verified' and source_url !~ '^https://') invalid_url_rows,
    count(*) filter (where verification_status='verified' and verified_at is null) missing_verification_rows,
    count(*) filter (where verification_status='conflict') conflict_rows
  from public.jurisdiction_regulators group by jurisdiction_key
),
primary_gate as (
  select p.jurisdiction_iso2 jurisdiction_key,
    p.jurisdiction_level,
    p.parent_iso2,
    p.source_snapshot_sha256,
    p.expires_at,
    p.source_effective_date,
    case
      when p.jurisdiction_iso2 is null then 'missing'
      when p.source_snapshot_sha256 !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
      when p.expires_at <= now() then 'expired'
      when p.source_effective_date > current_date then 'future_effective_date'
      when p.jurisdiction_level <> i.jurisdiction_level then 'wrong_level'
      when p.parent_iso2 is distinct from i.parent_jurisdiction_key then 'wrong_parent'
      else 'valid'
    end status
  from inventory i
  left join public.regulatory_market_access_primary_sources p
    on p.jurisdiction_iso2=i.jurisdiction_key
)
select i.jurisdiction_key,i.jurisdiction_level,i.parent_jurisdiction_key,
  coalesce(r.verified_rows,0) verified_rule_rows,
  coalesce(r.missing_snapshot_rows,0) rule_rows_missing_snapshot,
  coalesce(r.invalid_url_rows,0) rule_rows_invalid_url,
  coalesce(r.missing_verification_rows,0) rule_rows_missing_verification,
  coalesce(r.conflict_rows,0) rule_conflict_rows,
  coalesce(g.verified_rows,0) verified_regulator_rows,
  coalesce(g.missing_snapshot_rows,0) regulator_rows_missing_snapshot,
  coalesce(g.invalid_url_rows,0) regulator_rows_invalid_url,
  coalesce(g.missing_verification_rows,0) regulator_rows_missing_verification,
  coalesce(g.conflict_rows,0) regulator_conflict_rows,
  coalesce(p.status,'missing') primary_source_status,
  (
    coalesce(r.missing_snapshot_rows,0)=0
    and coalesce(r.invalid_url_rows,0)=0
    and coalesce(r.missing_verification_rows,0)=0
    and coalesce(r.conflict_rows,0)=0
    and coalesce(g.missing_snapshot_rows,0)=0
    and coalesce(g.invalid_url_rows,0)=0
    and coalesce(g.missing_verification_rows,0)=0
    and coalesce(g.conflict_rows,0)=0
    and coalesce(p.status,'missing') in ('valid','missing')
  ) evidence_provenance_clean
from inventory i
left join rule_gate r on r.jurisdiction_key=i.jurisdiction_key
left join reg_gate g on g.jurisdiction_key=i.jurisdiction_key
left join primary_gate p on p.jurisdiction_key=i.jurisdiction_key;

create or replace function public.assert_full_depth_evidence_gates()
returns table (
  jurisdiction_count bigint,
  provenance_clean_jurisdictions bigint,
  jurisdictions_with_rule_conflicts bigint,
  jurisdictions_with_regulator_conflicts bigint,
  jurisdictions_missing_primary_source bigint,
  jurisdictions_with_invalid_primary_source bigint,
  jurisdictions_with_wrong_hierarchy bigint,
  gate_pass boolean
)
language sql stable security definer set search_path = public as $$
  with x as (select * from public.v_jurisdiction_evidence_provenance_gates)
  select
    count(*)::bigint,
    count(*) filter (where evidence_provenance_clean)::bigint,
    count(*) filter (where rule_conflict_rows>0)::bigint,
    count(*) filter (where regulator_conflict_rows>0)::bigint,
    count(*) filter (where primary_source_status='missing')::bigint,
    count(*) filter (where primary_source_status in ('expired','invalid_snapshot_hash','future_effective_date'))::bigint,
    count(*) filter (where primary_source_status in ('wrong_level','wrong_parent'))::bigint,
    (
      count(*)=291
      and count(*) filter (where rule_conflict_rows>0)=0
      and count(*) filter (where regulator_conflict_rows>0)=0
      and count(*) filter (where primary_source_status in ('expired','invalid_snapshot_hash','future_effective_date','wrong_level','wrong_parent'))=0
    )
  from x;
$$;

revoke all on function public.assert_full_depth_evidence_gates() from public, anon, authenticated;
grant execute on function public.assert_full_depth_evidence_gates() to service_role;

comment on view public.v_jurisdiction_evidence_provenance_gates is
  'Read-only evidence-quality gate. Verified structured facts require explicit provenance and successful snapshot references; subnational sources must match their own jurisdiction and parent key.';
