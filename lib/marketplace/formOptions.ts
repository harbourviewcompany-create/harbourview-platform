// Shared option lists for marketplace forms and filters.
// Single source of truth — ConsumablesFilterBar, ConsumablesSupplierForm,
// and PromoteToListingForm all import from here.

export type SelectOption = { value: string; label: string }

// ── Geographic regions ────────────────────────────────────────────────────────

export const SUPPLY_REGIONS: SelectOption[] = [
  { value: 'europe',           label: 'Europe'                  },
  { value: 'asia_pacific',     label: 'Asia Pacific'            },
  { value: 'north_america',    label: 'North America'           },
  { value: 'latin_america',    label: 'Latin America'           },
  { value: 'middle_east_africa', label: 'Middle East & Africa'  },
  { value: 'global',           label: 'Global / Multiple'       },
]

// Filter variant: prepend "All regions" for filter UIs
export const FILTER_REGIONS: SelectOption[] = [
  { value: 'all', label: 'All regions' },
  ...SUPPLY_REGIONS,
]

// ── Consumables ───────────────────────────────────────────────────────────────

export const CONSUMABLES_PRODUCT_TYPES: SelectOption[] = [
  { value: 'all',         label: 'All products'  },
  { value: 'pre-roll cones', label: 'Pre-roll cones' },
  { value: 'pouches',     label: 'Pouches'        },
  { value: 'jars',        label: 'Jars'           },
  { value: 'labels',      label: 'Labels'         },
  { value: 'packaging',   label: 'Packaging'      },
  { value: 'lab',         label: 'Lab & QA'       },
  { value: 'extraction',  label: 'Extraction'     },
]

export const CONSUMABLES_CATEGORIES: string[] = [
  'Pre-roll cones',
  'Child-resistant pouches',
  'Glass dispensary jars',
  'Concentrate jars',
  'Exit bags',
  'Humidity control packs',
  'Labels & stickers',
  'Extraction solvents',
  'Lab consumables',
  'PPE & facility supplies',
  'Cultivation inputs',
  'Other consumables',
]

export const CONSUMABLES_CERTIFICATIONS: string[] = [
  'ISO 9001',
  'GMP',
  'EN 14375 (CR packaging)',
  'ASTM D3475 (CR packaging)',
  'REACH compliant',
  'FSC (paper products)',
  'FDA registered facility',
  'Other',
]

export const CONSUMABLES_INCOTERMS: string[] = ['FOB', 'CIF', 'DAP', 'DDP', 'EXW', 'FCA']

// ── Listings ──────────────────────────────────────────────────────────────────

export const LISTING_CATEGORIES: SelectOption[] = [
  { value: 'consumables',          label: 'Consumables & Operating Supplies' },
  { value: 'cannabis_inventory',   label: 'Cannabis Inventory'               },
  { value: 'new_products',         label: 'New Products'                      },
  { value: 'used_surplus',         label: 'Used & Surplus Equipment'          },
  { value: 'export_ready',         label: 'Export Ready'                      },
  { value: 'import_demand',        label: 'Import Demand'                     },
  { value: 'genetics',             label: 'Genetics'                          },
  { value: 'processing_equipment', label: 'Processing Equipment'              },
  { value: 'cultivation_equipment',label: 'Cultivation Equipment'             },
  { value: 'labs_testing',         label: 'Labs & Testing'                    },
  { value: 'logistics',            label: 'Logistics'                         },
  { value: 'packaging',            label: 'Packaging'                         },
  { value: 'professional_services',label: 'Professional Services'             },
  { value: 'services',             label: 'Services'                          },
  { value: 'business_opportunities',label: 'Business Opportunities'           },
  { value: 'distressed_inventory', label: 'Distressed Inventory'              },
  { value: 'distressed_businesses',label: 'Distressed Businesses'             },
]

// Filter variant: prepend "All categories" for the listings filter bar
export const FILTER_LISTING_CATEGORIES: SelectOption[] = [
  { value: 'all', label: 'All categories' },
  ...LISTING_CATEGORIES,
]

export const LISTING_SORT_OPTIONS: SelectOption[] = [
  { value: 'featured', label: 'Featured first' },
  { value: 'rating', label: 'Top rated' },
]

export const LISTING_SELLER_TYPES: SelectOption[] = [
  { value: 'licensed_producer', label: 'Licensed Producer' },
  { value: 'distributor',       label: 'Distributor'       },
  { value: 'wholesaler',        label: 'Wholesaler'        },
  { value: 'retailer',          label: 'Retailer'          },
  { value: 'investor',          label: 'Investor'          },
  { value: 'other',             label: 'Other'             },
]
