-- Primary Netherlands controlled cannabis supply-chain provenance
-- Evidence-backed only; controlled experimental commercial access, not unrestricted national retail.

begin;

update public.regulatory_market_access_evidence
set active=false
where evidence_key='incb-2023-trade-nl';

insert into public.regulatory_market_access_evidence(
  evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,
  source_effective_date,verified_at,expires_at,active
)
select
  'primary-evidence-nl-closed-chain-20260922','NL','legal_commercial_access',
  'Government source establishes a controlled experiment regulating production, distribution and sale of quality-controlled cannabis; experimental phase began 7 April 2025 and participating coffeeshops sell regulated cannabis from designated growers. This is controlled experimental commercial access, not unrestricted national retail.',
  'Government of the Netherlands',
  'https://www.government.nl/themes/family-health-and-care/controlled-cannabis-supply-chain-experiment',
  '2025-04-07',now(),now()+interval '180 days',true
where not exists (
  select 1 from public.regulatory_market_access_evidence
  where evidence_key='primary-evidence-nl-closed-chain-20260922'
);

insert into public.regulatory_market_access_claims(
  evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,
  authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status
)
select
  'primary-evidence-nl-closed-chain-20260922','NL',
  'primary-evidence-claim:nl-closed-chain-20260922',
  'A controlled cannabis supply-chain experiment permits regulated production, distribution and sale of cannabis to coffeeshops in participating municipalities; the experimental phase began 7 April 2025.',
  'any','national','Government of the Netherlands',
  'https://www.government.nl/themes/family-health-and-care/controlled-cannabis-supply-chain-experiment',
  '2025-04-07',now(),now(),now()+interval '180 days','verified'
where not exists (
  select 1 from public.regulatory_market_access_claims
  where claim_key='primary-evidence-claim:nl-closed-chain-20260922'
);

insert into public.regulatory_calendar(
  iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status
)
select
  'NL','effective',
  'Controlled Cannabis Supply Chain Experiment — experimental phase',
  'Experimental phase began; participating municipalities permit sale of regulated cannabis produced by designated growers under the closed-chain experiment.',
  '2025-04-07','confirmed',
  'https://www.government.nl/latest/news/2025/04/02/experimental-phase-of-the-closed-coffee-shop-chain-experiment-weed-experiment-starts-on-april-7th',
  'Government of the Netherlands','effective'
where not exists (
  select 1 from public.regulatory_calendar
  where iso2='NL'
    and expected_date='2025-04-07'
    and title='Controlled Cannabis Supply Chain Experiment — experimental phase'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    applicability='applicable',
    evidence_basis='Primary Government of Netherlands controlled supply-chain experiment source and verified claim/calendar.',
    last_evaluated_at=now(),
    notes='Primary-source commercial pathway evidence; controlled experimental scope.'
where jurisdiction_key='NL'
  and dimension_key in ('verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='verified',
    notes='Resolved from primary Government of Netherlands controlled cannabis supply-chain experiment evidence.'
where jurisdiction_key='NL'
  and dimension_key in ('verified_regulatory_claims','regulatory_calendar')
  and status='open';

commit;
