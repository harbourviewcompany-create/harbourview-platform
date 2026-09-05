-- Evidence-backed Market Access authority.
-- Published globe colour is sourced only from structured, current evidence.
-- Legacy countries.regulatory_tier remains advisory for analyst review.

alter table public.countries
  add column if not exists verified_regulatory_tier text,
  add column if not exists regulatory_tier_evidence_key text,
  add column if not exists regulatory_tier_verified_at timestamptz,
  add column if not exists regulatory_tier_expires_at timestamptz;

alter table public.countries drop constraint if exists countries_verified_regulatory_tier_check;
alter table public.countries add constraint countries_verified_regulatory_tier_check
check (verified_regulatory_tier is null or verified_regulatory_tier in (
  'legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited'
));

create table if not exists public.regulatory_market_access_evidence (
  evidence_key text primary key,
  jurisdiction_iso2 text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  tier text not null check (tier in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited')),
  rationale text not null,
  authority_name text not null,
  authority_url text not null,
  source_effective_date date,
  verified_at timestamptz not null,
  expires_at timestamptz not null,
  parent_iso2 text,
  inheritance_scope text check (inheritance_scope is null or inheritance_scope = 'national_licensed_pathway'),
  source_snapshot_sha256 text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint regulatory_market_access_evidence_expiry check (expires_at > verified_at),
  constraint regulatory_market_access_evidence_parent check (
    (parent_iso2 is null and inheritance_scope is null) or
    (parent_iso2 is not null and inheritance_scope = 'national_licensed_pathway')
  )
);

alter table public.regulatory_market_access_evidence enable row level security;
drop policy if exists regulatory_market_access_evidence_public_read on public.regulatory_market_access_evidence;
create policy regulatory_market_access_evidence_public_read on public.regulatory_market_access_evidence
for select to anon, authenticated using (active = true);
revoke insert, update, delete on public.regulatory_market_access_evidence from anon, authenticated;
grant select on public.regulatory_market_access_evidence to anon, authenticated;

comment on table public.regulatory_market_access_evidence is
  'Structured authority records allowed to publish a Market Access globe tier. Briefing prose/regex is advisory only.';
comment on column public.countries.verified_regulatory_tier is
  'Public Market Access tier. Populated only from current structured evidence; null renders neutral.';

create or replace function api.resolve_verified_market_access_evidence(p_iso text, p_at timestamptz default now())
returns table (evidence_key text, tier text, verified_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with direct_match as (
    select e.evidence_key,e.tier,e.verified_at,e.expires_at,0 as precedence
    from public.regulatory_market_access_evidence e
    where e.active and e.jurisdiction_iso2=p_iso and e.parent_iso2 is null
      and e.verified_at<=p_at and e.expires_at>p_at
  ), inherited_match as (
    select e.evidence_key,e.tier,e.verified_at,e.expires_at,1 as precedence
    from public.regulatory_market_access_evidence e
    where e.active and e.parent_iso2 in ('CA','AU','DE')
      and e.jurisdiction_iso2=e.parent_iso2
      and e.inheritance_scope='national_licensed_pathway'
      and p_iso like e.parent_iso2 || '-%'
      and e.verified_at<=p_at and e.expires_at>p_at
  )
  select x.evidence_key,x.tier,x.verified_at,x.expires_at
  from (select * from direct_match union all select * from inherited_match) x
  order by x.precedence,x.verified_at desc limit 1;
$$;
revoke all on function api.resolve_verified_market_access_evidence(text,timestamptz) from public;
grant execute on function api.resolve_verified_market_access_evidence(text,timestamptz) to anon, authenticated, service_role;

create or replace function api.refresh_verified_market_access_tiers(p_actor text default 'system')
returns table (iso_alpha2 text, old_tier text, new_tier text, evidence_key text, action text)
language plpgsql security definer set search_path = '' as $$
declare r record; ev record; v_old text;
begin
  if session_user <> 'postgres' and current_user <> 'service_role' then
    raise exception 'insufficient privileges' using errcode='42501';
  end if;
  for r in select c.iso_alpha2,c.verified_regulatory_tier from public.countries c where c.iso_alpha2 is not null loop
    v_old:=r.verified_regulatory_tier;
    select * into ev from api.resolve_verified_market_access_evidence(r.iso_alpha2,now());
    update public.countries c set
      verified_regulatory_tier=ev.tier,
      regulatory_tier_evidence_key=ev.evidence_key,
      regulatory_tier_verified_at=ev.verified_at,
      regulatory_tier_expires_at=ev.expires_at,
      updated_at=case when c.verified_regulatory_tier is distinct from ev.tier then now() else c.updated_at end
    where c.iso_alpha2=r.iso_alpha2;
    iso_alpha2:=r.iso_alpha2; old_tier:=v_old; new_tier:=ev.tier; evidence_key:=ev.evidence_key;
    action:=case when ev.evidence_key is null and v_old is null then 'neutral_unchanged'
      when ev.evidence_key is null then 'neutralized_no_current_evidence'
      when v_old is distinct from ev.tier then 'published_from_evidence' else 'verified_unchanged' end;
    return next;
  end loop;
end; $$;
revoke all on function api.refresh_verified_market_access_tiers(text) from public, anon, authenticated;
grant execute on function api.refresh_verified_market_access_tiers(text) to service_role;

create or replace view api.regulatory_market_access_drift as
select c.iso_alpha2,c.country_name,c.regulatory_tier as classifier_or_legacy_tier,
  c.verified_regulatory_tier as published_tier,c.regulatory_tier_evidence_key as evidence_key,
  c.regulatory_tier_verified_at as verified_at,c.regulatory_tier_expires_at as expires_at,
  (c.regulatory_tier is distinct from c.verified_regulatory_tier) as legacy_differs_from_published,
  (c.regulatory_tier_expires_at is null or c.regulatory_tier_expires_at<=now()) as evidence_missing_or_expired
from public.countries c;
grant select on api.regulatory_market_access_drift to authenticated, service_role;

-- INCB 2023 reported legal cannabis import/export activity: operational controlled cross-border pathway.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
select 'incb-2023-trade-'||lower(iso),iso,'legal_commercial_access',
  'INCB reports legal cannabis import and/or export activity; an operational controlled cross-border supply pathway is verified.',
  'International Narcotics Control Board — Narcotic Drugs 2024',
  'https://www.incb.org/documents/Narcotic-Drugs/Technical-Publications/2024/Narcotics_2024_EFN.pdf',
  date '2023-12-31',timestamptz '2026-08-31 12:10:00+00',timestamptz '2027-09-01 00:00:00+00'
from unnest(array['AT','AU','BR','CA','CZ','DE','DK','ES','FI','GB','GR','IL','IT','KR','LU','MT','MK','NL','NO','NZ','PE','PL','PT','UY','ZA','ZW']) iso
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

-- Current national authority records. Parent inheritance is explicit and limited to CA/AU/DE.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,parent_iso2,inheritance_scope)
values
('hc-ca-import-export-20260831','CA','legal_commercial_access','Federally licensed businesses may import/export cannabis for medical or scientific purposes with shipment permits; provinces and territories operate legal retail distribution.','Health Canada','https://www.canada.ca/en/health-canada/services/cannabis-regulations-licensed-producers/import-export.html',null,'2026-08-31 12:10:00+00','2027-09-01 00:00:00+00','CA','national_licensed_pathway'),
('odc-au-import-export-20260831','AU','legal_commercial_access','ODC licenses and permits commercial quantities of medicinal cannabis imports and exports and publishes current import/export/production data.','Australian Government Office of Drug Control','https://www.odc.gov.au/australian-cannabis-data-import-export-production-and-stock','2026-08-19','2026-08-31 12:10:00+00','2027-09-01 00:00:00+00','AU','national_licensed_pathway'),
('bfarm-de-import-export-20260831','DE','legal_commercial_access','The German federal medicinal-cannabis framework permits controlled import/export; the national licensed pathway applies across Länder.','BfArM','https://www.bfarm.de/DE/Bundesopiumstelle/Medizinisches-Cannabis/_node.html',null,'2026-08-31 12:10:00+00','2027-09-01 00:00:00+00','DE','national_licensed_pathway'),
('ica-co-import-export-20260831','CO','legal_commercial_access','Colombian authorities maintain licensed foreign-trade procedures for medicinal cannabis, including psychoactive cannabis exports for medical/scientific purposes.','Instituto Colombiano Agropecuario / INVIMA','https://www.ica.gov.co/areas/proteccion-fronteriza/cannabis-medicinal-importacion-y-exportacion',null,'2026-08-31 12:10:00+00','2027-09-01 00:00:00+00',null,null),
('mag-cr-licensed-export-20260831','CR','legal_commercial_access','Costa Rica licenses psychoactive medicinal cannabis cultivation, import, export, transport and commercialization; export projects require a lawful foreign-market contract.','Costa Rica Ministry of Agriculture and Livestock','https://mag.go.cr/servicios-y-tramites/',null,'2026-08-31 12:10:00+00','2027-09-01 00:00:00+00',null,null)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,
 parent_iso2=excluded.parent_iso2,inheritance_scope=excluded.inheritance_scope,active=true;

-- National US evidence is direct-only: it MUST NOT cascade into state rows.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values ('ncsl-us-national-20260831','US','medical_limited_trade',
  'State medical cannabis markets operate across most of the United States, but no lawful nationwide interstate commercial cannabis pathway is verified; state rows are classified independently.',
  'National Conference of State Legislatures — State Medical Cannabis Laws',
  'https://www.ncsl.org/health/state-medical-cannabis-laws',null,
  '2026-08-31 12:10:00+00','2027-03-01 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

-- US state market status from NCSL 2026 tables. State adult-use retail => domestic_only because interstate cannabis commerce is not verified.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
select 'ncsl-us-'||lower(replace(iso,'US-',''))||'-20260831',iso,tier,
 case tier when 'domestic_only' then 'Operational state-licensed non-medical adult-use retail market; no verified lawful interstate cannabis trade pathway.'
 when 'medical_limited_trade' then 'State medical cannabis market/program is lawful; no operational adult-use retail market or lawful interstate cannabis trade pathway verified.'
 else 'No full state medical/adult-use cannabis market verified; lawful access is limited to hemp/low-THC/CBD pathways.' end,
 'National Conference of State Legislatures — State Medical Cannabis Laws','https://www.ncsl.org/health/state-medical-cannabis-laws',
 null,timestamptz '2026-08-31 12:10:00+00',timestamptz '2027-03-01 00:00:00+00'
from (values
('US-AK','domestic_only'),('US-AL','medical_limited_trade'),('US-AR','medical_limited_trade'),('US-AZ','domestic_only'),('US-CA','domestic_only'),
('US-CO','domestic_only'),('US-CT','domestic_only'),('US-DC','medical_limited_trade'),('US-DE','domestic_only'),('US-FL','medical_limited_trade'),
('US-GA','medical_limited_trade'),('US-HI','medical_limited_trade'),('US-IA','cbd_hemp_only'),('US-ID','cbd_hemp_only'),('US-IL','domestic_only'),
('US-IN','cbd_hemp_only'),('US-KS','cbd_hemp_only'),('US-KY','medical_limited_trade'),('US-LA','medical_limited_trade'),('US-MA','domestic_only'),
('US-MD','domestic_only'),('US-ME','domestic_only'),('US-MI','domestic_only'),('US-MN','domestic_only'),('US-MO','domestic_only'),
('US-MS','medical_limited_trade'),('US-MT','domestic_only'),('US-NC','cbd_hemp_only'),('US-ND','medical_limited_trade'),('US-NE','medical_limited_trade'),
('US-NH','medical_limited_trade'),('US-NJ','domestic_only'),('US-NM','domestic_only'),('US-NV','domestic_only'),('US-NY','domestic_only'),
('US-OH','domestic_only'),('US-OK','medical_limited_trade'),('US-OR','domestic_only'),('US-PA','medical_limited_trade'),('US-RI','domestic_only'),
('US-SC','cbd_hemp_only'),('US-SD','medical_limited_trade'),('US-TN','cbd_hemp_only'),('US-TX','medical_limited_trade'),('US-UT','medical_limited_trade'),
('US-VA','medical_limited_trade'),('US-VT','domestic_only'),('US-WA','domestic_only'),('US-WI','cbd_hemp_only'),('US-WV','medical_limited_trade'),('US-WY','cbd_hemp_only')
) v(iso,tier)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

-- More specific current Virginia authority: retail adult-use sales begin July 1 2027, not today.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values ('va-cca-20260831','US-VA','medical_limited_trade','Virginia has a regulated medical market. Adult-use retail was enacted in 2026 but retail sales do not begin until July 1, 2027.','Virginia Cannabis Control Authority','https://cca.virginia.gov/retailmarijuanamarket','2027-07-01','2026-08-31 12:10:00+00','2027-07-02 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,
 source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

select * from api.refresh_verified_market_access_tiers('evidence-backed-market-access-20260831');
