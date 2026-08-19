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
  row('ca-extract-1', 'extract', 'Distillate / extract — Canada (orientation)', 'Extract class placeholder for quality and import-permit sequencing.', 'cannabis', 'CA', 'extract'),
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
