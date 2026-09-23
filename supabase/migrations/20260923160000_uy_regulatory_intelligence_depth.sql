-- Uruguay regulatory/intelligence depth tranche 2026-09-23.
-- Primary sources only. Unsupported dimensions remain unresolved.

insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('UY','Instituto de Regulación y Control del Cannabis (IRCCA)','national_cannabis_regulator',
 'Licensing and control of adult-use cultivation, medicinal cultivation, industrialization, research, analytical laboratories, third-party cannabis services, free-zone/customs-area operations, and cannabis propagation.',
 'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/',null,'verified','2026-09-23T00:00:00Z'),
('UY','Dirección General de Servicios Agrícolas (MGAP)','national_agricultural_regulator',
 'Authorization to operate with non-psychoactive cannabis/hemp, including sowing, cultivation, harvesting, conditioning, industrialization, import and export.',
 'https://www.gub.uy/tramites/solicitud-operar-cannabis-no-psicoactivo',null,'verified','2026-09-23T00:00:00Z');

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
select c.id,'UY','depth-v1-uy-industrialization','Licensed cannabis industrialization and derivative manufacturing',
 'industrialization','Law 19.172 and implementing regulations','IRCCA','active',null,
 'IRCCA current approved-licence records identify industrialization licences covering extraction of psychoactive and non-psychoactive cannabis, purified cannabinoids, oral solutions and certain cosmetic products. The record establishes licensed industrial activity without inferring authorization for every product class.',
 array['https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/'],
 'needs_review',now(),
 array['IRCCA industrialization licence','activity and product scope must match the individual licence']);

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
select c.id,'UY','depth-v1-uy-analytical-labs','Licensed analytical laboratories for cannabinoid quantification',
 'testing','IRCCA cannabis licensing framework','IRCCA','active',null,
 'IRCCA maintains a dedicated licensing category for analytical laboratories that quantify cannabinoids and its approved-licence register lists multiple currently licensed laboratories. This evidences an authorized testing layer for the cannabis market.',
 array['https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/','https://ircca.gub.uy/proyectos-cannabis/'],
 'needs_review',now(),
 array['analytical laboratory authorization','cannabinoid quantification']);

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
select c.id,'UY','depth-v1-uy-third-party-services','Licensed third-party cannabis processing and service providers',
 'third_party_service','IRCCA cannabis licensing framework','IRCCA','active',null,
 'IRCCA approved-licence records identify third-party services including post-harvest activities, extraction, pharmaceutical manufacturing and cosmetic manufacturing. Scope is controlled by the individual service licence.',
 array['https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/'],
 'needs_review',now(),
 array['third-party service licence','licensed service scope']);

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
select c.id,'UY','depth-v1-uy-free-zone-logistics','Cannabis operations in free zones and other customs areas',
 'trade_logistics','IRCCA cannabis licensing framework','IRCCA','active',null,
 'IRCCA approved-licence records identify free-zone/customs-area operations. The current register includes a logistics operator authorized for import of finished cannabis products, secondary conditioning, storage, order preparation and dispatch to other countries.',
 array['https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/'],
 'needs_review',now(),
 array['free-zone or customs-area licence','licensed logistics scope']);

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
select c.id,'UY','depth-v1-uy-propagation','Licensed cannabis seed, cutting and nursery propagation trade',
 'propagation','IRCCA cannabis licensing framework','IRCCA','active',null,
 'IRCCA approved-licence records identify seed and nursery operators authorized to produce and commercialize cannabis propagation material, including seeds, cuttings, seedlings and young plants for medicinal and adult-use purposes.',
 array['https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/'],
 'needs_review',now(),
 array['propagation-material licence','seed/cutting/plantlet scope']);

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
select c.id,'UY','depth-v1-uy-hemp-nonpsychoactive','Non-psychoactive cannabis/hemp agricultural and trade authorization',
 'hemp_trade','Decreto 372/014 and current MGAP operating procedure','MGAP / Dirección General de Servicios Agrícolas','active',null,
 'The current government procedure covers sowing, cultivation, harvesting, conditioning, industrialization, import and export of non-psychoactive cannabis/hemp in Uruguay. Operators must be registered in the relevant operator registries and submit an operating plan.',
 array['https://www.gub.uy/tramites/solicitud-operar-cannabis-no-psicoactivo'],
 'needs_review',now(),
 array['non-psychoactive cannabis/hemp','RUO registration','Cannabis Operator Registry']);

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
select c.id,'UY','depth-v1-uy-scientific-research','Licensed scientific research involving cannabis',
 'scientific_research','IRCCA cannabis licensing framework','IRCCA','active',null,
 'IRCCA provides dedicated scientific-research licensing and its current approved-licence register lists active research projects, including public and private research involving cannabis cultivation, cannabinoids, genetics and clinical studies.',
 array['https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/','https://ircca.gub.uy/proyectos-cannabis/'],
 'needs_review',now(),
 array['scientific research licence','project-specific authorization']);

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('UY','commercial_activity','licensed_cannabis_activity',
 '{"licensed_activity_categories":["adult_use_cultivation","medicinal_cultivation","industrialization","research","analytical_laboratories","third_party_services","free_zone_customs_operations","propagation"]}'::jsonb,
 'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/',null,'verified','2026-09-23T00:00:00Z'),
('UY','testing','licensed_cannabinoid_analytical_laboratories',
 '{"analytical_laboratory_licensing":true,"scope":"cannabinoid_quantification"}'::jsonb,
 'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/',null,'verified','2026-09-23T00:00:00Z'),
('UY','import','licensed_nonpsychoactive_hemp_import',
 '{"import_authorization_pathway":true,"scope":"non_psychoactive_cannabis_hemp"}'::jsonb,
 'https://www.gub.uy/tramites/solicitud-operar-cannabis-no-psicoactivo',null,'verified','2026-09-23T00:00:00Z'),
('UY','export','licensed_nonpsychoactive_hemp_export',
 '{"export_authorization_pathway":true,"scope":"non_psychoactive_cannabis_hemp"}'::jsonb,
 'https://www.gub.uy/tramites/solicitud-operar-cannabis-no-psicoactivo',null,'verified','2026-09-23T00:00:00Z'),
('UY','import','free_zone_finished_product_import_logistics',
 '{"import_finished_cannabis_products":true,"requires_individual_free_zone_or_customs_area_licence":true}'::jsonb,
 'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/',null,'verified','2026-09-23T00:00:00Z'),
('UY','export','free_zone_finished_product_dispatch',
 '{"dispatch_to_other_countries":true,"requires_individual_free_zone_or_customs_area_licence":true}'::jsonb,
 'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/',null,'verified','2026-09-23T00:00:00Z'),
('UY','distribution','licensed_logistics_and_order_fulfillment',
 '{"order_preparation_and_dispatch":true,"scope":"free_zone_or_other_customs_area_operations"}'::jsonb,
 'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/',null,'verified','2026-09-23T00:00:00Z'),
('UY','tax_fees','licence_application_advance',
 '{"application_advance_ui":5000,"amendment_or_modification_advance_ui":2000,"unit":"UI"}'::jsonb,
 'https://ircca.gub.uy/proyectos-cannabis/',null,'verified','2026-04-21T00:00:00Z');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'IRCCA approved licences','Current licence categories and operators','regulator',
 'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/',null,current_date,
 'Current IRCCA register lists adult-use and medicinal cultivation, industrialization, research, analytical laboratories, third-party services, free-zone/customs-area operations and propagation licences.'
from public.regulatory_pathways p
where p.iso_alpha2='UY'
and p.slug in ('depth-v1-uy-industrialization','depth-v1-uy-analytical-labs','depth-v1-uy-third-party-services','depth-v1-uy-free-zone-logistics','depth-v1-uy-propagation','depth-v1-uy-scientific-research')
and not exists (
 select 1 from public.regulatory_citations c
 where c.entity_type='pathway' and c.entity_id=p.id
 and c.citation_url='https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/'
);

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'MGAP non-psychoactive cannabis procedure','Operating authorization','government',
 'https://www.gub.uy/tramites/solicitud-operar-cannabis-no-psicoactivo',null,current_date,
 'Current government procedure covers sowing, cultivation, harvesting, conditioning, industrialization, import and export of non-psychoactive cannabis/hemp.'
from public.regulatory_pathways p
where p.iso_alpha2='UY' and p.slug='depth-v1-uy-hemp-nonpsychoactive'
and not exists (
 select 1 from public.regulatory_citations c
 where c.entity_type='pathway' and c.entity_id=p.id
 and c.citation_url='https://www.gub.uy/tramites/solicitud-operar-cannabis-no-psicoactivo'
);

update public.regulatory_pathways
set verification='verified',last_verified_at=now()
where iso_alpha2='UY'
and slug in (
 'depth-v1-uy-industrialization','depth-v1-uy-analytical-labs',
 'depth-v1-uy-third-party-services','depth-v1-uy-free-zone-logistics',
 'depth-v1-uy-propagation','depth-v1-uy-hemp-nonpsychoactive',
 'depth-v1-uy-scientific-research'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary IRCCA and MGAP sources directly evidence the Uruguay regulator layer, multiple licensing pathways, industrialization, testing, third-party services, free-zone logistics, propagation, research, and non-psychoactive hemp import/export.',
    last_evaluated_at=now(),
    notes='Verified 2026-09-23 from current IRCCA approved-licence register and MGAP operating procedure.'
where jurisdiction_key='UY'
and dimension_key in (
 'verified_pathways','regulator','access_rules','commercial_activity',
 'import','export','distribution','testing','tax_fees'
);

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Verified 2026-09-23 from current IRCCA/MGAP primary sources.'
where jurisdiction_key='UY'
and dimension_key in (
 'verified_pathways','regulator','access_rules','commercial_activity',
 'import','export','distribution','testing','tax_fees'
);
