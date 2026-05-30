// Canadian province profiles — regulatory context, slugs, and Canada-wide shared section
// Each province routes to /dashboard/country/[province-slug]
// The dashboard shows province-specific data + a shared Canada-wide section

export interface CanadaProvinceProfile {
  iso2: string          // e.g. 'CA-ON'
  slug: string          // URL slug e.g. 'ontario'
  name: string
  abbreviation: string  // postal code
  capital: string
  regulatoryModel: 'adult_use_medical' | 'medical_only' | 'adult_use_only'
  retailAuthority: string
  keyNotes: string
  dashboardStatus: 'live' | 'partial' | 'static-orientation' | 'unavailable'
}

export const canadaProvinceProfiles: CanadaProvinceProfile[] = [
  {
    iso2: 'CA-AB',
    slug: 'alberta',
    name: 'Alberta',
    abbreviation: 'AB',
    capital: 'Edmonton',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Alberta Gaming, Liquor and Cannabis (AGLC)',
    keyNotes: 'Private retail model. AGLC wholesale only. No municipal opt-out.',
    dashboardStatus: 'static-orientation',
  },
  {
    iso2: 'CA-BC',
    slug: 'british-columbia',
    name: 'British Columbia',
    abbreviation: 'BC',
    capital: 'Victoria',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'BC Liquor Distribution Branch (BCLDB)',
    keyNotes: 'Mixed public/private retail. BCLDB wholesale. Strong export positioning via Pacific ports.',
    dashboardStatus: 'static-orientation',
  },
  {
    iso2: 'CA-MB',
    slug: 'manitoba',
    name: 'Manitoba',
    abbreviation: 'MB',
    capital: 'Winnipeg',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Manitoba Liquor & Lotteries (MLL)',
    keyNotes: 'Private retail, public wholesale. Lower per-capita retail density.',
    dashboardStatus: 'unavailable',
  },
  {
    iso2: 'CA-NB',
    slug: 'new-brunswick',
    name: 'New Brunswick',
    abbreviation: 'NB',
    capital: 'Fredericton',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Cannabis NB',
    keyNotes: 'Government-operated retail. Cannabis NB controls distribution and retail.',
    dashboardStatus: 'unavailable',
  },
  {
    iso2: 'CA-NL',
    slug: 'newfoundland-and-labrador',
    name: 'Newfoundland and Labrador',
    abbreviation: 'NL',
    capital: "St. John's",
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Newfoundland Labrador Liquor Corporation (NLC)',
    keyNotes: 'Private retail authorized by NLC. Growing retail network.',
    dashboardStatus: 'unavailable',
  },
  {
    iso2: 'CA-NT',
    slug: 'northwest-territories',
    name: 'Northwest Territories',
    abbreviation: 'NT',
    capital: 'Yellowknife',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'NWT Liquor & Cannabis Commission',
    keyNotes: 'Government retail. Limited private authorization. Remote supply chain challenges.',
    dashboardStatus: 'unavailable',
  },
  {
    iso2: 'CA-NS',
    slug: 'nova-scotia',
    name: 'Nova Scotia',
    abbreviation: 'NS',
    capital: 'Halifax',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Nova Scotia Liquor Corporation (NSLC)',
    keyNotes: 'Government retail monopoly. NSLC controls all distribution and retail.',
    dashboardStatus: 'unavailable',
  },
  {
    iso2: 'CA-NU',
    slug: 'nunavut',
    name: 'Nunavut',
    abbreviation: 'NU',
    capital: 'Iqaluit',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Nunavut Liquor & Cannabis Commission (NULC)',
    keyNotes: 'Government retail. Significant logistical constraints. Limited retail locations.',
    dashboardStatus: 'unavailable',
  },
  {
    iso2: 'CA-ON',
    slug: 'ontario',
    name: 'Ontario',
    abbreviation: 'ON',
    capital: 'Toronto',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Alcohol and Gaming Commission of Ontario (AGCO)',
    keyNotes: "Canada's largest cannabis market. Private retail, AGCO-licensed. OCS wholesale. Largest LP concentration.",
    dashboardStatus: 'partial',
  },
  {
    iso2: 'CA-PE',
    slug: 'prince-edward-island',
    name: 'Prince Edward Island',
    abbreviation: 'PE',
    capital: 'Charlottetown',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'PEI Cannabis Management Corporation',
    keyNotes: "Government retail. Province's smallest market by volume.",
    dashboardStatus: 'unavailable',
  },
  {
    iso2: 'CA-QC',
    slug: 'quebec',
    name: 'Québec',
    abbreviation: 'QC',
    capital: 'Quebec City',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Société québécoise du cannabis (SQDC)',
    keyNotes: "Government retail monopoly. SQDC-only retail and wholesale. Strict advertising restrictions. Second-largest market.",
    dashboardStatus: 'static-orientation',
  },
  {
    iso2: 'CA-SK',
    slug: 'saskatchewan',
    name: 'Saskatchewan',
    abbreviation: 'SK',
    capital: 'Regina',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Saskatchewan Liquor and Gaming Authority (SLGA)',
    keyNotes: 'Private retail with SLGA wholesale. Competitive private retail environment.',
    dashboardStatus: 'unavailable',
  },
  {
    iso2: 'CA-YT',
    slug: 'yukon',
    name: 'Yukon',
    abbreviation: 'YT',
    capital: 'Whitehorse',
    regulatoryModel: 'adult_use_medical',
    retailAuthority: 'Yukon Liquor Corporation',
    keyNotes: 'Government and private retail. Limited market. Remote supply chain.',
    dashboardStatus: 'unavailable',
  },
]

export const canadaProvinceBySlug = Object.fromEntries(
  canadaProvinceProfiles.map((p) => [p.slug, p])
)

export const canadaProvinceByIso2 = Object.fromEntries(
  canadaProvinceProfiles.map((p) => [p.iso2, p])
)

export const canadaProvinceSlugs = canadaProvinceProfiles.map((p) => p.slug)
