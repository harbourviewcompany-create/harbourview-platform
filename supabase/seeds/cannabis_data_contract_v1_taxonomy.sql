-- =============================================================================
-- Harbourview Global Cannabis Data Contract v1.0 taxonomy seed
-- Seeds taxonomy and required coverage matrix only.
-- Does not seed jurisdiction, legal status, regulator, licence register,
-- licensee, medical, import/export, product COA, supplier, or commercial facts.
-- =============================================================================

begin;

insert into cannabis_intelligence.plant_product_categories (slug, display_name, sort_order)
values
  ('cannabis_high_thc', 'Cannabis high THC', 10),
  ('medical_cannabis', 'Medical cannabis', 20),
  ('pharmaceutical_cannabinoid', 'Pharmaceutical cannabinoid', 30),
  ('cbd', 'CBD', 40),
  ('industrial_hemp', 'Industrial hemp', 50),
  ('hemp_fibre', 'Hemp fibre', 60),
  ('hemp_seed', 'Hemp seed', 70),
  ('hemp_food', 'Hemp food', 80),
  ('hemp_feed', 'Hemp feed', 90),
  ('hemp_cosmetic', 'Hemp cosmetic', 100),
  ('hemp_construction_material', 'Hemp construction material', 110),
  ('hemp_biomass', 'Hemp biomass', 120),
  ('cannabis_flower', 'Cannabis flower', 130),
  ('cannabis_resin', 'Cannabis resin', 140),
  ('cannabis_extract', 'Cannabis extract', 150),
  ('cannabis_oil', 'Cannabis oil', 160),
  ('cannabis_tincture', 'Cannabis tincture', 170),
  ('cannabis_edible', 'Cannabis edible', 180),
  ('cannabis_topical', 'Cannabis topical', 190),
  ('cannabis_vape', 'Cannabis vape', 200),
  ('minor_cannabinoid', 'Minor cannabinoid', 210),
  ('synthetic_cannabinoid', 'Synthetic cannabinoid', 220),
  ('intoxicating_hemp_derived_cannabinoid', 'Intoxicating hemp-derived cannabinoid', 230),
  ('seed_genetics', 'Seed genetics', 240),
  ('clone_plant_material', 'Clone plant material', 250),
  ('research_cannabis', 'Research cannabis', 260),
  ('laboratory_reference_material', 'Laboratory reference material', 270),
  ('other_cannabis_plant_related', 'Other cannabis plant related', 280)
on conflict (slug) do update
set display_name = excluded.display_name,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into cannabis_intelligence.product_forms (slug, display_name, sort_order)
values
  ('dried_flower', 'Dried flower', 10),
  ('resin', 'Resin', 20),
  ('hashish', 'Hashish', 30),
  ('oil', 'Oil', 40),
  ('tincture', 'Tincture', 50),
  ('capsule', 'Capsule', 60),
  ('tablet', 'Tablet', 70),
  ('edible', 'Edible', 80),
  ('beverage', 'Beverage', 90),
  ('topical', 'Topical', 100),
  ('cosmetic', 'Cosmetic', 110),
  ('vape_cartridge', 'Vape cartridge', 120),
  ('seed', 'Seed', 130),
  ('clone', 'Clone', 140),
  ('fibre', 'Fibre', 150),
  ('grain', 'Grain', 160),
  ('seed_oil', 'Seed oil', 170),
  ('protein_powder', 'Protein powder', 180),
  ('animal_feed', 'Animal feed', 190),
  ('construction_material', 'Construction material', 200),
  ('biomass', 'Biomass', 210),
  ('api_active_pharmaceutical_ingredient', 'API active pharmaceutical ingredient', 220),
  ('finished_medicine', 'Finished medicine', 230)
on conflict (slug) do update
set display_name = excluded.display_name,
    sort_order = excluded.sort_order,
    updated_at = now();

with required_activities(activity) as (
  values
    ('adult_use_sale'::cannabis_intelligence.activity_type),
    ('medical_use'::cannabis_intelligence.activity_type),
    ('prescribing'::cannabis_intelligence.activity_type),
    ('dispensing'::cannabis_intelligence.activity_type),
    ('pharmacy_distribution'::cannabis_intelligence.activity_type),
    ('cultivation'::cannabis_intelligence.activity_type),
    ('home_cultivation'::cannabis_intelligence.activity_type),
    ('commercial_cultivation'::cannabis_intelligence.activity_type),
    ('hemp_cultivation'::cannabis_intelligence.activity_type),
    ('processing'::cannabis_intelligence.activity_type),
    ('extraction'::cannabis_intelligence.activity_type),
    ('manufacturing'::cannabis_intelligence.activity_type),
    ('testing'::cannabis_intelligence.activity_type),
    ('research'::cannabis_intelligence.activity_type),
    ('clinical_trial'::cannabis_intelligence.activity_type),
    ('import'::cannabis_intelligence.activity_type),
    ('export'::cannabis_intelligence.activity_type),
    ('wholesale'::cannabis_intelligence.activity_type),
    ('distribution'::cannabis_intelligence.activity_type),
    ('retail'::cannabis_intelligence.activity_type),
    ('online_sale'::cannabis_intelligence.activity_type),
    ('advertising'::cannabis_intelligence.activity_type),
    ('packaging'::cannabis_intelligence.activity_type),
    ('labelling'::cannabis_intelligence.activity_type),
    ('transport'::cannabis_intelligence.activity_type),
    ('storage'::cannabis_intelligence.activity_type),
    ('waste_disposal'::cannabis_intelligence.activity_type),
    ('food_use'::cannabis_intelligence.activity_type),
    ('feed_use'::cannabis_intelligence.activity_type),
    ('cosmetic_use'::cannabis_intelligence.activity_type),
    ('construction_material_use'::cannabis_intelligence.activity_type),
    ('seed_sale'::cannabis_intelligence.activity_type),
    ('genetics_sale'::cannabis_intelligence.activity_type),
    ('public_procurement'::cannabis_intelligence.activity_type)
)
insert into cannabis_intelligence.activity_product_matrix (activity, plant_product_category_id, coverage_required, notes_public)
select required_activities.activity, plant_product_categories.id, true, 'Required v1.0 coverage pair; presence does not assert legal status.'
from required_activities
cross join cannabis_intelligence.plant_product_categories
where plant_product_categories.slug in (
  'cannabis_high_thc','medical_cannabis','pharmaceutical_cannabinoid','cbd','industrial_hemp','hemp_fibre','hemp_seed','hemp_food','hemp_feed','hemp_cosmetic','hemp_construction_material','hemp_biomass','cannabis_flower','cannabis_resin','cannabis_extract','cannabis_oil','cannabis_tincture','cannabis_edible','cannabis_topical','cannabis_vape','minor_cannabinoid','synthetic_cannabinoid','intoxicating_hemp_derived_cannabinoid','seed_genetics','clone_plant_material','research_cannabis','laboratory_reference_material','other_cannabis_plant_related'
)
on conflict (activity, plant_product_category_id) do update
set coverage_required = true,
    notes_public = excluded.notes_public,
    updated_at = now();

commit;
