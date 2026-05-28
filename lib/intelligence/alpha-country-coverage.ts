export type AlphaCountryCoverageRow = {
  iso_alpha2: string
  iso_alpha3?: string
  country_name: string
  country_slug: string
  region: string
  market_access_status: string | null
  medical_status: string | null
  adult_use_status: string | null
  import_status: string | null
  export_status: string | null
  public_summary: string | null
  regulator_label: string | null
  opportunity_score: number | null
  data_completeness: 'public-safe-seed' | 'needs-review' | 'gap-state'
  opportunity_categories: string[]
  trade_roles: string[]
  lat: number | null
  lng: number | null
  source_note: string
}

const alphaCountryCoverageRows: AlphaCountryCoverageRow[] = [
  {
    iso_alpha2: 'DE',
    iso_alpha3: 'DEU',
    country_name: 'Germany',
    country_slug: 'germany',
    region: 'Europe',
    market_access_status: 'needs review',
    medical_status: 'active',
    adult_use_status: 'emerging',
    import_status: 'active',
    export_status: 'unknown',
    public_summary:
      'Priority European access market. Public use requires analyst review before presenting country-specific route claims.',
    regulator_label: 'BfArM / regional authorities',
    opportunity_score: null,
    data_completeness: 'needs-review',
    opportunity_categories: ['medical import pathway', 'pharmacy channel intelligence', 'EU-GMP supply qualification', 'pilot-program monitoring'],
    trade_roles: ['import market', 'buyer demand signal'],
    lat: 51,
    lng: 10,
    source_note: 'Repository-backed alpha country fixture.',
  },
  {
    iso_alpha2: 'GB',
    iso_alpha3: 'GBR',
    country_name: 'United Kingdom',
    country_slug: 'united-kingdom',
    region: 'Europe',
    market_access_status: 'needs review',
    medical_status: 'active',
    adult_use_status: 'unknown',
    import_status: 'active',
    export_status: 'unknown',
    public_summary:
      'Medical access market with import and specialist-prescribing relevance. Treat country-specific route claims as request-only until reviewed.',
    regulator_label: 'Home Office / MHRA',
    opportunity_score: null,
    data_completeness: 'needs-review',
    opportunity_categories: ['medical access monitoring', 'import pathway review', 'clinic and pharmacy channel mapping'],
    trade_roles: ['import market'],
    lat: 54,
    lng: -2,
    source_note: 'Repository-backed alpha country fixture.',
  },
  {
    iso_alpha2: 'CA',
    iso_alpha3: 'CAN',
    country_name: 'Canada',
    country_slug: 'canada',
    region: 'North America',
    market_access_status: 'public-safe seed',
    medical_status: 'active',
    adult_use_status: 'open',
    import_status: 'unknown',
    export_status: 'active',
    public_summary:
      'Established regulated producer and export-origin market. Public fixture excludes non-public counterparties, commercial terms, direct contact details and evidence records.',
    regulator_label: 'Health Canada',
    opportunity_score: null,
    data_completeness: 'public-safe-seed',
    opportunity_categories: ['export-origin qualification', 'licensed producer screening', 'bulk supply discovery', 'regulatory export documentation review'],
    trade_roles: ['export market', 'supply origin'],
    lat: 56,
    lng: -106,
    source_note: 'Repository-backed alpha country fixture.',
  },
  {
    iso_alpha2: 'CO',
    iso_alpha3: 'COL',
    country_name: 'Colombia',
    country_slug: 'colombia',
    region: 'South America',
    market_access_status: 'needs review',
    medical_status: 'active',
    adult_use_status: 'unknown',
    import_status: 'unknown',
    export_status: 'active',
    public_summary:
      'Regional cultivation and export-origin candidate. Public route claims remain withheld pending evidence review and date-stamped policy validation.',
    regulator_label: 'Ministry of Health / INVIMA',
    opportunity_score: null,
    data_completeness: 'needs-review',
    opportunity_categories: ['cultivation pathway review', 'export-origin screening', 'Latin America policy monitoring'],
    trade_roles: ['export market', 'supply origin'],
    lat: 4.6,
    lng: -74.1,
    source_note: 'Repository-backed alpha country fixture.',
  },
  {
    iso_alpha2: 'BR',
    iso_alpha3: 'BRA',
    country_name: 'Brazil',
    country_slug: 'brazil',
    region: 'South America',
    market_access_status: 'needs review',
    medical_status: 'active',
    adult_use_status: 'unknown',
    import_status: 'active',
    export_status: 'unknown',
    public_summary:
      'Large medical-access market with evolving policy and import relevance. Keep public presentation conservative until current rules are rechecked.',
    regulator_label: 'ANVISA',
    opportunity_score: null,
    data_completeness: 'needs-review',
    opportunity_categories: ['medical access monitoring', 'import pathway review', 'policy change tracking'],
    trade_roles: ['import market', 'buyer demand signal'],
    lat: -14.2,
    lng: -51.9,
    source_note: 'Repository-backed alpha country fixture.',
  },
  {
    iso_alpha2: 'AU',
    iso_alpha3: 'AUS',
    country_name: 'Australia',
    country_slug: 'australia',
    region: 'Oceania',
    market_access_status: 'needs review',
    medical_status: 'active',
    adult_use_status: 'unknown',
    import_status: 'active',
    export_status: 'active',
    public_summary:
      'Medical cannabis market with import and domestic production relevance. Public country pages require normalization before use as completed briefs.',
    regulator_label: 'TGA / ODC',
    opportunity_score: null,
    data_completeness: 'needs-review',
    opportunity_categories: ['medical market access', 'import pathway review', 'operator screening'],
    trade_roles: ['import market', 'domestic production'],
    lat: -25,
    lng: 133,
    source_note: 'Repository-backed alpha country fixture.',
  },
  ...[
    ['PT', 'PRT', 'Portugal', 'portugal', 'Europe'],
    ['NL', 'NLD', 'Netherlands', 'netherlands', 'Europe'],
    ['US', 'USA', 'United States', 'united-states', 'North America'],
    ['UY', 'URY', 'Uruguay', 'uruguay', 'South America'],
    ['IL', 'ISR', 'Israel', 'israel', 'Middle East'],
    ['ZA', 'ZAF', 'South Africa', 'south-africa', 'Africa'],
  ].map(([iso_alpha2, iso_alpha3, country_name, country_slug, region]) => ({
    iso_alpha2,
    iso_alpha3,
    country_name,
    country_slug,
    region,
    market_access_status: 'tracked alpha',
    medical_status: null,
    adult_use_status: null,
    import_status: null,
    export_status: null,
    public_summary:
      'Tracked by the alpha globe/router, but no public country brief fixture is published in the repository yet.',
    regulator_label: null,
    opportunity_score: null,
    data_completeness: 'gap-state' as const,
    opportunity_categories: [],
    trade_roles: [],
    lat: null,
    lng: null,
    source_note: 'Repository-backed alpha globe/router gap state.',
  })),
]

export const alphaCountryRows = alphaCountryCoverageRows

export function getAlphaCountryRows() {
  return alphaCountryRows.map((country) => ({ ...country, opportunity_categories: [...country.opportunity_categories], trade_roles: [...country.trade_roles] }))
}

export function getAlphaCountryByIso2(iso2?: string | null) {
  if (!iso2) return null
  return getAlphaCountryRows().find((country) => country.iso_alpha2 === iso2.toUpperCase()) ?? null
}

export function getAlphaCountryBySlug(slug?: string | null) {
  if (!slug) return null
  return getAlphaCountryRows().find((country) => country.country_slug === slug) ?? null
}
