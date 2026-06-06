-- Harbourview Supabase + Airtable integration foundation: indexes and public-safe DTO views.
create index if not exists hv_jurisdictions_public_idx on hv_core.jurisdictions (public_visibility, verification_status, review_status, sensitivity);
create index if not exists hv_sources_dedupe_idx on hv_core.sources (airtable_record_id, normalized_url, dedupe_key);
create index if not exists hv_sources_public_idx on hv_core.sources (public_visibility, verification_status, sensitivity);
create index if not exists hv_companies_dedupe_idx on hv_commercial.companies (airtable_record_id, normalized_website_domain);
create index if not exists hv_people_dedupe_idx on hv_commercial.people (airtable_record_id, email);
create index if not exists hv_offers_dedupe_idx on hv_commercial.offers (airtable_record_id, offer_id);
create index if not exists hv_opportunities_dedupe_idx on hv_commercial.opportunities (airtable_record_id, opportunity_id);
create index if not exists hv_marketplace_public_idx on hv_marketplace.listings (public_visibility, verification_status, review_status, sensitivity);
create index if not exists hv_search_documents_tsv_idx on hv_search.search_documents using gin (search_tsv);

create or replace view hv_public.jurisdictions_public
with (security_barrier = true)
as
select id, country_name, iso_code, region, cannabis_market_status, priority_tier, updated_at
from hv_core.jurisdictions
where public_visibility is true
  and verification_status = 'verified'
  and review_status in ('reviewed', 'approved')
  and sensitivity = 'public';

create or replace view hv_public.sources_public
with (security_barrier = true)
as
select id, source_name, source_url, normalized_url, country_text, source_type_text, organization_text,
       jurisdiction_level, verification_status, last_checked, updated_at
from hv_core.sources
where public_visibility is true
  and verification_status = 'verified'
  and sensitivity = 'public';

create or replace view hv_public.market_signals_public
with (security_barrier = true)
as
select id, jurisdiction_id, title, summary_public, signal_type, source_id, updated_at
from hv_core.market_signals
where public_visibility is true
  and verification_status = 'verified'
  and review_status = 'approved'
  and sensitivity = 'public';

create or replace view hv_public.marketplace_listings_public
with (security_barrier = true)
as
select id, company_id, title, description_public, category, price_public, country_code, updated_at
from hv_marketplace.listings
where public_visibility is true
  and verification_status = 'verified'
  and review_status = 'approved'
  and sensitivity = 'public';

create or replace view hv_public.offers_public
with (security_barrier = true)
as
select id, offer_id, company_id, title, description_public, category, updated_at
from hv_commercial.offers
where public_visibility is true
  and ready_to_sell = 'YES'
  and verification_status = 'verified'
  and review_status = 'approved'
  and sensitivity = 'public';

create or replace view hv_public.claim_evidence_public
with (security_barrier = true)
as
select e.id, e.source_id, e.claim_table, e.claim_record_id, e.evidence_type, e.evidence_url,
       e.evidence_title, e.public_summary, e.updated_at
from hv_private.evidence_items e
join hv_core.sources s on s.id = e.source_id
where e.public_visibility is true
  and e.verification_status = 'verified'
  and e.review_status = 'approved'
  and e.sensitivity = 'public'
  and s.verification_status = 'verified'
  and s.public_visibility is true
  and s.sensitivity = 'public';

grant usage on schema hv_public to anon, authenticated;
grant select on hv_public.jurisdictions_public to anon, authenticated;
grant select on hv_public.sources_public to anon, authenticated;
grant select on hv_public.market_signals_public to anon, authenticated;
grant select on hv_public.marketplace_listings_public to anon, authenticated;
grant select on hv_public.offers_public to anon, authenticated;
grant select on hv_public.claim_evidence_public to anon, authenticated;
