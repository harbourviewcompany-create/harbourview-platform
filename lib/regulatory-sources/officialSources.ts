import type { RegulatorySourceType, RegulatorySourceTier } from '@/lib/regulatory-signals/types'

export type RegulatoryAccessMethod = 'rss' | 'api' | 'html' | 'pdf' | 'manual'
export type RegulatoryWatchFrequency = 'hourly' | 'daily' | 'weekly' | 'manual'

export type StarterRegulatorySource = {
  source_name: string
  source_type: RegulatorySourceType
  source_tier: RegulatorySourceTier
  country_code: string
  country_name: string
  region: string
  jurisdiction: string
  regulator_name: string
  base_url: string
  watch_url: string
  rss_url: string | null
  language_code: string
  access_method: RegulatoryAccessMethod
  watch_frequency: RegulatoryWatchFrequency
  validation_notes: string
}

export const REGULATORY_RELEVANCE_TERMS = [
  'cannabis',
  'marijuana',
  'marihuana',
  'hemp',
  'cannabinoid',
  'cannabidiol',
  'cbd',
  'thc',
  'controlled substance',
  'narcotic',
  'import',
  'export',
  'licence',
  'license',
  'licensing',
  'pharmacy',
  'prescription',
  'cultivation',
  'gmp',
  'gacp',
  'novel food',
] as const

export const STARTER_REGULATORY_SOURCES: StarterRegulatorySource[] = [
  ['Canada Gazette RSS', 'official_gazette', 'CA', 'Canada', 'North America', 'Federal', 'Canada Gazette', 'https://www.gazette.gc.ca/', 'https://www.gazette.gc.ca/rp-pr/publications-eng.html', 'https://gazette.gc.ca/rss/sc-rb-eng.html', 'en', 'rss', 'Official Canada Gazette publication/RSS surface.'],
  ['Health Canada cannabis regulatory updates', 'health_authority', 'CA', 'Canada', 'North America', 'Federal', 'Health Canada', 'https://www.canada.ca/en/health-canada.html', 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis.html', null, 'en', 'html', 'Official Health Canada cannabis regulatory surface.'],
  ['Health Canada recalls and safety alerts', 'health_authority', 'CA', 'Canada', 'North America', 'Federal', 'Health Canada', 'https://recalls-rappels.canada.ca/', 'https://recalls-rappels.canada.ca/en/search/site', null, 'en', 'html', 'Official Government of Canada recalls and safety alerts surface.'],
  ['Federal Register API cannabis search', 'official_gazette', 'US', 'United States', 'North America', 'Federal', 'Federal Register', 'https://www.federalregister.gov/', 'https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=cannabis%20marijuana%20hemp%20cannabinoid&order=newest&per_page=20', null, 'en', 'api', 'Official Federal Register API search for regulated-market terms.'],
  ['Regulations.gov cannabis docket search', 'consultation_portal', 'US', 'United States', 'North America', 'Federal', 'Regulations.gov', 'https://www.regulations.gov/', 'https://api.regulations.gov/v4/documents?filter%5BsearchTerm%5D=cannabis', null, 'en', 'api', 'Official U.S. docket/rulemaking API candidate.'],
  ['FDA cannabis and cannabis-derived products', 'health_authority', 'US', 'United States', 'North America', 'Federal', 'U.S. Food and Drug Administration', 'https://www.fda.gov/', 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd', null, 'en', 'html', 'Official FDA cannabis and cannabis-derived product regulatory page.'],
  ['USDA domestic hemp production program', 'government_ministry', 'US', 'United States', 'North America', 'Federal', 'USDA Agricultural Marketing Service', 'https://www.ams.usda.gov/', 'https://www.ams.usda.gov/rules-regulations/hemp', null, 'en', 'html', 'Official USDA hemp program source.'],
  ['EUR-Lex Official Journal access', 'international_body', 'EU', 'European Union', 'Europe', 'Supranational', 'EUR-Lex', 'https://eur-lex.europa.eu/', 'https://eur-lex.europa.eu/oj/direct-access.html', 'https://eur-lex.europa.eu/content/help/search/predefined-rss.html', 'en', 'rss', 'Official EU law and Official Journal surface.'],
  ['EU TRIS technical regulation notifications', 'international_body', 'EU', 'European Union', 'Europe', 'Supranational', 'European Commission TRIS', 'https://technical-regulation-information-system.ec.europa.eu/', 'https://technical-regulation-information-system.ec.europa.eu/en/home', null, 'en', 'html', 'Official EU technical regulation notification source.'],
  ['BfArM Federal Opium Agency narcotic drugs', 'drug_control_authority', 'DE', 'Germany', 'Europe', 'Federal', 'BfArM Federal Opium Agency', 'https://www.bfarm.de/', 'https://www.bfarm.de/EN/Federal-Opium-Agency/Narcotic-drugs/_node.html', null, 'en', 'html', 'Official German Federal Opium Agency source.'],
  ['UK MHRA medicinal products updates', 'health_authority', 'GB', 'United Kingdom', 'Europe', 'National', 'Medicines and Healthcare products Regulatory Agency', 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency', 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency', null, 'en', 'html', 'Official UK medicines regulator source.'],
  ['UK Home Office drugs licensing', 'drug_control_authority', 'GB', 'United Kingdom', 'Europe', 'National', 'UK Home Office', 'https://www.gov.uk/government/organisations/home-office', 'https://www.gov.uk/government/collections/drugs-licensing', null, 'en', 'html', 'Official UK controlled-drug licensing source.'],
  ['UK Food Standards Agency CBD guidance', 'health_authority', 'GB', 'United Kingdom', 'Europe', 'National', 'Food Standards Agency', 'https://www.food.gov.uk/', 'https://www.food.gov.uk/business-guidance/cannabidiol-cbd', null, 'en', 'html', 'Official UK CBD/food-business guidance source.'],
  ['Australia TGA medicinal cannabis', 'health_authority', 'AU', 'Australia', 'Oceania', 'Federal', 'Therapeutic Goods Administration', 'https://www.tga.gov.au/', 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/medicinal-cannabis', null, 'en', 'html', 'Official Australian TGA medicinal cannabis source.'],
  ['Australia Office of Drug Control', 'drug_control_authority', 'AU', 'Australia', 'Oceania', 'Federal', 'Office of Drug Control', 'https://www.odc.gov.au/', 'https://www.odc.gov.au/', null, 'en', 'html', 'Official Australian drug-control source.'],
  ['Brazil ANVISA cannabis products', 'health_authority', 'BR', 'Brazil', 'Latin America', 'Federal', 'ANVISA', 'https://www.gov.br/anvisa/', 'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/produtos-de-cannabis', null, 'pt', 'html', 'Official ANVISA cannabis-products source candidate.'],
  ['Brazil National Press official gazette', 'official_gazette', 'BR', 'Brazil', 'Latin America', 'Federal', 'Imprensa Nacional', 'https://www.in.gov.br/', 'https://www.in.gov.br/', null, 'pt', 'html', 'Official Brazil national publication source.'],
].map(([source_name, source_type, country_code, country_name, region, jurisdiction, regulator_name, base_url, watch_url, rss_url, language_code, access_method, validation_notes]) => ({
  source_name: source_name as string,
  source_type: source_type as RegulatorySourceType,
  source_tier: 'tier_1_official',
  country_code: country_code as string,
  country_name: country_name as string,
  region: region as string,
  jurisdiction: jurisdiction as string,
  regulator_name: regulator_name as string,
  base_url: base_url as string,
  watch_url: watch_url as string,
  rss_url: rss_url as string | null,
  language_code: language_code as string,
  access_method: access_method as RegulatoryAccessMethod,
  watch_frequency: 'daily',
  validation_notes: validation_notes as string,
}))
