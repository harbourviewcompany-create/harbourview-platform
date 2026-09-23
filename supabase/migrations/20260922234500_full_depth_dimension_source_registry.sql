-- Dimension-to-source implementation registry.
-- This is a control-plane inventory: it does not assert evidence exists.
create table if not exists public.jurisdiction_data_depth_dimension_sources (
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-22.v1',
  source_kind text not null check (source_kind in ('table','view','derived','queue','schema_gap')),
  relation_name text,
  evidence_gate text not null,
  implementation_status text not null check (implementation_status in ('wired','partial','schema_gap')),
  notes text,
  primary key (dimension_key, contract_version)
);

insert into public.jurisdiction_data_depth_dimension_sources
(dimension_key,contract_version,source_kind,relation_name,evidence_gate,implementation_status,notes)
values
('identity','2026-09-22.v1','table','public.countries','Canonical jurisdiction exists with stable key and required identity fields.','wired',null),
('hierarchy','2026-09-22.v1','derived','public.countries','Parent/level must be explicit; no regex-only inference accepted as final authority.','partial','Existing country table does not yet persist a canonical parent key for every subnational jurisdiction.'),
('regulatory_status','2026-09-22.v1','table','public.regulatory_market_access_evidence','Current verified evidence with valid source snapshot and non-expired verification.','wired',null),
('regulatory_tier','2026-09-22.v1','table','public.countries + regulatory evidence','Tier must be supported by structured regulatory evidence; free-text/regex classification cannot complete the gate.','partial','Existing verified tier is present, but the full evidence-to-tier contract remains to be wired.'),
('source_registry','2026-09-22.v1','table','public.source_registry','Active authoritative source registered for jurisdiction.','wired',null),
('source_snapshot','2026-09-22.v1','table','public.source_snapshots','Successful snapshot tied to a registered source and jurisdiction.','wired',null),
('claims','2026-09-22.v1','table','public.regulatory_market_access_claims','Verified claim backed by qualifying evidence.','wired',null),
('pathways','2026-09-22.v1','table','public.regulatory_pathways','Verified pathway with legal basis and provenance.','wired',null),
('format_rules','2026-09-22.v1','table','public.pathway_format_rules','Verified product-format rule attached to a verified pathway.','wired',null),
('access_rules','2026-09-22.v1','schema_gap',null,'Structured eligibility, licensing and access requirements with authoritative evidence.','schema_gap','No dedicated jurisdiction-level access-rule relation was identified in the current contract wiring.'),
('commercial_activity','2026-09-22.v1','schema_gap',null,'Structured commercial activity status and authorized activities with evidence.','schema_gap','Requires dedicated structured evidence model.'),
('import','2026-09-22.v1','partial','public.regulatory_market_access_claims','Explicit import authorization/restriction claim with primary provenance.','partial','Existing claims can carry evidence but lack a dedicated import-rule contract.'),
('export','2026-09-22.v1','partial','public.regulatory_market_access_claims','Explicit export authorization/restriction claim with primary provenance.','partial','Existing claims can carry evidence but lack a dedicated export-rule contract.'),
('distribution','2026-09-22.v1','schema_gap',null,'Structured distribution channel and licensing rules with evidence.','schema_gap','Requires dedicated structured distribution model.'),
('testing','2026-09-22.v1','schema_gap',null,'Structured testing requirements, authority and applicability with evidence.','schema_gap','Requires dedicated structured testing model.'),
('packaging_labeling','2026-09-22.v1','schema_gap',null,'Structured packaging/labeling requirements with evidence and effective dates.','schema_gap','Requires dedicated structured packaging/labeling model.'),
('tax_fees','2026-09-22.v1','schema_gap',null,'Structured tax, fee and levy requirements with effective dates and source evidence.','schema_gap','Requires dedicated structured tax/fee model.'),
('regulator','2026-09-22.v1','partial','public.regulatory_pathways + public.source_registry','Named authority must be explicitly tied to jurisdiction and source provenance.','partial','Regulator information exists in pathways/sources but lacks a dedicated jurisdiction regulator registry.'),
('calendar','2026-09-22.v1','table','public.regulatory_calendar','Current/relevant event has source, effective/expected date and status.','wired',null),
('change_history','2026-09-22.v1','schema_gap',null,'Versioned before/after regulatory change with source snapshot and effective date.','schema_gap','Requires dedicated immutable change-event history.'),
('market_metrics','2026-09-22.v1','table','public.market_metrics','Metric has jurisdiction, period, definition and provenance.','wired',null),
('trade_flows','2026-09-22.v1','table','public.trade_flows','Trade observation has origin/destination, product category, period and verification.','wired',null),
('participants','2026-09-22.v1','schema_gap',null,'Verified market participant record tied to jurisdiction and source.','schema_gap','Existing operator/company data is not yet normalized into the full jurisdiction-depth contract.'),
('buyers','2026-09-22.v1','schema_gap',null,'Verified buyer/demand-side participant with jurisdiction and provenance.','schema_gap','Requires dedicated buyer evidence model.'),
('sellers','2026-09-22.v1','schema_gap',null,'Verified seller/supply-side participant with jurisdiction and provenance.','schema_gap','Requires dedicated seller evidence model.'),
('counterparties','2026-09-22.v1','schema_gap',null,'Verified counterparty relationship with role, jurisdiction and provenance.','schema_gap','Requires dedicated counterparty evidence model.'),
('relationships','2026-09-22.v1','schema_gap',null,'Verified relationship edge with evidence, date and confidence.','schema_gap','Requires dedicated relationship graph model.'),
('opportunities','2026-09-22.v1','partial','public.countries + intelligence/network data','Opportunity must derive only from evidence-complete inputs and preserve provenance.','partial','Existing opportunity fields are not sufficient as an evidence contract.'),
('signals','2026-09-22.v1','table','public.signals','Signal has source, jurisdiction, date and review/verification state.','wired',null),
('freshness','2026-09-22.v1','derived','public.source_snapshots + evidence tables','Latest qualifying verification must be within dimension freshness window.','partial','Freshness state is now tracked in the matrix but not every dimension has a dedicated verification timestamp.'),
('uncertainty','2026-09-22.v1','schema_gap',null,'Explicit confidence, conflict and unresolved uncertainty tied to evidence.','schema_gap','Requires dedicated depth uncertainty/conflict fields or normalized evidence state.'),
('research_queue','2026-09-22.v1','queue','public.jurisdiction_data_depth_tasks','Every incomplete cell has a deterministic research reason/task.','partial','Existing queue covers legacy dimensions; it must be expanded to all 32 contract dimensions.')
on conflict (dimension_key,contract_version) do update set
 source_kind=excluded.source_kind,
 relation_name=excluded.relation_name,
 evidence_gate=excluded.evidence_gate,
 implementation_status=excluded.implementation_status,
 notes=excluded.notes;

alter table public.jurisdiction_data_depth_dimension_sources enable row level security;
drop policy if exists jurisdiction_data_depth_dimension_sources_public_read
  on public.jurisdiction_data_depth_dimension_sources;
create policy jurisdiction_data_depth_dimension_sources_public_read
  on public.jurisdiction_data_depth_dimension_sources
  for select to anon, authenticated using (true);
grant select on public.jurisdiction_data_depth_dimension_sources to anon, authenticated;

create or replace view public.v_jurisdiction_data_depth_contract_gaps
with (security_invoker = on) as
select
  d.dimension_key,
  d.display_name,
  d.layer,
  d.required_for_regulatory_publication,
  coalesce(s.implementation_status,'schema_gap') implementation_status,
  coalesce(s.source_kind,'schema_gap') source_kind,
  s.relation_name,
  s.evidence_gate,
  s.notes
from public.jurisdiction_data_depth_dimensions d
left join public.jurisdiction_data_depth_dimension_sources s
  on s.dimension_key=d.dimension_key
 and s.contract_version=d.contract_version
where coalesce(s.implementation_status,'schema_gap') <> 'wired';

grant select on public.v_jurisdiction_data_depth_contract_gaps to anon, authenticated;

comment on table public.jurisdiction_data_depth_dimension_sources is
'Implementation registry for the 32-dimension depth contract. It explicitly distinguishes wired, partial and schema-gap dimensions without treating the inventory as evidence.';
