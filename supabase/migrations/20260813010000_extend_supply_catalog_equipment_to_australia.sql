-- Extend the same generic equipment/cultivation/lab supply SKUs already
-- extended to Germany (see 20260812190000_extend_supply_catalog_equipment_to_germany.sql)
-- to Australia (AU). Same exclusion logic applies to consumer packaging.
--
-- Rationale (researched this session):
-- Australia's cannabis framework is medical-only nationwide, regulated by
-- the TGA under the Therapeutic Goods Act / TGO 93. There is no legal
-- recreational retail channel anywhere in the country -- the ACT permits
-- personal possession and home cultivation only, and every purchase there
-- is still a supply offence for the seller. Medicinal cannabis packaging
-- must meet TGO 93 (child-resistant closures except for plant material,
-- specific label content under section 15) and imported product requires
-- GMP-equivalent evidence -- requirements this catalog cannot currently
-- verify or claim compliance with per-SKU. The TGA is also actively
-- enforcing against unlawful advertising of medicinal cannabis (e.g.
-- ongoing Federal Court proceedings against at least one operator as of
-- mid-2026), which is a real reason to be conservative about what gets
-- listed as available in this market.
--
-- As with Germany: extending only the generic, non-cannabis-branded
-- equipment/cultivation/lab/consumables SKUs (35 of 68) to AU, since selling
-- grow lights, nutrients, lab consumables, and production machinery to
-- licensed Australian cultivators/manufacturers is legitimate and does not
-- implicate TGO 93 consumer-packaging or advertising rules the way listing
-- branded consumer packaging would. No compliance_flags.AU claims added.
--
-- Already applied directly to the live project this session; this file is
-- the historical record, consistent with the other migrations in this area.

update public.listings
set target_countries = array_append(target_countries, 'AU')
where sold_by_harbourview = true
and product_type in (
  'grow_media','nutrients','trellis','cloning_supply','propagation_kit','grow_light','irrigation',
  'lab_supply','lab_equipment','curing_supply','humidity_pack','shipping_supply',
  'pre_roll_machine','shredder','scale','sealing_equipment','capping_equipment',
  'labeling_equipment','filling_equipment','packing_equipment','concentrate_supply','tincture_supply'
)
and not ('AU' = any(target_countries));
