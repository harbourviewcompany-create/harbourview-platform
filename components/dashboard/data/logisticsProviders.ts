export type LogisticsType = 'freight-forwarder' | 'customs-broker' | 'cold-chain' | '3pl' | 'courier' | 'armoured'
export type LogisticsSpecialty = 'controlled-substance' | 'gdp-compliant' | 'eu-import' | 'pharma-grade' | 'air-freight' | 'sea-freight' | 'road-freight'

export type LogisticsProvider = {
  id:          string
  name:        string
  type:        LogisticsType
  specialties: LogisticsSpecialty[]
  countries:   string[]
  regions:     string[]
  description: string
  contacts?:   string
  url?:        string
  featured?:   boolean
}

export const LOGISTICS_TYPE_LABELS: Record<LogisticsType, string> = {
  'freight-forwarder': 'Freight Forwarder',
  'customs-broker':    'Customs Broker',
  'cold-chain':        'Cold Chain / GDP',
  '3pl':               '3PL / Warehousing',
  'courier':           'Specialist Courier',
  'armoured':          'Armoured Transport',
}

export const LOGISTICS_TYPE_COLORS: Record<LogisticsType, string> = {
  'freight-forwarder': '#6366f1',
  'customs-broker':    '#d4a84b',
  'cold-chain':        '#06b6d4',
  '3pl':               '#10b981',
  'courier':           '#8b5cf6',
  'armoured':          '#ef4444',
}

export const LOGISTICS_PROVIDERS: LogisticsProvider[] = [
  {
    id: 'kuehne-nagel-pharma',
    name: 'Kuehne+Nagel Pharma Logistics',
    type: 'freight-forwarder',
    specialties: ['controlled-substance', 'gdp-compliant', 'pharma-grade', 'air-freight', 'sea-freight'],
    countries: ['DE', 'NL', 'GB', 'CH', 'CA', 'IL', 'AU', 'US'],
    regions: ['Europe', 'Americas', 'Asia-Pacific'],
    description: 'Global freight forwarder with a dedicated pharmaceutical and controlled-substance division. Handles UN3373/P650 packaging, narcotic permits, and dual-use export documentation for cannabis exports to regulated markets. One of the few tier-1 forwarders with documented cannabis corridor experience.',
    url: 'https://www.kuehne-nagel.com',
    featured: true,
  },
  {
    id: 'dhl-life-sciences',
    name: 'DHL Life Sciences & Healthcare',
    type: 'freight-forwarder',
    specialties: ['controlled-substance', 'gdp-compliant', 'pharma-grade', 'air-freight'],
    countries: ['DE', 'NL', 'GB', 'AU', 'CA', 'US', 'IL', 'TH', 'ZA'],
    regions: ['Europe', 'Americas', 'Asia-Pacific', 'Africa'],
    description: 'DHL\'s dedicated life sciences division provides GDP-compliant air and road freight for narcotic and psychotropic substances. Operates specialist handling centres in Frankfurt, Amsterdam, and Singapore. Documented experience with medical cannabis export corridors.',
    url: 'https://www.dhl.com/life-sciences',
    featured: true,
  },
  {
    id: 'world-courier',
    name: 'World Courier (AmerisourceBergen)',
    type: 'cold-chain',
    specialties: ['controlled-substance', 'gdp-compliant', 'pharma-grade', 'air-freight'],
    countries: ['DE', 'NL', 'GB', 'CH', 'AU', 'CA', 'US', 'IL', 'PT', 'ZA'],
    regions: ['Europe', 'Americas', 'Asia-Pacific', 'Africa'],
    description: 'Specialist cold-chain logistics for high-value, time-sensitive pharmaceutical shipments. Offers temperature-monitored active and passive packaging for cannabis products requiring 2–8°C or ambient-controlled transport. Extensive controlled substance permit network.',
    url: 'https://www.worldcourier.com',
    featured: true,
  },
  {
    id: 'cryoport',
    name: 'Cryoport Systems',
    type: 'cold-chain',
    specialties: ['gdp-compliant', 'pharma-grade', 'air-freight'],
    countries: ['US', 'CA', 'DE', 'NL', 'GB', 'AU', 'IL'],
    regions: ['Europe', 'Americas', 'Asia-Pacific'],
    description: 'Temperature-controlled logistics specialist using cryogenic and dry-ice systems. Increasingly used for premium craft cannabis flower exports requiring strict humidity and temperature control during long-haul air freight.',
    url: 'https://cryoport.com',
  },
  {
    id: 'scanwell-logistics',
    name: 'Scanwell Logistics',
    type: 'freight-forwarder',
    specialties: ['controlled-substance', 'air-freight', 'sea-freight', 'eu-import'],
    countries: ['DE', 'NL', 'PT', 'GB', 'IL', 'CA', 'AU', 'ZA', 'TH'],
    regions: ['Europe', 'Americas', 'Asia-Pacific', 'Africa'],
    description: 'Mid-market freight forwarder with proven cannabis export-import track record on Israel→EU, Canada→EU, and Australia→EU corridors. Specialises in managing the documentary burden of multi-jurisdiction controlled substance shipments.',
    url: 'https://www.scanwelllogistics.com',
  },
  {
    id: 'rhenus-pharma',
    name: 'Rhenus Pharma & Healthcare',
    type: '3pl',
    specialties: ['controlled-substance', 'gdp-compliant', 'pharma-grade', 'road-freight'],
    countries: ['DE', 'NL', 'BE', 'CH', 'PL', 'PT'],
    regions: ['Europe'],
    description: 'European 3PL operator with GDP-licensed warehousing for narcotic/Schedule I substances in Germany, Netherlands, and Belgium. Offers bonded and controlled-substance vault storage, pick-and-pack, and last-mile GDP distribution for medical cannabis wholesalers.',
    featured: true,
  },
  {
    id: 'pharma-logistics-nl',
    name: 'Pharma Logistics (Netherlands)',
    type: '3pl',
    specialties: ['controlled-substance', 'gdp-compliant', 'eu-import', 'road-freight'],
    countries: ['NL', 'DE', 'BE', 'PT'],
    regions: ['Europe'],
    description: 'Dutch-based GDP-certified 3PL with BIG-registered narcotics storage licence. Acts as EU import/distribution hub for multiple international cannabis suppliers. Strong BMC and Farmatec regulatory relationships.',
  },
  {
    id: 'broker-de-bzba',
    name: 'BZBA GmbH (Customs, DE)',
    type: 'customs-broker',
    specialties: ['controlled-substance', 'eu-import'],
    countries: ['DE'],
    regions: ['Europe'],
    description: 'German customs brokerage specialising in Betäubungsmittel (narcotic) import and export declarations under the BtMG. Experienced in BfArM import permit documentation, commodity code 2901–2903, and dual-use export control (EAR99 / EC 428/2009).',
  },
  {
    id: 'deringer-customs',
    name: 'Fritz Companies / Deringer Customs Brokers',
    type: 'customs-broker',
    specialties: ['controlled-substance', 'eu-import', 'pharma-grade'],
    countries: ['US', 'CA', 'DE', 'NL', 'GB'],
    regions: ['Europe', 'Americas'],
    description: 'North American customs brokerage with transatlantic controlled substance import/export experience. Handles DEA Schedule I import for research and USDA/FDA documentation for cannabis-derived products destined for the US.',
  },
  {
    id: 'brink-australia',
    name: "Brink's Australia",
    type: 'armoured',
    specialties: ['controlled-substance'],
    countries: ['AU'],
    regions: ['Asia-Pacific'],
    description: "Brink's licensed armoured transport for high-value and Schedule 8 cargo within Australia. Used by domestic cannabis cultivators and manufacturers for inter-state transport of finished medical cannabis products under TGA/ODC oversight.",
    url: 'https://www.brinks.com.au',
  },
  {
    id: 'garda-canada',
    name: 'GardaWorld Cannabis Logistics',
    type: 'armoured',
    specialties: ['controlled-substance'],
    countries: ['CA'],
    regions: ['Americas'],
    description: 'Dedicated cannabis cash and product transport service for Health Canada-licensed producers. Licensed for inter-provincial cannabis shipment under the Cannabis Act. One of Canada\'s largest cannabis armoured transport operators.',
    url: 'https://www.garda.com',
    featured: true,
  },
  {
    id: 'international-cannabis-logistics',
    name: 'International Cannabis Logistics (ICL)',
    type: 'freight-forwarder',
    specialties: ['controlled-substance', 'gdp-compliant', 'air-freight', 'eu-import'],
    countries: ['IL', 'DE', 'NL', 'PT', 'GB', 'CH', 'AU'],
    regions: ['Europe', 'Asia-Pacific'],
    description: 'Boutique forwarder founded specifically for cannabis export corridors from Israel and Portugal to European medical markets. Deep expertise in IMCA, INFARMED, BfArM, and MHRA import/export documentation flows. Often cited as the go-to for first-time exporters.',
    featured: true,
  },
  {
    id: 'csa-transport-za',
    name: 'CSA Transport (South Africa)',
    type: 'freight-forwarder',
    specialties: ['controlled-substance', 'air-freight', 'eu-import'],
    countries: ['ZA', 'DE', 'NL', 'GB'],
    regions: ['Africa', 'Europe'],
    description: 'South African freight forwarder with SAHPRA export clearance experience. Handles Johannesburg O.R. Tambo airport controlled substance export coordination and liaison with EU import brokers. Growing presence on the ZA→EU cannabis corridor.',
  },
  {
    id: 'speedcargo-th',
    name: 'SpeedCargo Thailand',
    type: 'freight-forwarder',
    specialties: ['controlled-substance', 'air-freight'],
    countries: ['TH', 'DE', 'NL', 'GB', 'AU'],
    regions: ['Asia-Pacific', 'Europe'],
    description: 'Bangkok-based forwarder with Thai FDA export documentation expertise for hemp and cannabis derivatives. Manages Suvarnabhumi airport controlled substance cargo coordination and Thai Customs Form T2 procedures.',
  },
  {
    id: 'gsp-colombia',
    name: 'GSP Logística (Colombia)',
    type: 'freight-forwarder',
    specialties: ['controlled-substance', 'air-freight', 'eu-import'],
    countries: ['CO', 'DE', 'NL', 'GB', 'PT'],
    regions: ['Americas', 'Europe'],
    description: 'Bogotá-based specialist in Colombian cannabis derivative export logistics. Experienced with ICA export permits, DIAN (customs) procedures, and El Dorado airport narcotics cargo protocols. Established EU import partnerships.',
  },
]
