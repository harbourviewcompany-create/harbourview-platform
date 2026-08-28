-- Reshape clinical_evidence_claim_map to match what the merged
-- app/api/clinical/admin/framework-alignment/route.ts already expects.
--
-- This session originally wired this table with a claim_key/framework_alignment
-- jsonb shape (20260827185123_wire_clinical_evidence_claim_map.sql). While that
-- was in flight, a concurrent session shipped a more complete rebuild of the
-- same admin surface — proper admin-auth guard, full audit logging via
-- clinical_admin_audit_log, and a flat-array EvidenceClaimMapEntry shape
-- (slug, condition_label, cannabinoid_focus, target_stage_gates,
-- target_imdrf_pillars, target_dta_domains, gap_summary, updated_by) — but
-- the migration for that shape was never committed, so the live table was
-- left in the old shape underneath the new code. Its own error path even
-- points at the wrong migration filename as a hint. This migration closes
-- that gap: adds the columns the merged route needs, migrates the 3 existing
-- rows across, and drops the columns nothing reads anymore.

alter table public.clinical_evidence_claim_map
  add column if not exists slug text,
  add column if not exists condition_label text,
  add column if not exists cannabinoid_focus text[] not null default '{}',
  add column if not exists target_stage_gates text[] not null default '{}',
  add column if not exists target_imdrf_pillars text[] not null default '{}',
  add column if not exists target_dta_domains text[] not null default '{}',
  add column if not exists gap_summary text,
  add column if not exists updated_by uuid;

update public.clinical_evidence_claim_map
set slug = claim_key
where slug is null;

update public.clinical_evidence_claim_map
set condition_label = coalesce(condition_label, initcap(replace(regexp_replace(claim_key, '^claim-', ''), '-', ' ')))
where condition_label is null;

-- Explicit, accurate labels for the 3 rows this session authored — better
-- than the mechanical placeholder derivation above for known content.
update public.clinical_evidence_claim_map
set condition_label = 'Dravet syndrome (adjunctive CBD)'
where claim_key = 'claim-dravet-cbd-efficacy';
update public.clinical_evidence_claim_map
set condition_label = 'Chronic neuropathic pain'
where claim_key = 'claim-neuropathic-pain-modest';
update public.clinical_evidence_claim_map
set condition_label = 'MS spasticity (nabiximols)'
where claim_key = 'claim-ms-spasticity-nabiximols';

update public.clinical_evidence_claim_map
set status = case status
  when 'complete' then 'supported'
  when 'partial' then 'partial'
  when 'gap' then 'gap'
  else 'gap'
end;

alter table public.clinical_evidence_claim_map
  alter column slug set not null;

alter table public.clinical_evidence_claim_map
  drop constraint if exists clinical_evidence_claim_map_status_check;
alter table public.clinical_evidence_claim_map
  add constraint clinical_evidence_claim_map_status_check
  check (status in ('supported', 'partial', 'gap', 'not_applicable'));

alter table public.clinical_evidence_claim_map
  drop constraint if exists clinical_evidence_claim_map_claim_key_key;
alter table public.clinical_evidence_claim_map
  add constraint clinical_evidence_claim_map_slug_key unique (slug);

-- Columns nothing in the merged app reads anymore. claim_kind and
-- framework_alignment (the jsonb blob) are superseded by the flat
-- target_imdrf_pillars/target_dta_domains/etc. arrays above; gap_owner and
-- target_date had no equivalent in the merged shape and no code references
-- them either.
alter table public.clinical_evidence_claim_map
  drop column if exists claim_key,
  drop column if exists claim_kind,
  drop column if exists framework_alignment,
  drop column if exists gap_owner,
  drop column if exists target_date;
