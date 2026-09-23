-- Evidence architecture hardening 002.
-- A snapshot reference is qualifying only when the snapshot exists, has a
-- cryptographic hash, was captured successfully, contains retained text, and
-- corresponds to the registered source URL.

create or replace view public.v_jurisdiction_verified_snapshot_gate
with (security_invoker = on) as
select
  ss.id snapshot_id,
  ss.source_id,
  ss.raw_html_hash,
  ss.captured_at,
  case when ss.fetch_status ~ '^[0-9]{3},
  sr.source_url registered_source_url,
  case
    when ss.id is null then false
    when lower(ss.raw_html_hash) !~ '^[0-9a-f]{64} then false
    when ss.captured_at is null then false
    when ss.http_status is null or ss.http_status < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or lower(ss.raw_html_hash) !~ '^[0-9a-f]{64} then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end,
  sr.source_url registered_source_url,
  case
    when ss.id is null then false
    when ss.raw_html_hash !~ '^[0-9a-f]{64}$' then false
    when ss.captured_at is null then false
    when case when ss.fetch_status ~ '^[0-9]{3} is null or ss.http_status < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end is null or case when ss.fetch_status ~ '^[0-9]{3} < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end < 200 or case when ss.fetch_status ~ '^[0-9]{3} >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       case when ss.fetch_status ~ '^[0-9]{3}, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when case when ss.fetch_status ~ '^[0-9]{3} is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end is null then 'missing_http_status'
         when case when ss.fetch_status ~ '^[0-9]{3} < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end < 200 or case when ss.fetch_status ~ '^[0-9]{3} >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then false
    when ss.captured_at is null then false
    when ss.http_status is null or ss.http_status < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end,
  sr.source_url registered_source_url,
  case
    when ss.id is null then false
    when ss.raw_html_hash !~ '^[0-9a-f]{64}$' then false
    when ss.captured_at is null then false
    when case when ss.fetch_status ~ '^[0-9]{3} is null or ss.http_status < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end is null or case when ss.fetch_status ~ '^[0-9]{3} < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end < 200 or case when ss.fetch_status ~ '^[0-9]{3} >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       case when ss.fetch_status ~ '^[0-9]{3}, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when case when ss.fetch_status ~ '^[0-9]{3} is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end is null then 'missing_http_status'
         when case when ss.fetch_status ~ '^[0-9]{3} < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end < 200 or case when ss.fetch_status ~ '^[0-9]{3} >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end,
  sr.source_url registered_source_url,
  case
    when ss.id is null then false
    when ss.raw_html_hash !~ '^[0-9a-f]{64}$' then false
    when ss.captured_at is null then false
    when case when ss.fetch_status ~ '^[0-9]{3} is null or ss.http_status < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end is null or case when ss.fetch_status ~ '^[0-9]{3} < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end < 200 or case when ss.fetch_status ~ '^[0-9]{3} >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       case when ss.fetch_status ~ '^[0-9]{3}, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when case when ss.fetch_status ~ '^[0-9]{3} is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end is null then 'missing_http_status'
         when case when ss.fetch_status ~ '^[0-9]{3} < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end < 200 or case when ss.fetch_status ~ '^[0-9]{3} >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then false
    when ss.captured_at is null then false
    when ss.http_status is null or ss.http_status < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end,
  sr.source_url registered_source_url,
  case
    when ss.id is null then false
    when ss.raw_html_hash !~ '^[0-9a-f]{64}$' then false
    when ss.captured_at is null then false
    when case when ss.fetch_status ~ '^[0-9]{3} is null or ss.http_status < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end is null or case when ss.fetch_status ~ '^[0-9]{3} < 200 or ss.http_status >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end < 200 or case when ss.fetch_status ~ '^[0-9]{3} >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       ss.http_status, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end >= 300 then false
    when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select ss.id snapshot_id, ss.source_id, ss.raw_html_hash, ss.captured_at,
       case when ss.fetch_status ~ '^[0-9]{3}, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when ss.http_status is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end, sr.source_url registered_source_url,
       case
         when ss.raw_html_hash is null or ss.raw_html_hash !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
         when ss.captured_at is null then 'missing_fetched_at'
         when case when ss.fetch_status ~ '^[0-9]{3} is null then 'missing_http_status'
         when ss.http_status < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end is null then 'missing_http_status'
         when case when ss.fetch_status ~ '^[0-9]{3} < 200 or ss.http_status >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end < 200 or case when ss.fetch_status ~ '^[0-9]{3} >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
 then ss.fetch_status::integer else null end >= 300 then 'non_success_http_status'
         when coalesce(ss.captured_text, '') is null or length(coalesce(ss.captured_text, ''))=0 then 'missing_raw_payload'
         when sr.id is null then 'missing_source_registry_row'
         else 'unknown'
       end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be fetched successfully and retain the raw payload.';
