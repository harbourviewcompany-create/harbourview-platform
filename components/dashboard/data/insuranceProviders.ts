export type InsuranceLineType =
  | 'commercial-general'
  | 'product-liability'
  | 'directors-officers'
  | 'property'
  | 'crop'
  | 'professional-indemnity'
  | 'cyber'
  | 'cargo'
  | 'workers-comp'
  | 'employers-liability'

export type InsuranceProviderRole = 'mga' | 'carrier' | 'broker' | 'lloyd' | 'program-admin'

export type InsuranceProvider = {
  id:          string
  name:        string
  role:        InsuranceProviderRole
  types:       InsuranceLineType[]
  countries:   string[]
  regions:     string[]
  description: string
  url?:        string
  featured?:   boolean
}

export const INSURANCE_LINE_LABELS: Record<InsuranceLineType, string> = {
  'commercial-general':    'Commercial General Liability',
  'product-liability':     'Product Liability',
  'directors-officers':    'Directors & Officers',
  'property':              'Property',
  'crop':                  'Crop / Cultivation',
  'professional-indemnity':'Professional Indemnity / E&O',
  'cyber':                 'Cyber Liability',
  'cargo':                 'Cargo & Transit',
  'workers-comp':          'Workers Compensation',
  'employers-liability':   'Employers Liability',
}

export const INSURANCE_ROLE_LABELS: Record<InsuranceProviderRole, string> = {
  'mga':          'Managing General Agent',
  'carrier':      'Insurance Carrier',
  'broker':       'Broker / Wholesale',
  'lloyd':        "Lloyd's Syndicate",
  'program-admin':'Program Administrator',
}

export const INSURANCE_ROLE_COLORS: Record<InsuranceProviderRole, string> = {
  'mga':          '#6366f1',
  'carrier':      '#10b981',
  'broker':       '#d4a84b',
  'lloyd':        '#8b5cf6',
  'program-admin':'#06b6d4',
}

export const INSURANCE_PROVIDERS: InsuranceProvider[] = [
  // ── United States ──────────────────────────────────────────────────────────
  {
    id: 'cannasure',
    name: 'Cannasure Insurance Services',
    role: 'mga',
    types: ['commercial-general', 'product-liability', 'property', 'workers-comp', 'crop'],
    countries: ['US'],
    regions: ['Americas'],
    description: 'Leading US-based MGA dedicated exclusively to the cannabis sector since 2010. Covers cultivators, processors, dispensaries, and delivery services. Policies available in all adult-use and medical cannabis-legal states. Product liability wording covers mislabelling, contamination, and THC tolerance claims. One of the few MGAs with admitted paper in California.',
    url: 'https://www.cannasure.com',
    featured: true,
  },
  {
    id: 'canngen',
    name: 'CannGen Insurance Services',
    role: 'mga',
    types: ['commercial-general', 'product-liability', 'property', 'directors-officers', 'workers-comp', 'crop', 'cyber'],
    countries: ['US', 'CA'],
    regions: ['Americas'],
    description: 'One of the largest cannabis-focused MGAs in North America with A-rated admitted carrier capacity. Proprietary underwriting platform for cultivators, extractors, distributors, and multi-state operators. Strong D&O and management liability wording for public cannabis companies listed on Canadian exchanges. Coverage scales from startup dispensary to large LP.',
    url: 'https://www.canngen.com',
    featured: true,
  },
  {
    id: 'ryan-specialty-cannabis',
    name: 'Ryan Specialty Cannabis Practice',
    role: 'broker',
    types: ['commercial-general', 'product-liability', 'property', 'directors-officers', 'professional-indemnity', 'cyber', 'cargo'],
    countries: ['US', 'CA'],
    regions: ['Americas'],
    description: 'Wholesale brokerage arm of Ryan Specialty with a dedicated cannabis practice providing access to E&S markets, admitted lines, and Lloyd\'s capacity. Serves multi-state operators, publicly-traded LPs, and vertically integrated businesses. Structured placement capability for complex risks spanning cultivation, extraction, distribution, and retail.',
    url: 'https://www.ryanspecialty.com',
    featured: true,
  },
  {
    id: 'hub-international-cannabis',
    name: 'HUB International Cannabis Practice',
    role: 'broker',
    types: ['commercial-general', 'product-liability', 'property', 'directors-officers', 'crop', 'workers-comp', 'cyber', 'cargo'],
    countries: ['US', 'CA'],
    regions: ['Americas'],
    description: 'North America\'s largest cannabis insurance brokerage practice by premium volume. Dedicated cannabis team places coverage for Health Canada LPs, US multi-state operators, and vertically-integrated companies. Structured programmes for multi-site operators, with cross-border US-Canada expertise and access to proprietary carrier panels.',
    url: 'https://www.hubinternational.com',
    featured: true,
  },
  {
    id: 'burns-wilcox-cannabis',
    name: 'Burns & Wilcox (Cannabis)',
    role: 'broker',
    types: ['commercial-general', 'product-liability', 'property', 'crop', 'cargo', 'cyber'],
    countries: ['US', 'CA'],
    regions: ['Americas'],
    description: 'Wholesale brokerage with one of the largest cannabis specialty books in North America. Direct access to Markel, Great American, and Lloyd\'s syndicates. Strong expertise in cultivation and greenhouse crop insurance, product recall coverage, and cannabis cargo for licensed inter-state transfers. Known for fast turnaround on surplus lines binds.',
    url: 'https://www.burnsandwilcox.com',
  },
  {
    id: 'victor-cannabis',
    name: 'Victor Insurance (Cannabis)',
    role: 'program-admin',
    types: ['professional-indemnity', 'directors-officers', 'commercial-general', 'cyber'],
    countries: ['US', 'CA', 'GB'],
    regions: ['Americas', 'Europe'],
    description: 'Program administrator (formerly Victor O. Schinnerer) specialising in professional indemnity and management liability for cannabis consulting firms, testing laboratories, pharmacists, and registered practitioners in the US, Canada, and UK. D&O wording covers fiduciary liability, securities claims, and regulatory investigation costs specific to cannabis operators.',
    url: 'https://www.victorinsurance.com',
  },
  {
    id: 'next-insurance-cannabis',
    name: 'Next Insurance (Cannabis)',
    role: 'carrier',
    types: ['commercial-general', 'property', 'workers-comp', 'employers-liability'],
    countries: ['US'],
    regions: ['Americas'],
    description: 'Digital-first admitted insurer offering streamlined cannabis business insurance with instant bind capability. Competitive on GL and property for small-to-mid-sized dispensaries, cannabis delivery services, and ancillary businesses. Not suited for cultivation or extraction at commercial scale.',
    url: 'https://www.nextinsurance.com',
  },
  // ── Canada ─────────────────────────────────────────────────────────────────
  {
    id: 'intact-cannabis',
    name: 'Intact Financial (Cannabis)',
    role: 'carrier',
    types: ['property', 'commercial-general', 'product-liability', 'crop', 'cargo'],
    countries: ['CA'],
    regions: ['Americas'],
    description: 'Canada\'s largest P&C insurer with a dedicated cannabis commercial lines offering. Covers Health Canada-licensed producers, processors, and distribution centres. Property coverage includes vault storage, indoor facilities, and extraction labs. Crop coverage for outdoor cannabis is a key differentiator. Mandated by several provinces for cannabis retail.',
    url: 'https://www.intactinsurance.com',
  },
  {
    id: 'kingsway-cannabis',
    name: 'Kingsway Financial Services',
    role: 'program-admin',
    types: ['commercial-general', 'property', 'product-liability', 'workers-comp'],
    countries: ['CA', 'US'],
    regions: ['Americas'],
    description: 'Canadian specialty insurer operating cannabis commercial insurance programmes through a network of wholesale brokers. Focus on cultivation facilities, licensed processors, and cannabis retail stores in Ontario, Alberta, and British Columbia. Co-insurance structures available for large LP sites.',
    url: 'https://www.kingsway-financial.com',
  },
  // ── United Kingdom & Lloyd's ───────────────────────────────────────────────
  {
    id: 'dual-commercial-cannabis',
    name: 'DUAL Commercial (Cannabis UK)',
    role: 'mga',
    types: ['commercial-general', 'product-liability', 'professional-indemnity', 'directors-officers', 'cyber'],
    countries: ['GB'],
    regions: ['Europe'],
    description: 'UK-based MGA with a formal cannabis liability insurance programme. Covers MHRA-licensed cannabis operators, Schedule 2 importers, cannabis clinics, and prescribing physicians. Professional indemnity wording specifically tailored for UK cannabis-based medicinal product (CBMP) prescribers and importers — one of very few MGAs offering this in the UK market.',
    url: 'https://www.dualgroup.com',
    featured: true,
  },
  {
    id: 'tokio-marine-kiln',
    name: 'Tokio Marine Kiln (Lloyd\'s)',
    role: 'lloyd',
    types: ['cargo', 'property', 'product-liability', 'commercial-general'],
    countries: ['GB', 'DE', 'NL', 'AU', 'IL'],
    regions: ['Europe', 'Asia-Pacific', 'Americas'],
    description: "Lloyd's of London syndicate with documented capacity for medical cannabis cargo and facility risks across multiple international corridors. TMK's specialist commodity cargo team underwrites cross-border shipments between Israel, Portugal, the Netherlands, Germany, and the UK. GDP-compliant all-risks cargo wording with narcotics endorsements available.",
    url: 'https://www.tmk.com',
    featured: true,
  },
  {
    id: 'markel-cannabis',
    name: 'Markel Insurance (Cannabis)',
    role: 'carrier',
    types: ['commercial-general', 'product-liability', 'property', 'professional-indemnity', 'directors-officers', 'crop'],
    countries: ['US', 'GB', 'CA'],
    regions: ['Americas', 'Europe'],
    description: 'Specialty insurer with a long-standing cannabis programme in the US and an emerging UK book. Markel\'s cannabis wording covers THC product liability, crop failure, property, and employment practices. Listed as an approved carrier on multiple US state cannabis insurance mandates and increasingly active in UK Schedule 2 product liability placements.',
    url: 'https://www.markel.com',
    featured: true,
  },
  {
    id: 'rsa-cannabis',
    name: 'RSA Insurance / Intact UK',
    role: 'carrier',
    types: ['product-liability', 'commercial-general', 'professional-indemnity', 'cargo'],
    countries: ['GB'],
    regions: ['Europe'],
    description: 'RSA (now Intact Financial) offers commercial and product liability coverage for UK-licensed medical cannabis importers, wholesalers, and dispensing pharmacies. Coverage includes Schedule 2 controlled drug liability and pharmacist professional indemnity with CBMP-specific endorsements.',
    url: 'https://www.rsagroup.com',
  },
  // ── Continental Europe ─────────────────────────────────────────────────────
  {
    id: 'helvetia-cannabis',
    name: 'Helvetia Insurance (Switzerland)',
    role: 'carrier',
    types: ['commercial-general', 'product-liability', 'property', 'crop'],
    countries: ['CH'],
    regions: ['Europe'],
    description: 'Swiss national insurer providing commercial insurance for operators in the federal cannabis pilot programme (BAG/FOPH-approved trials). Covers pilot cultivation sites, dispensing pharmacies, and research institutions. Crop coverage for greenhouse and indoor Swiss pilot grows available with specialist agronomist valuation.',
    url: 'https://www.helvetia.com',
  },
  {
    id: 'allianz-commercial-cannabis',
    name: 'Allianz Commercial (Cannabis GMP)',
    role: 'carrier',
    types: ['property', 'commercial-general', 'professional-indemnity', 'cargo'],
    countries: ['DE', 'NL', 'PT', 'AU'],
    regions: ['Europe', 'Asia-Pacific'],
    description: 'Allianz Commercial (formerly AGCS) selectively underwrites EU-GMP certified cannabis manufacturing facilities and pharmaceutical-grade cannabis logistics. GMP facility property coverage and product recall available for BfArM-licensed German importers and Farmatec-registered Dutch operators. Cargo underwriting on DE→EU GDP distribution corridors.',
    url: 'https://www.agcs.allianz.com',
  },
  // ── Australia ──────────────────────────────────────────────────────────────
  {
    id: 'qbe-cannabis',
    name: 'QBE Insurance (Cannabis)',
    role: 'carrier',
    types: ['crop', 'property', 'commercial-general', 'product-liability', 'cargo'],
    countries: ['AU', 'GB', 'DE', 'NL'],
    regions: ['Asia-Pacific', 'Europe'],
    description: 'QBE provides crop and property insurance for TGA/ODC-licensed Australian cannabis cultivators and exporters. Experienced in cannabis export cargo insurance between Australia and the EU under GDP-compliant conditions. EU operations focus on facility and product liability for GMP manufacturers in Germany and Netherlands.',
    url: 'https://www.qbe.com',
  },
  {
    id: 'cgc-australia',
    name: 'Cannabis Growers Cover (AU)',
    role: 'program-admin',
    types: ['crop', 'property', 'commercial-general', 'cargo'],
    countries: ['AU'],
    regions: ['Asia-Pacific'],
    description: 'Australian-domiciled programme administrator offering specialist crop and property coverage for ODC-licensed cannabis cultivators. Covers yield loss from weather, pest and disease, power failure, and security breaches. Export cargo available on AU→EU corridor via Lloyd\'s capacity. Widely used by new entrants to the Australian medicinal cannabis sector.',
  },
  // ── Israel ─────────────────────────────────────────────────────────────────
  {
    id: 'harel-cannabis',
    name: 'Harel Insurance (Israel)',
    role: 'carrier',
    types: ['property', 'commercial-general', 'product-liability', 'cargo', 'crop'],
    countries: ['IL'],
    regions: ['Europe'],
    description: 'One of Israel\'s largest insurers providing commercial coverage for IMCA-licensed cannabis cultivators and exporters. Property and crop coverage for indoor cultivation sites. Product liability for EU export shipments. Cargo coverage on the Israel→EU air freight corridor with narcotics endorsements. Growing book alongside Israel\'s maturing medical cannabis export sector.',
    url: 'https://www.harel-group.co.il',
  },
]
