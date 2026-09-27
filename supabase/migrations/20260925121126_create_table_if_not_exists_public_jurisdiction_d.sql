-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925121126
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create table if not exists public.jurisdiction_data_depth_adjudication_rules (
 dimension_key text primary key references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
 requires_effective_date boolean not null default false,
 requires_jurisdiction_scope boolean not null default true,
 requires_rule_semantics boolean not null default false,
 min_quote_chars integer not null default 8,
 max_quote_chars integer not null default 1200,
 allowed_evidence_kinds text[] not null,
 required_payload_keys text[] not null default '{}',
 updated_at timestamptz not null default now()
);

alter table public.jurisdiction_data_depth_adjudication_rules enable row level security;
drop policy if exists "full depth adjudication rules read" on public.jurisdiction_data_depth_adjudication_rules;
create policy "full depth adjudication rules read" on public.jurisdiction_data_depth_adjudication_rules for select to authenticated using (true);
revoke insert,update,delete,truncate on public.jurisdiction_data_depth_adjudication_rules from anon,authenticated;

insert into public.jurisdiction_data_depth_adjudication_rules
(dimension_key,requires_effective_date,requires_jurisdiction_scope,requires_rule_semantics,allowed_evidence_kinds,required_payload_keys)
select
 d.dimension_key,
 d.dimension_key in ('regulatory_status','regulatory_tier','access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees','regulator','calendar','change_history'),
 true,
 d.dimension_key in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees'),
 case when d.dimension_key in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees') then array['authority_rule']::text[]
      when d.dimension_key in ('regulatory_status','regulatory_tier','regulator','calendar','change_history') then array['authority_rule','authority_statement']::text[]
      else array['authority_rule','authority_statement','structural_fact','verified_research']::text[] end,
 case when d.dimension_key='regulatory_tier' then array['tier']::text[]
      when d.dimension_key='regulatory_status' then array['status']::text[]
      else '{}'::text[] end
from public.jurisdiction_data_depth_dimensions d
on conflict(dimension_key) do update set
 requires_effective_date=excluded.requires_effective_date,
 requires_jurisdiction_scope=excluded.requires_jurisdiction_scope,
 requires_rule_semantics=excluded.requires_rule_semantics,
 allowed_evidence_kinds=excluded.allowed_evidence_kinds,
 required_payload_keys=excluded.required_payload_keys,
 updated_at=now();

create or replace view public.v_jurisdiction_data_depth_adjudication_gate as
select
 e.id evidence_id,
 e.jurisdiction_key,
 e.dimension_key,
 e.verification_status,
 e.evidence_kind,
 e.evidence_quote,
 e.effective_from,
 e.effective_to,
 e.source_url,
 e.source_registry_id,
 e.source_snapshot_id,
 r.requires_effective_date,
 r.requires_jurisdiction_scope,
 r.requires_rule_semantics,
 case
   when e.verification_status <> 'verified' then 'NOT_VERIFIED'
   when e.evidence_quote is null or length(trim(e.evidence_quote)) < r.min_quote_chars then 'QUOTE_MISSING_OR_TOO_SHORT'
   when length(e.evidence_quote) > r.max_quote_chars then 'QUOTE_TOO_LONG'
   when not (e.evidence_kind = any(r.allowed_evidence_kinds)) then 'EVIDENCE_KIND_NOT_ALLOWED'
   when r.requires_effective_date and e.effective_from is null then 'EFFECTIVE_DATE_REQUIRED'
   when not exists (
     select 1 from public.source_registry s
     where s.id=e.source_registry_id
       and s.is_active and s.crawl_allowed
       and lower(regexp_replace(trim(s.source_url), '/+$',''))=lower(regexp_replace(trim(e.source_url), '/+$',''))
       and (s.jurisdiction_code=e.jurisdiction_key or s.iso=e.jurisdiction_key)
   ) then 'JURISDICTION_SCOPED_SOURCE_REQUIRED'
   when not exists (
     select 1 from public.source_snapshots ss
     where ss.id=e.source_snapshot_id
       and ss.source_id=e.source_registry_id
       and ss.fetch_status='success'
       and ss.captured_text is not null and length(trim(ss.captured_text))>0
       and ss.raw_html_hash ~ '^[0-9a-fA-F]{64}$'
       and ss.captured_url is not null
       and lower(regexp_replace(trim(ss.captured_url), '/+$',''))=lower(regexp_replace(trim(e.source_url), '/+$',''))
       and position(e.evidence_quote in ss.captured_text)>0
   ) then 'SNAPSHOT_OR_QUOTE_LINEAGE_REQUIRED'
   else 'PASS'
 end gate_status
from public.jurisdiction_data_depth_evidence e
join public.jurisdiction_data_depth_adjudication_rules r using(dimension_key);

grant select on public.v_jurisdiction_data_depth_adjudication_gate to anon,authenticated;
