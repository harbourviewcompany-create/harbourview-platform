-- 291-jurisdiction regulatory + intelligence evidence depth hardening.
-- This migration does NOT invent regulatory facts. It:
--   1) attaches existing captured source snapshots to existing evidence rows where the
--      repository's source registry and snapshot ledger can prove the relationship;
--   2) creates a one-to-one executable/partial claim ledger for every active evidence row;
--   3) captures existing reviewed country intelligence as analyst-synthesis evidence,
--      explicitly non-publication-authority;
--   4) exposes a 291-row depth dossier and a fail-closed completeness view.
--
-- The authoritative regulatory tier remains public.regulatory_market_access_evidence.
-- Existing evidence rows are not reclassified here.

alter table public.regulatory_market_access_evidence
  add column if not exists source_document_id text,
  add column if not exists source_snapshot_uri text,
  add column if not exists retrieved_at timestamptz;

-- Reconcile evidence to the source-capture ledger without fabricating hashes.
-- raw_html_hash is the captured source-content hash produced by the source engine.
with latest_snapshot as (
  select distinct on (sr.iso, sr.jurisdiction_code, sr.source_url)
    sr.iso,
    sr.jurisdiction_code,
    sr.source_url,
    ss.raw_html_hash,
    ss.captured_at,
    ss.captured_url
  from public.source_registry sr
  join public.source_snapshots ss on ss.source_id = sr.id
  where ss.fetch_status = 'success'
    and ss.raw_html_hash is not null
  order by sr.iso, sr.jurisdiction_code, sr.source_url, ss.captured_at desc
)
update public.regulatory_market_access_evidence e
set source_snapshot_sha256 = ls.raw_html_hash,
    source_snapshot_uri = ls.captured_url,
    retrieved_at = ls.captured_at
from latest_snapshot ls
where e.active
  and e.source_snapshot_sha256 is null
  and e.authority_url = ls.source_url
  and (
    upper(e.jurisdiction_iso2) = upper(ls.iso)
    or upper(e.jurisdiction_iso2) = upper(ls.jurisdiction_code)
  );

-- Every active regulatory evidence row receives an explicit claim record.
-- "verified" is reserved for evidence that has both an effective date and a
-- captured source hash. Everything else remains "partial" and cannot become
-- executable merely because a rationale exists.
insert into public.regulatory_market_access_claims (
  evidence_key,
  jurisdiction_iso2,
  claim_key,
  claim_text,
  product_class,
  jurisdiction_scope,
  authority_name,
  authority_url,
  source_document_id,
  source_effective_date,
  retrieved_at,
  verified_at,
  expires_at,
  evidence_status,
  source_snapshot_sha256,
  source_snapshot_uri
)
select
  e.evidence_key,
  e.jurisdiction_iso2,
  'market-access-depth:' || e.evidence_key,
  e.rationale,
  'any',
  case
    when e.parent_iso2 is null then 'jurisdiction'
    else 'national_pathway_inheritance'
  end,
  e.authority_name,
  e.authority_url,
  e.source_document_id,
  e.source_effective_date,
  e.retrieved_at,
  e.verified_at,
  e.expires_at,
  case
    when e.source_snapshot_sha256 is not null
     and e.source_effective_date is not null
     and e.verified_at <= now()
     and e.expires_at > now()
      then 'verified'
    else 'partial'
  end,
  e.source_snapshot_sha256,
  e.source_snapshot_uri
from public.regulatory_market_access_evidence e
where e.active
on conflict (claim_key) do update set
  claim_text = excluded.claim_text,
  authority_name = excluded.authority_name,
  authority_url = excluded.authority_url,
  source_document_id = excluded.source_document_id,
  source_effective_date = excluded.source_effective_date,
  retrieved_at = excluded.retrieved_at,
  verified_at = excluded.verified_at,
  expires_at = excluded.expires_at,
  evidence_status = excluded.evidence_status,
  source_snapshot_sha256 = excluded.source_snapshot_sha256,
  source_snapshot_uri = excluded.source_snapshot_uri,
  updated_at = now();

-- Analyst-synthesis layer. This is deliberately separate from publication
-- authority: it preserves existing country intelligence without pretending its
-- prose is a regulator citation.
create table if not exists public.jurisdiction_intelligence_evidence (
  intelligence_key text primary key,
  jurisdiction_iso2 text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  regulatory_evidence_key text references public.regulatory_market_access_evidence(evidence_key) on delete set null,
  public_summary text,
  commercial_pathway_summary text,
  review_status text not null,
  last_reviewed_at timestamptz,
  last_enriched_at timestamptz,
  evidence_class text not null default 'analyst_synthesis'
    check (evidence_class = 'analyst_synthesis'),
  publication_authority boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.jurisdiction_intelligence_evidence (
  intelligence_key,
  jurisdiction_iso2,
  regulatory_evidence_key,
  public_summary,
  commercial_pathway_summary,
  review_status,
  last_reviewed_at,
  last_enriched_at
)
select
  'country-intel:' || ci.country_code,
  upper(ci.country_code),
  ev.evidence_key,
  ci.public_summary,
  ci.commercial_pathway_summary,
  ci.review_status,
  ci.last_reviewed_at,
  ci.last_enriched_at
from public.country_intel ci
left join lateral (
  select e.evidence_key
  from public.regulatory_market_access_evidence e
  where e.active
    and upper(e.jurisdiction_iso2) = upper(ci.country_code)
  order by e.verified_at desc
  limit 1
) ev on true
where ci.country_code is not null
on conflict (intelligence_key) do update set
  regulatory_evidence_key = excluded.regulatory_evidence_key,
  public_summary = excluded.public_summary,
  commercial_pathway_summary = excluded.commercial_pathway_summary,
  review_status = excluded.review_status,
  last_reviewed_at = excluded.last_reviewed_at,
  last_enriched_at = excluded.last_enriched_at,
  updated_at = now();

alter table public.jurisdiction_intelligence_evidence enable row level security;
drop policy if exists jurisdiction_intelligence_evidence_public_read on public.jurisdiction_intelligence_evidence;
create policy jurisdiction_intelligence_evidence_public_read
  on public.jurisdiction_intelligence_evidence
  for select to anon, authenticated
  using (review_status in ('active','approved'));

revoke insert, update, delete on public.jurisdiction_intelligence_evidence from anon, authenticated;
grant select on public.jurisdiction_intelligence_evidence to anon, authenticated;

comment on table public.jurisdiction_intelligence_evidence is
  'Analyst synthesis layer for jurisdiction intelligence. Not publication authority; regulatory publication requires structured authority evidence.';

-- A single dossier row per country/subnational jurisdiction represented in
-- public.countries. No inferred values are substituted for missing dimensions.
create or replace view public.v_jurisdiction_regulatory_intelligence_depth
with (security_invoker = on) as
with ev as (
  select
    e.jurisdiction_iso2,
    count(*) as evidence_rows,
    count(*) filter (
      where e.verified_at <= now() and e.expires_at > now()
    ) as current_evidence_rows,
    count(*) filter (
      where e.source_snapshot_sha256 is not null
    ) as snapshotted_evidence_rows,
    count(*) filter (
      where e.source_effective_date is not null
    ) as dated_evidence_rows,
    count(*) filter (
      where e.authority_url <> ''
    ) as cited_evidence_rows,
    max(e.verified_at) as latest_evidence_verified_at
  from public.regulatory_market_access_evidence e
  where e.active
  group by e.jurisdiction_iso2
),
cl as (
  select
    c.jurisdiction_iso2,
    count(*) as claim_rows,
    count(*) filter (where c.evidence_status = 'verified') as verified_claim_rows,
    count(*) filter (where c.source_snapshot_sha256 is not null) as snapshotted_claim_rows
  from public.regulatory_market_access_claims c
  group by c.jurisdiction_iso2
),
ii as (
  select
    i.jurisdiction_iso2,
    count(*) as intelligence_rows,
    count(*) filter (where i.review_status in ('active','approved')) as active_intelligence_rows,
    max(i.last_reviewed_at) as latest_intelligence_reviewed_at
  from public.jurisdiction_intelligence_evidence i
  group by i.jurisdiction_iso2
),
src as (
  select
    upper(coalesce(nullif(sr.iso,''), nullif(sr.jurisdiction_code,''))) as jurisdiction_iso2,
    count(*) as source_rows,
    count(*) filter (where sr.is_active) as active_source_rows,
    count(*) filter (where sr.tier = 1) as official_source_rows,
    max(sr.last_checked_at) as latest_source_checked_at
  from public.source_registry sr
  where sr.iso is not null or sr.jurisdiction_code is not null
  group by upper(coalesce(nullif(sr.iso,''), nullif(sr.jurisdiction_code,'')))
),
snap as (
  select
    upper(coalesce(nullif(sr.iso,''), nullif(sr.jurisdiction_code,''))) as jurisdiction_iso2,
    count(*) filter (where ss.fetch_status = 'success') as successful_snapshot_rows,
    max(ss.captured_at) filter (where ss.fetch_status = 'success') as latest_snapshot_at
  from public.source_snapshots ss
  join public.source_registry sr on sr.id = ss.source_id
  where sr.iso is not null or sr.jurisdiction_code is not null
  group by upper(coalesce(nullif(sr.iso,''), nullif(sr.jurisdiction_code,'')))
)
select
  c.iso_alpha2 as jurisdiction_iso2,
  c.country_name,
  c.region,
  c.subregion,
  c.verified_regulatory_tier,
  c.regulatory_tier_evidence_key,
  coalesce(ev.evidence_rows,0) as evidence_rows,
  coalesce(ev.current_evidence_rows,0) as current_evidence_rows,
  coalesce(ev.snapshotted_evidence_rows,0) as snapshotted_evidence_rows,
  coalesce(ev.dated_evidence_rows,0) as dated_evidence_rows,
  coalesce(ev.cited_evidence_rows,0) as cited_evidence_rows,
  coalesce(cl.claim_rows,0) as claim_rows,
  coalesce(cl.verified_claim_rows,0) as verified_claim_rows,
  coalesce(cl.snapshotted_claim_rows,0) as snapshotted_claim_rows,
  coalesce(ii.intelligence_rows,0) as intelligence_rows,
  coalesce(ii.active_intelligence_rows,0) as active_intelligence_rows,
  coalesce(src.source_rows,0) as source_rows,
  coalesce(src.active_source_rows,0) as active_source_rows,
  coalesce(src.official_source_rows,0) as official_source_rows,
  coalesce(snap.successful_snapshot_rows,0) as successful_snapshot_rows,
  ev.latest_evidence_verified_at,
  ii.latest_intelligence_reviewed_at,
  src.latest_source_checked_at,
  snap.latest_snapshot_at,
  (
    (case when coalesce(ev.current_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.snapshotted_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.dated_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.cited_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(cl.verified_claim_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ii.active_intelligence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(src.active_source_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(src.official_source_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(snap.successful_snapshot_rows,0) > 0 then 1 else 0 end)
  ) as populated_depth_dimensions,
  9 as total_depth_dimensions,
  round(100.0 * (
    (case when coalesce(ev.current_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.snapshotted_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.dated_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.cited_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(cl.verified_claim_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ii.active_intelligence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(src.active_source_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(src.official_source_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(snap.successful_snapshot_rows,0) > 0 then 1 else 0 end)
  ) / 9.0) as depth_pct
from public.countries c
left join ev on ev.jurisdiction_iso2 = c.iso_alpha2
left join cl on cl.jurisdiction_iso2 = c.iso_alpha2
left join ii on ii.jurisdiction_iso2 = c.iso_alpha2
left join src on src.jurisdiction_iso2 = c.iso_alpha2
left join snap on snap.jurisdiction_iso2 = c.iso_alpha2
where c.iso_alpha2 is not null;

grant select on public.v_jurisdiction_regulatory_intelligence_depth to anon, authenticated;

-- Regression gate: the jurisdiction universe must remain exactly 291 rows.
do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.v_jurisdiction_regulatory_intelligence_depth;
  if v_count <> 291 then
    raise exception '291-jurisdiction evidence depth gate failed: found % rows', v_count;
  end if;
end $$;
