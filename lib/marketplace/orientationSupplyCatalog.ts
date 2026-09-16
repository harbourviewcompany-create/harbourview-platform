/**
 * Orientation supply catalog used only when live marketplace_public_listings_v1
 * returns no rows for a view. Clearly labelled — not live commercial inventory.
 */
import type { PublicListing } from '@/lib/server/listingsQuery'

const AS_OF = '2026-08-19'

function row(
  id: string,
  section: string,
  title: string,
  description: string,
  category: string,
  country: string,
  productType: string,
): PublicListing {
  return {
    id: `orientation-${id}`,
    slug: `orientation-${id}`,
    title,
    description: `${description} Orientation sample as of ${AS_OF} — not a live offer.`,
    category,
    subcategory: productType,
    marketplace_section: section,
    product_type: productType,
    region: country,
    condition: null,
    location_country: country,
    location_region: null,
    price_amount: null,
    price_currency: 'USD',
    price_display: 'On request',
    seller_type: 'orientation',
    is_featured: false,
    high_level_specs: { orientation: true, score: 50 },
    created_at: `${AS_OF}T00:00:00.000Z`,
    average_rating: null,
    review_count: null,
  }
}

/** Representative samples across marketplace sections used by Command Centre tabs. */
export const ORIENTATION_SUPPLY_CATALOG: PublicListing[] = [
  row('ca-flower-1', 'cannabis_inventory', 'EU-GMP flower — Canada origin (orientation)', 'Export-oriented flower SKU placeholder for CA→EU medical planning.', 'cannabis', 'CA', 'flower'),
  row('ca-preroll-1', 'cannabis_inventory', 'Pre-rolls — finished product format (orientation)', 'Finished pre-roll format placeholder covering single and multipack commercial configurations.', 'cannabis', 'CA', 'pre_roll'),
  row('ca-infused-preroll-1', 'cannabis_inventory', 'Infused pre-rolls — finished product format (orientation)', 'Infused pre-roll format placeholder. Product composition, testing, packaging and jurisdictional eligibility require confirmation.', 'cannabis', 'CA', 'infused_pre_roll'),
  row('ca-multipack-preroll-1', 'cannabis_inventory', 'Pre-roll multipacks — finished product format (orientation)', 'Multi-unit pre-roll packaging format placeholder for regulated product programs.', 'cannabis', 'CA', 'pre_roll_multipack'),
  row('ca-extract-1', 'cannabis_inventory', 'Distillate / extract — Canada (orientation)', 'Extract class placeholder for quality and import-permit sequencing.', 'cannabis', 'CA', 'extract'),
  row('ca-vape-1', 'cannabis_inventory', 'Vape cartridges — finished product format (orientation)', 'Vape cartridge format placeholder. Hardware, formulation, testing and jurisdictional requirements require confirmation.', 'cannabis', 'CA', 'vape_cartridge'),
  row('ca-edible-1', 'cannabis_inventory', 'Edibles — finished product format (orientation)', 'Edible product format placeholder for regulated product programs.', 'cannabis', 'CA', 'edible'),
  row('ca-beverage-1', 'cannabis_inventory', 'Cannabis beverages — finished product format (orientation)', 'Beverage format placeholder. Formulation, packaging and jurisdictional limits require confirmation.', 'cannabis', 'CA', 'beverage'),
  row('ca-capsule-1', 'cannabis_inventory', 'Capsules / softgels — finished product format (orientation)', 'Oral dosage-form placeholder for regulated product programs.', 'cannabis', 'CA', 'capsule'),
  row('ca-topical-1', 'cannabis_inventory', 'Topicals — finished product format (orientation)', 'Topical product format placeholder. Claims, formulation, testing and classification require confirmation.', 'cannabis', 'CA', 'topical'),
  row('ca-concentrate-1', 'cannabis_inventory', 'Concentrates — finished product format (orientation)', 'Concentrate format placeholder for regulated commercial programs.', 'cannabis', 'CA', 'concentrate'),
  row('ca-hash-1', 'cannabis_inventory', 'Hash / pressed concentrate — finished product format (orientation)', 'Hash-format placeholder. Product specification, testing and market eligibility require confirmation.', 'cannabis', 'CA', 'hash'),
  row('ca-rosin-1', 'cannabis_inventory', 'Rosin / solventless extract — finished product format (orientation)', 'Solventless extract format placeholder for regulated product programs.', 'cannabis', 'CA', 'rosin'),
  row('ca-oil-1', 'cannabis_inventory', 'Oral oils / tincture-format products (orientation)', 'Oral liquid format placeholder. Formulation, concentration, packaging and jurisdictional requirements require confirmation.', 'cannabis', 'CA', 'oral_oil'),
  row('ca-spray-1', 'cannabis_inventory', 'Oral spray — finished product format (orientation)', 'Oral spray format placeholder for regulated product programs.', 'cannabis', 'CA', 'oral_spray'),
  row('ca-suppository-1', 'cannabis_inventory', 'Suppository-format product (orientation)', 'Specialty dosage-form placeholder. Classification and jurisdictional eligibility require confirmation.', 'cannabis', 'CA', 'suppository'),
  row('ca-biomass-1', 'cannabis_inventory', 'Cannabis biomass / starting material (orientation)', 'Starting-material format placeholder for qualified processing programs.', 'cannabis', 'CA', 'biomass'),
  row('ca-seed-1', 'cannabis_inventory', 'Cannabis seed / genetics supply format (orientation)', 'Seed/genetics marketplace format placeholder. Rights, import controls and jurisdictional eligibility require confirmation.', 'cannabis', 'CA', 'seed'),
  row('pt-flower-1', 'export_ready', 'EU-GMP flower — Portugal (orientation)', 'Intra-EU supply orientation for PT→DE style lanes.', 'cannabis', 'PT', 'flower'),
  row('nl-flower-1', 'export', 'Netherlands medical flower (orientation)', 'OMC / wholesale channel orientation sample.', 'cannabis', 'NL', 'flower'),
  row('co-biomass-1', 'biomass', 'Colombian biomass / starting material (orientation)', 'GACP origin material often routed via EU processing.', 'cannabis', 'CO', 'biomass'),
  row('il-flower-1', 'flower', 'Israel medical flower (orientation)', 'IMCA export orientation sample.', 'cannabis', 'IL', 'flower'),
  row('de-import-1', 'import_demand', 'German importer demand signal (orientation)', 'Demand-side placeholder for BfArM-path importers.', 'cannabis', 'DE', 'flower'),
  row('eq-cult-1', 'cultivation_equipment', 'Cultivation HVAC / room package (orientation)', 'Equipment category sample for facility build-outs.', 'equipment', 'CA', 'equipment'),
  row('eq-proc-1', 'processing_equipment', 'Extraction / processing line (orientation)', 'Processing equipment orientation sample.', 'equipment', 'DE', 'equipment'),
  row('eq-used-1', 'used_surplus', 'Used surplus cultivation assets (orientation)', 'Surplus equipment orientation sample.', 'equipment', 'CA', 'equipment'),
  row('con-pack-1', 'packaging', 'Child-resistant packaging suite (orientation)', 'Consumables / packaging orientation sample.', 'consumables', 'CA', 'packaging'),
  row('con-gen-1', 'consumables', 'Cultivation consumables kit (orientation)', 'Nutrients / consumables orientation sample.', 'consumables', 'NL', 'consumables'),
  row('np-1', 'new_products', 'Novel dosage form (orientation)', 'New product orientation placeholder.', 'new_products', 'CA', 'finished_product'),
  row('svc-log-1', 'logistics', 'Controlled-drug capable freight (orientation)', 'Logistics partner orientation sample.', 'services', 'DE', 'logistics'),
  row('svc-lab-1', 'lab_testing', 'ISO lab testing panel (orientation)', 'Third-party lab orientation sample.', 'services', 'CA', 'lab_testing'),
  row('svc-pro-1', 'professional_services', 'EU-GMP consulting (orientation)', 'Professional services orientation sample.', 'services', 'PT', 'services'),
  row('opp-1', 'business_opportunities', 'Facility partnership (orientation)', 'Opportunity orientation sample — not a live deal.', 'opportunities', 'CA', 'opportunity'),
  row('opp-2', 'distressed_inventory', 'Inventory repositioning (orientation)', 'Distressed inventory orientation sample.', 'opportunities', 'DE', 'opportunity'),
  row('want-1', 'wanted_requests', 'Wanted: EU-GMP flower supply (orientation)', 'Buyer wanted-request orientation sample.', 'wanted', 'DE', 'flower'),
]

export function orientationListingsForSections(
  sections: string[],
  countryIso2?: string | null,
  limit = 8,
): PublicListing[] {
  const sectionSet = new Set(sections.map((s) => s.toLowerCase()))
  let rows = ORIENTATION_SUPPLY_CATALOG.filter((r) =>
    sectionSet.has(r.marketplace_section.toLowerCase()),
  )
  if (countryIso2) {
    const code = countryIso2.toUpperCase()
    const countryHit = rows.filter((r) => r.location_country === code)
    if (countryHit.length > 0) rows = countryHit
  }
  return rows.slice(0, limit)
}