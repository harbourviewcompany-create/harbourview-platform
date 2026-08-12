-- Extend the already-live Canada supply catalog's generic equipment,
-- cultivation, and lab/testing SKUs to Germany (DE), while deliberately
-- EXCLUDING all consumer-facing cannabis packaging (pouches, jars, tubes,
-- vape/edible/concentrate/tincture/topical packaging, exit bags, compliance
-- labels, rolling papers/cones/filter tips).
--
-- Rationale (researched this session, not carried over from Canada):
-- Germany's CanG framework has no live commercial consumer-retail channel
-- yet -- personal possession, home cultivation, and non-profit Cannabis
-- Social Clubs are legal, but the commercial retail pilot ("Pillar 2") is
-- still draft legislation as of early 2026. Medical cannabis is dispensed
-- via pharmacies as a per-prescription "magistral formulation" -- pharmacies
-- repackage the product themselves, so manufacturer consumer packaging
-- generally doesn't reach the end customer. Advertising cannabis products is
-- also restricted under Section 6 KCanG. Listing Canada-style branded
-- consumer packaging (with Canada-specific CR/plain-packaging compliance
-- claims) as available in Germany would be both inaccurate and legally
-- risky.
--
-- What IS legitimate today: selling cultivation equipment, processing
-- equipment, lab/testing supplies, and generic (non-cannabis-branded)
-- consumables to licensed German cultivators, producers, and Social Clubs.
-- This migration extends exactly that subset -- 35 of the 68 Canada SKUs --
-- to DE via target_countries. No new compliance_flags.DE claims are added;
-- none of these items carry country-specific packaging compliance
-- requirements in the first place (they're equipment/consumables, not
-- consumer packaging).
--
-- Already applied directly to the live project this session; this file is
-- the historical record, consistent with the other migrations in this PR.

update public.listings
set target_countries = array_append(target_countries, 'DE')
where sold_by_harbourview = true
and product_type in (
  'grow_media','nutrients','trellis','cloning_supply','propagation_kit','grow_light','irrigation',
  'lab_supply','lab_equipment','curing_supply','humidity_pack','shipping_supply',
  'pre_roll_machine','shredder','scale','sealing_equipment','capping_equipment',
  'labeling_equipment','filling_equipment','packing_equipment','concentrate_supply','tincture_supply'
)
and not ('DE' = any(target_countries));
