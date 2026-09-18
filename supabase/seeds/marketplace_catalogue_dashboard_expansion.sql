-- Harbourview Marketplace — dashboard catalogue expansion
--
-- These are catalogue slots, not fabricated live supplier offers. Every row is
-- explicitly marked `catalogue=true` and `review_required=true`; availability,
-- seller identity, compliance and commercial terms must be confirmed before
-- introduction. The existing dashboard projection already reads approved,
-- public listings by marketplace section, so these rows flow into the existing
-- Marketplace tabs without a parallel UI data source.
--
-- Safe to re-run: slug is de-duplicated in the INSERT SELECT rather than relying
-- on a database uniqueness constraint.

with seed(category, title, description, product_type, region, seller_type, marketplace_section, slug, featured, location_country, condition, sku, specs) as (
  values
  ('cultivation_equipment','LED Cultivation Lighting Array — 1000W Class','Commercial cultivation lighting package for controlled-environment facilities. Catalogue item; confirm configuration, certification and availability before introduction.','LED cultivation lighting','north_america','other','equipment','hv-led-cultivation-lighting-1000w',true,'North America','New','HV-LGT-1000','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request product review","buyer_fit":["Licensed producers","Facility operators"]}'::jsonb),
  ('cultivation_equipment','Environmental Control Package — HVAC & Dehumidification','Facility environmental-control package covering HVAC and dehumidification planning. Catalogue item; final sizing and availability require review.','HVAC / dehumidification','north_america','other','equipment','hv-environmental-control-package',false,'North America','New','HV-HVAC-PKG','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request product review","buyer_fit":["Cultivation facilities","Facility designers"]}'::jsonb),
  ('cultivation_equipment','Automated Irrigation & Fertigation Skid','Modular irrigation and fertigation equipment package for controlled cultivation environments. Catalogue item; specifications are confirmed during inquiry.','Irrigation / fertigation','europe','other','equipment','hv-automated-irrigation-fertigation-skid',false,'Europe','New','HV-IRR-200','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request product review","buyer_fit":["Cultivation operators","Facility expansion teams"]}'::jsonb),
  ('processing_equipment','Industrial Extraction Chiller — 20 Ton Class','Temperature-control equipment for extraction and processing environments. Catalogue item; service history and configuration are verified before introduction.','Process chiller','north_america','other','processing','hv-process-chiller-20-ton',false,'North America','New','HV-CHL-20','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request product review","buyer_fit":["Processors","Extraction facilities"]}'::jsonb),
  ('processing_equipment','Closed-Loop Processing System — Pilot Scale','Pilot-scale closed-loop processing equipment package for qualified processing facilities. Catalogue item; regulatory and technical fit must be confirmed.','Closed-loop processing system','europe','other','processing','hv-closed-loop-processing-pilot',true,'Europe','New','HV-CLS-PILOT','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request product review","buyer_fit":["Processors","R&D facilities"]}'::jsonb),
  ('used_surplus','Analytical HPLC System — QA Laboratory','Laboratory HPLC platform for analytical QA workflows. Catalogue item; instrument configuration, service status and availability are confirmed before introduction.','HPLC analytical system','north_america','other','equipment','hv-analytical-hplc-qa-system',false,'North America','Used','HV-HPLC-QA','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request product review","buyer_fit":["Testing laboratories","QA teams"]}'::jsonb),
  ('packaging','Child-Resistant Jar & Closure Set','Catalogue packaging set for regulated product packaging programs. Final material, format, MOQ and certification package are confirmed before quotation.','Child-resistant jars and closures','north_america','wholesaler','packaging','hv-child-resistant-jar-closure-set',true,'North America','New','HV-PKG-JAR','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request packaging quote","buyer_fit":["Brands","Processors","Packaging teams"]}'::jsonb),
  ('packaging','Barrier Pouch Packaging — Multiple Sizes','High-barrier pouch packaging catalogue range for regulated product programs. Confirm format, print requirements, MOQ and compliance documentation before order.','Barrier pouches','europe','wholesaler','packaging','hv-barrier-pouch-packaging-range',false,'Europe','New','HV-PKG-POUCH','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request packaging quote","buyer_fit":["Brands","Processors"]}'::jsonb),
  ('consumables','GMP-Compatible Primary Packaging Components','Primary packaging component catalogue for quality-managed production environments. Final material and supplier documentation are confirmed during review.','Primary packaging components','north_america','wholesaler','consumables','hv-gmp-primary-packaging-components',false,'North America','New','HV-CONS-PRIMARY','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request consumables quote","buyer_fit":["Manufacturers","Processors"]}'::jsonb),
  ('consumables','Cultivation Substrate & Media Program','Commercial substrate and growing-media catalogue for controlled cultivation programs. Confirm format, supplier documentation and delivery lane before purchase.','Growing media','europe','wholesaler','consumables','hv-cultivation-substrate-media-program',false,'Europe','New','HV-CONS-MEDIA','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request consumables quote","buyer_fit":["Cultivation operators","Facility procurement"]}'::jsonb),
  ('consumables','Cleanroom Consumables Pack','Catalogue of cleanroom-compatible consumables for production and QA environments. Final item list and availability are confirmed before quotation.','Cleanroom consumables','north_america','wholesaler','consumables','hv-cleanroom-consumables-pack',false,'North America','New','HV-CONS-CLEAN','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request consumables quote","buyer_fit":["Manufacturers","QA teams"]}'::jsonb),
  ('professional_services','Finished Product Packaging Development Service','Packaging development and sourcing support for regulated finished products. Scope, timelines and qualification requirements are confirmed during inquiry.','Packaging development','north_america','other','services','hv-packaging-development-service',true,'North America','New','HV-SVC-PKG','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request service review","buyer_fit":["Brands","Manufacturers"]}'::jsonb),
  ('professional_services','GMP Quality Systems Readiness Review','Structured readiness review for quality-system documentation and operational controls. Catalogue service; scope is confirmed before engagement.','GMP quality systems','europe','other','professional_services','hv-gmp-quality-systems-readiness',false,'Europe','New','HV-SVC-GMP','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request service review","buyer_fit":["Licensed operators","Manufacturers","QA leaders"]}'::jsonb),
  ('professional_services','Supply Chain Qualification & Vendor Review','Supplier qualification and commercial fit review for procurement programs. Catalogue service; deliverables and jurisdictions are confirmed during inquiry.','Supplier qualification','north_america','other','services','hv-supply-chain-vendor-review',false,'North America','New','HV-SVC-SCQ','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request service review","buyer_fit":["Procurement teams","Operators"]}'::jsonb),
  ('logistics','Regulated Goods Freight Lane Assessment','Commercial logistics planning service for regulated-goods freight lanes. Catalogue service; carrier, lane and documentation fit are confirmed before introduction.','Freight lane assessment','europe','other','logistics','hv-regulated-freight-lane-assessment',true,'Europe','New','HV-LOG-LANE','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request logistics review","buyer_fit":["Importers","Exporters","Distributors"]}'::jsonb),
  ('labs_testing','Stability & Release Testing Panel','Catalogue testing service covering stability and release-test planning. Actual laboratory scope, sample requirements and turnaround are confirmed before booking.','Stability / release testing','north_america','other','services','hv-stability-release-testing-panel',false,'North America','New','HV-LAB-STAB','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request lab review","buyer_fit":["Manufacturers","QA teams"]}'::jsonb),
  ('labs_testing','Microbiology & Contaminant Testing Panel','Catalogue laboratory testing panel for microbiological and contaminant screening. Confirm jurisdictional method requirements and laboratory availability before booking.','Microbiology / contaminant testing','europe','other','labs_testing','hv-microbiology-contaminant-testing',false,'Europe','New','HV-LAB-MICRO','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request lab review","buyer_fit":["Manufacturers","QA teams","Processors"]}'::jsonb),
  ('genetics','Genetic Material Evaluation Service','Catalogue service for genetic-material documentation and commercial-fit review. Any transaction remains subject to applicable licensing and jurisdictional requirements.','Genetic material evaluation','north_america','other','genetics','hv-genetic-material-evaluation-service',false,'North America','New','HV-GEN-EVAL','{"catalogue":true,"price_display":"Catalogue","cta_label":"Request genetics review","buyer_fit":["Breeders","Licensed operators"]}'::jsonb)
),
inserted as (
  insert into public.listings (
    category,title,description,product_type,region,seller_type,high_level_specs,status,
    marketplace_section,slug,public_visibility,is_featured,price_currency,location_country,
    condition,sold_by_harbourview,sku,compliance_flags,target_countries
  )
  select
    s.category::marketplace_category,
    s.title,
    s.description,
    s.product_type,
    s.region::region,
    s.seller_type::seller_type,
    s.specs || '{"review_required":true}'::jsonb,
    'approved'::listing_status,
    s.marketplace_section,
    s.slug,
    true,
    s.featured,
    'USD',
    s.location_country,
    s.condition,
    false,
    s.sku,
    '{"review_required":true}'::jsonb,
    '{}'::text[]
  from seed s
  where not exists (select 1 from public.listings l where l.slug = s.slug)
  returning id
)
select count(*) as inserted_rows from inserted;
