-- Primary Netherlands format rules from Government.nl controlled supply-chain experiment.
begin;

insert into public.pathway_format_rules(
  pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date,packaging_labelling
)
select
  '01fdfa6a-1295-4f84-8ade-dbabf9b245be',
  pf.id,
  'permitted',
  '{"experiment_phase":true,"source":"designated_growers"}'::jsonb,
  'Government.nl states that during the experimental phase participating coffeeshops may sell weed/hash from designated growers.',
  array['https://www.government.nl/faq/controlled-cannabis-supply-chain-experiment/what-cannabis-products-can-coffee-shops-offer-during-the-controlled-cannabis-supply-chain-experiment'],
  'verified',now(),'2025-04-07',
  'Products and packaging must meet experiment requirements; THC/CBD information and required labeling apply.'
from public.product_formats pf
where pf.slug='dried_flower'
and not exists (
  select 1 from public.pathway_format_rules r
  where r.pathway_id='01fdfa6a-1295-4f84-8ade-dbabf9b245be' and r.format_id=pf.id
);

insert into public.pathway_format_rules(
  pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date,packaging_labelling
)
select
  '01fdfa6a-1295-4f84-8ade-dbabf9b245be',
  pf.id,
  'permitted',
  '{"experiment_phase":true,"raw_cannabis_only":true,"concentrates_prohibited":true,"made_and_packaged_by_grower":true}'::jsonb,
  'Government.nl states that edibles are permitted during the experimental phase only when made with raw cannabis; concentrates are prohibited and edibles must be made and packaged by designated growers.',
  array['https://www.government.nl/faq/controlled-cannabis-supply-chain-experiment/what-cannabis-products-can-coffee-shops-offer-during-the-controlled-cannabis-supply-chain-experiment'],
  'verified',now(),'2025-04-07',
  'Edibles must be made and packaged by designated growers under the experiment requirements.'
from public.product_formats pf
where pf.slug='edibles'
and not exists (
  select 1 from public.pathway_format_rules r
  where r.pathway_id='01fdfa6a-1295-4f84-8ade-dbabf9b245be' and r.format_id=pf.id
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
    evidence_basis='Primary Government.nl product-format rules for the controlled cannabis supply-chain experiment.',
    last_evaluated_at=now(),
    notes='Verified format-specific rules: flower/hash and edibles; edibles restricted to raw cannabis and grower manufacture/packaging, concentrates prohibited.'
where jurisdiction_key='NL' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks
set status='verified',
    notes='Resolved using primary Government.nl product-format rules for the controlled cannabis supply-chain experiment.'
where jurisdiction_key='NL' and dimension_key='verified_format_rules' and status='open';

commit;
