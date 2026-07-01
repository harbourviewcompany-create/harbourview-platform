export type CannabisEvent = {
  id:           string
  name:         string
  dateStart:    string          // YYYY-MM-DD
  dateEnd?:     string          // YYYY-MM-DD
  city:         string
  countryIso2:  string          // ISO-3166-1 alpha-2 or 'ONLINE'
  countryLabel: string
  region:       'Europe' | 'Americas' | 'Asia-Pacific' | 'Africa' | 'Oceania' | 'Online'
  type:         'conference' | 'expo' | 'summit' | 'workshop' | 'webinar' | 'awards'
  organizer:    string
  focus:        string[]
  roles:        string[]        // lowercase partial matches against role short labels
  url?:         string
  featured?:    boolean
  description:  string
}

export const INDUSTRY_EVENTS: CannabisEvent[] = [

  // ── July 2026 ────────────────────────────────────────────────────────────────

  {
    id: 'gacp-ams-jul26',
    name: 'GACP & GMP Cannabis Certification Workshop — Europe',
    dateStart: '2026-07-14', dateEnd: '2026-07-15',
    city: 'Amsterdam', countryIso2: 'NL', countryLabel: 'Netherlands', region: 'Europe',
    type: 'workshop', organizer: 'EU GMP Partners',
    focus: ['GACP', 'GMP', 'Quality Assurance', 'Export Certification'],
    roles: ['cultivator', 'processor', 'exporter', 'gmp', 'importer', 'compliance'],
    description: 'Hands-on workshop covering GACP and EU GMP requirements for cannabis producers seeking export certification. Includes audit simulation and site visit to a GMP-certified facility.',
  },
  {
    id: 'latam-mde-jul26',
    name: 'Latin America Cannabis Business Forum 2026',
    dateStart: '2026-07-22', dateEnd: '2026-07-23',
    city: 'Medellín', countryIso2: 'CO', countryLabel: 'Colombia', region: 'Americas',
    type: 'conference', organizer: 'Cannabis Business LATAM',
    focus: ['Export Markets', 'Colombia', 'Mexico', 'Brazil', 'Investment', 'Regulation'],
    roles: ['investor', 'exporter', 'importer', 'regulator', 'legal', 'cultivator'],
    description: 'Premier annual gathering for cannabis business in Latin America, featuring regulatory updates from Colombia, Mexico, Brazil, and Chile alongside B2B networking and investor panels.',
  },
  {
    id: 'hemp-cbd-london-jul26',
    name: 'Hemp & CBD Europe Trade Show 2026',
    dateStart: '2026-07-29', dateEnd: '2026-07-30',
    city: 'London', countryIso2: 'GB', countryLabel: 'United Kingdom', region: 'Europe',
    type: 'expo', organizer: 'Hemp Trade Association UK',
    focus: ['Hemp', 'CBD', 'Novel Foods', 'EU Market Access', 'Retail'],
    roles: ['exporter', 'importer', 'retail', 'distributor', 'legal', 'compliance'],
    description: 'Two-day trade expo covering CBD and hemp product supply chains, UK Novel Foods authorisation pathways, and EU market access for hemp-derived products.',
  },

  // ── August 2026 ──────────────────────────────────────────────────────────────

  {
    id: 'pacific-cannabis-aug26',
    name: 'Pacific Cannabis Conference 2026',
    dateStart: '2026-08-05', dateEnd: '2026-08-06',
    city: 'Auckland', countryIso2: 'NZ', countryLabel: 'New Zealand', region: 'Oceania',
    type: 'conference', organizer: 'Cannabis Aotearoa',
    focus: ['Regulatory Reform', 'Medical Cannabis', 'Pacific Markets', 'Cultivation'],
    roles: ['cultivator', 'exporter', 'regulator', 'legal', 'investor', 'compliance'],
    description: 'Annual conference for the Australasian cannabis sector covering NZ and Australian regulatory landscapes, cultivation technology, and opportunities in Pacific export markets.',
  },
  {
    id: 'cannabis-investor-summit-ny-aug26',
    name: 'Cannabis Investor Summit Q3 2026',
    dateStart: '2026-08-12',
    city: 'New York', countryIso2: 'US', countryLabel: 'United States', region: 'Americas',
    type: 'summit', organizer: 'Arcview Group',
    focus: ['Investment', 'M&A', 'Capital Markets', 'International Expansion'],
    roles: ['investor', 'exporter', 'legal', 'compliance', 'distributor'],
    description: 'Institutional-grade investor summit connecting cannabis operators with family offices, venture funds, and strategic acquirers. Focus on international M&A and emerging market entry.',
  },
  {
    id: 'africa-cannabis-ct-aug26',
    name: 'African Cannabis Convention 2026',
    dateStart: '2026-08-19', dateEnd: '2026-08-21',
    city: 'Cape Town', countryIso2: 'ZA', countryLabel: 'South Africa', region: 'Africa',
    type: 'conference', organizer: 'Africa Cannabis Conference',
    focus: ['South Africa', 'Lesotho', 'Rwanda', 'African Export Corridors', 'Social Equity'],
    roles: ['all'],
    featured: true,
    description: "The continent's flagship cannabis event, gathering stakeholders from across Africa to discuss licensing, export corridors, investment, and social equity in emerging African markets.",
  },
  {
    id: 'eu-med-cannabis-forum-aug26',
    name: 'European Medical Cannabis Pharmacy Forum 2026',
    dateStart: '2026-08-25', dateEnd: '2026-08-26',
    city: 'Vienna', countryIso2: 'AT', countryLabel: 'Austria', region: 'Europe',
    type: 'summit', organizer: 'European Pharmacy Network',
    focus: ['Medical Cannabis', 'Prescribing', 'Pharmacovigilance', 'Patient Access', 'Formulary'],
    roles: ['doctor', 'pharmacist', 'clinic', 'compliance', 'regulator', 'legal'],
    description: 'Dedicated forum for physicians and pharmacists on clinical evidence, prescribing guidelines, formulary decisions, and pharmacovigilance for medical cannabis across EU member states.',
  },

  // ── September 2026 ───────────────────────────────────────────────────────────

  {
    id: 'incb-workshop-geneva-sep26',
    name: 'International Cannabis Regulatory Standards Workshop',
    dateStart: '2026-09-08', dateEnd: '2026-09-09',
    city: 'Geneva', countryIso2: 'CH', countryLabel: 'Switzerland', region: 'Europe',
    type: 'workshop', organizer: 'WHO / INCB Partners',
    focus: ['UN Conventions', 'International Law', 'Scheduling', 'Regulatory Frameworks', 'CND'],
    roles: ['regulator', 'legal', 'compliance', 'investor', 'gmp'],
    description: 'Workshop for government officials and industry legal teams on the evolving international framework under the 1961 Single Convention, CND resolutions, and WHO cannabis rescheduling implications.',
  },
  {
    id: 'cannabiscon-eugene-sep26',
    name: 'CannabisCon 2026',
    dateStart: '2026-09-11', dateEnd: '2026-09-13',
    city: 'Eugene', countryIso2: 'US', countryLabel: 'United States', region: 'Americas',
    type: 'conference', organizer: 'CannabisCon LLC',
    focus: ['Cultivation Science', 'Processing', 'Lab Testing', 'Retail', 'US State Markets'],
    roles: ['cultivator', 'processor', 'lab', 'retail', 'distributor', 'compliance'],
    description: 'Three-day US industry conference focused on cultivation science, processing innovation, QA/QC testing, and retail operations across legal US state markets.',
  },
  {
    id: 'expo-cannabis-lisbon-sep26',
    name: 'Expo Cannabis Portugal 2026',
    dateStart: '2026-09-17', dateEnd: '2026-09-19',
    city: 'Lisbon', countryIso2: 'PT', countryLabel: 'Portugal', region: 'Europe',
    type: 'expo', organizer: 'Associação Portuguesa de Cannabis Medicinal',
    focus: ['Portugal', 'Southern Europe', 'Export', 'Medical Policy', 'EU Markets'],
    roles: ['all'],
    featured: true,
    description: "Portugal's premier cannabis expo, attracting EU and international operators to one of Europe's most progressive legal frameworks. Regulatory briefings, B2B matchmaking, and policy debates.",
  },
  {
    id: 'sea-cannabis-bangkok-sep26',
    name: 'Southeast Asia Cannabis Forum 2026',
    dateStart: '2026-09-23', dateEnd: '2026-09-24',
    city: 'Bangkok', countryIso2: 'TH', countryLabel: 'Thailand', region: 'Asia-Pacific',
    type: 'summit', organizer: 'Asia Cannabis Trade Network',
    focus: ['Thailand', 'SEA Markets', 'Export Corridors', 'Regulatory Reform', 'Investment'],
    roles: ['exporter', 'importer', 'regulator', 'investor', 'legal', 'logistics'],
    description: 'Summit addressing rapidly evolving regulatory environments across Southeast Asia — Thailand, Malaysia, Vietnam, and the Philippines are all undergoing significant cannabis law reform.',
  },

  // ── October 2026 ─────────────────────────────────────────────────────────────

  {
    id: 'cannatech-telaviv-oct26',
    name: 'CannaTech 2026',
    dateStart: '2026-10-06', dateEnd: '2026-10-07',
    city: 'Tel Aviv', countryIso2: 'IL', countryLabel: 'Israel', region: 'Asia-Pacific',
    type: 'conference', organizer: 'CannaTech Global',
    focus: ['Cultivation Technology', 'Genetics', 'Medical Research', 'Agritech', 'Export'],
    roles: ['cultivator', 'processor', 'lab', 'investor', 'gmp', 'geneticist'],
    featured: true,
    description: "Israel's flagship cannabis innovation conference, showcasing agritech, extraction technology, genetics, and clinical research. Israel remains a world leader in cannabis R&D and export volumes.",
  },
  {
    id: 'cannabis-europa-bxl-oct26',
    name: 'Cannabis Europa Autumn 2026',
    dateStart: '2026-10-13', dateEnd: '2026-10-14',
    city: 'Brussels', countryIso2: 'BE', countryLabel: 'Belgium', region: 'Europe',
    type: 'summit', organizer: 'Cannabis Europa',
    focus: ['EU Policy', 'Medical Access Harmonisation', 'Export Licensing', 'Banking', 'Compliance'],
    roles: ['regulator', 'legal', 'compliance', 'exporter', 'importer', 'investor', 'logistics'],
    featured: true,
    description: "Leading European policy and business summit hosted in Brussels where EU institutions set policy. Sessions on Schengen corridor reform, medical access harmonisation, and EU import/export licensing frameworks.",
  },
  {
    id: 'aus-cannabis-sydney-oct26',
    name: 'Australian Cannabis Conference 2026',
    dateStart: '2026-10-20', dateEnd: '2026-10-22',
    city: 'Sydney', countryIso2: 'AU', countryLabel: 'Australia', region: 'Oceania',
    type: 'conference', organizer: 'Cannaclusive',
    focus: ['TGA', 'Cultivation', 'Medical Access', 'Export Programme', 'Clinical Evidence'],
    roles: ['all'],
    description: "Australia's premier three-day cannabis industry event, covering TGA regulatory updates, licensed cultivation best practices, clinical prescribing data, and Australia's growing international export programme.",
  },
  {
    id: 'mjbiz-west-denver-oct26',
    name: 'MJBiz Conference West 2026',
    dateStart: '2026-10-27', dateEnd: '2026-10-29',
    city: 'Denver', countryIso2: 'US', countryLabel: 'United States', region: 'Americas',
    type: 'conference', organizer: 'MJBizDaily',
    focus: ['US Markets', 'Retail Operations', 'Finance', 'Cultivation', 'Processing'],
    roles: ['investor', 'retail', 'cultivator', 'distributor', 'processor', 'compliance', 'legal'],
    description: "MJBiz's western US flagship event, bringing together operators, investors, and service providers focused on Colorado, California, Oregon, and other western state markets.",
  },

  // ── November 2026 ────────────────────────────────────────────────────────────

  {
    id: 'cultiva-vienna-nov26',
    name: 'Cultiva Cannabis & Hemp Expo 2026',
    dateStart: '2026-11-05', dateEnd: '2026-11-08',
    city: 'Vienna', countryIso2: 'AT', countryLabel: 'Austria', region: 'Europe',
    type: 'expo', organizer: 'Cultiva GmbH',
    focus: ['Cultivation', 'Genetics', 'Processing', 'Lab Testing', 'Hemp', 'EU Export'],
    roles: ['cultivator', 'processor', 'geneticist', 'lab', 'exporter', 'gmp'],
    description: "Central Europe's largest cannabis and hemp trade expo. Four days of exhibitions, workshops, and B2B meetings across cultivation, processing, lab services, and export logistics.",
  },
  {
    id: 'canadian-cannabis-summit-tor-nov26',
    name: 'Canadian Cannabis Summit 2026',
    dateStart: '2026-11-10', dateEnd: '2026-11-11',
    city: 'Toronto', countryIso2: 'CA', countryLabel: 'Canada', region: 'Americas',
    type: 'summit', organizer: 'Cannabis Council of Canada',
    focus: ['Canada', 'International Export', 'EU GMP', 'Finance', 'Domestic Market'],
    roles: ['all'],
    description: "Annual industry summit covering Canada's domestic market evolution and its growing role as a global cannabis exporter. Key sessions on EU GMP compliance for Canadian licence holders.",
  },
  {
    id: 'medtech-cannabis-berlin-nov26',
    name: 'MedTech & Cannabis Innovation Summit 2026',
    dateStart: '2026-11-17', dateEnd: '2026-11-18',
    city: 'Berlin', countryIso2: 'DE', countryLabel: 'Germany', region: 'Europe',
    type: 'summit', organizer: 'European MedTech Alliance',
    focus: ['Germany CanG', 'Clinical Trials', 'Digital Health', 'Patient Access', 'R&D'],
    roles: ['investor', 'cultivator', 'processor', 'lab', 'gmp', 'doctor', 'clinic'],
    description: "Berlin summit on the intersection of medical cannabis and digital health. Sessions on Germany's CanG implementation, clinical evidence requirements, and pharmaceutical-grade production standards.",
  },
  {
    id: 'mjbizcon-las-vegas-nov26',
    name: 'MJBizCon 2026',
    dateStart: '2026-11-18', dateEnd: '2026-11-21',
    city: 'Las Vegas', countryIso2: 'US', countryLabel: 'United States', region: 'Americas',
    type: 'conference', organizer: 'MJBizDaily',
    focus: ['Global Cannabis', 'International Markets', 'Investment', 'Retail', 'Policy', 'Export'],
    roles: ['all'],
    featured: true,
    description: "The world's largest cannabis trade conference and expo. 35,000+ attendees, 1,400+ exhibitors, dedicated international zones covering Europe, LATAM, Asia-Pacific, and Africa.",
  },
  {
    id: 'expo-cannabis-argentina-nov26',
    name: 'Expo Cannabis Argentina 2026',
    dateStart: '2026-11-24', dateEnd: '2026-11-26',
    city: 'Buenos Aires', countryIso2: 'AR', countryLabel: 'Argentina', region: 'Americas',
    type: 'expo', organizer: 'Expo Cannabis Argentina',
    focus: ['Argentina', 'LATAM Export', 'Medical Cannabis', 'Regulation', 'Investment'],
    roles: ['cultivator', 'exporter', 'importer', 'regulator', 'investor', 'legal'],
    description: "Argentina's national cannabis expo, featuring regulatory updates from ANMAT and SENASA, cultivation and processing showcases, and export market access briefings for European buyers.",
  },

  // ── December 2026 ────────────────────────────────────────────────────────────

  {
    id: 'global-reg-review-webinar-dec26',
    name: 'Global Cannabis Regulation Year in Review 2026',
    dateStart: '2026-12-03',
    city: 'Online', countryIso2: 'ONLINE', countryLabel: 'Online', region: 'Online',
    type: 'webinar', organizer: 'Harbourview Intelligence',
    focus: ['Annual Review', 'Global Policy', '191 Jurisdictions', 'Market Outlook 2027'],
    roles: ['all'],
    description: "Harbourview's annual regulatory review webinar, covering the most significant legal, policy, and market developments of 2026 across all major jurisdictions. Free for all subscribers.",
  },
  {
    id: 'cannabis-awards-europe-dec26',
    name: 'Cannabis Business Awards Europe 2026',
    dateStart: '2026-12-08',
    city: 'London', countryIso2: 'GB', countryLabel: 'United Kingdom', region: 'Europe',
    type: 'awards', organizer: 'Business Green Events',
    focus: ['Industry Recognition', 'Networking', 'Innovation', 'ESG', 'European Market'],
    roles: ['all'],
    description: 'Annual ceremony recognising excellence across European cannabis — outstanding cultivators, medical innovators, compliance teams, policy advocates, and B2B service providers.',
  },
  {
    id: 'apac-regulatory-forum-sg-dec26',
    name: 'APAC Cannabis Regulatory Forum 2026',
    dateStart: '2026-12-15', dateEnd: '2026-12-16',
    city: 'Singapore', countryIso2: 'SG', countryLabel: 'Singapore', region: 'Asia-Pacific',
    type: 'summit', organizer: 'Asia Cannabis Business Council',
    focus: ['APAC Policy', 'Japan', 'South Korea', 'Australia', 'Thailand', 'Export Corridors'],
    roles: ['regulator', 'legal', 'exporter', 'importer', 'compliance', 'investor'],
    description: 'Singapore-based regulatory summit with government and industry delegates from Japan, South Korea, Australia, Thailand, and the Philippines discussing evolving frameworks and cross-border trade.',
  },

  // ── January 2027 ─────────────────────────────────────────────────────────────

  {
    id: 'new-frontier-summit-dc-jan27',
    name: 'New Frontier Data Summit 2027',
    dateStart: '2027-01-12', dateEnd: '2027-01-13',
    city: 'Washington DC', countryIso2: 'US', countryLabel: 'United States', region: 'Americas',
    type: 'summit', organizer: 'New Frontier Data',
    focus: ['Market Data', 'Policy Analysis', 'Investment', 'Global Trends', 'Research'],
    roles: ['investor', 'regulator', 'legal', 'compliance', 'exporter', 'importer'],
    description: "Data-driven summit presenting New Frontier's annual global market outlook, policy scorecard across 191 jurisdictions, and investment landscape across all major legal markets.",
  },
  {
    id: 'compliance-banking-zurich-jan27',
    name: 'Cannabis Compliance & Banking Forum 2027',
    dateStart: '2027-01-20', dateEnd: '2027-01-21',
    city: 'Zurich', countryIso2: 'CH', countryLabel: 'Switzerland', region: 'Europe',
    type: 'summit', organizer: 'Swiss Financial Council',
    focus: ['Banking Access', 'AML/KYC', 'Cross-Border Payments', 'Institutional Finance', 'Compliance'],
    roles: ['legal', 'compliance', 'investor', 'logistics', 'exporter', 'importer'],
    featured: true,
    description: 'Focused forum for compliance officers, legal counsel, and financial professionals on cannabis banking solutions, AML obligations, cross-border payment rails, and institutional finance trends.',
  },

  // ── February 2027 ────────────────────────────────────────────────────────────

  {
    id: 'benzinga-miami-feb27',
    name: 'Benzinga Cannabis Capital Conference 2027',
    dateStart: '2027-02-17', dateEnd: '2027-02-18',
    city: 'Miami', countryIso2: 'US', countryLabel: 'United States', region: 'Americas',
    type: 'conference', organizer: 'Benzinga',
    focus: ['Capital Markets', 'Equity Investment', 'M&A', 'Public Companies', 'International'],
    roles: ['investor', 'exporter', 'legal', 'compliance'],
    description: 'Capital markets conference bridging cannabis operators with equity investors, family offices, and institutional capital. Sessions on federal banking reform and international expansion.',
  },
  {
    id: 'med-cannabis-malta-feb27',
    name: 'Mediterranean Cannabis Forum 2027',
    dateStart: '2027-02-24', dateEnd: '2027-02-25',
    city: 'Valletta', countryIso2: 'MT', countryLabel: 'Malta', region: 'Europe',
    type: 'summit', organizer: 'Malta Cannabis Authority',
    focus: ['Malta', 'Mediterranean Corridors', 'EU Harmonisation', 'Export Policy', 'Medical Access'],
    roles: ['importer', 'exporter', 'regulator', 'legal', 'investor', 'compliance'],
    description: "Malta-hosted forum drawing on the island's progressive framework to discuss Mediterranean export corridors, EU licensing harmonisation, and the region's growing medical cannabis market.",
  },

  // ── March 2027 ───────────────────────────────────────────────────────────────

  {
    id: 'spannabis-barcelona-mar27',
    name: 'Spannabis 2027',
    dateStart: '2027-03-12', dateEnd: '2027-03-14',
    city: 'Barcelona', countryIso2: 'ES', countryLabel: 'Spain', region: 'Europe',
    type: 'expo', organizer: 'Spannabis SL',
    focus: ['Genetics', 'Products', 'Cultivation', 'Medical', 'EU Export', 'B2B Matchmaking'],
    roles: ['all'],
    featured: true,
    description: "Europe's largest cannabis expo — 50,000+ visitors, 500+ exhibitors from 60 countries. Professional business days include dedicated B2B matchmaking, export market briefings, and EU regulatory panels.",
  },
  {
    id: 'mary-jane-berlin-mar27',
    name: 'Mary Jane Berlin 2027',
    dateStart: '2027-03-20', dateEnd: '2027-03-22',
    city: 'Berlin', countryIso2: 'DE', countryLabel: 'Germany', region: 'Europe',
    type: 'expo', organizer: 'Mary Jane GmbH',
    focus: ['Germany', 'EU Markets', 'Genetics', 'Cultivation', 'Retail Products'],
    roles: ['cultivator', 'geneticist', 'processor', 'retail', 'exporter', 'distributor'],
    description: "Germany's premier cannabis expo, growing rapidly since the CanG reform. Three days of exhibitions, cultivation competitions, B2B networking, and policy discussions at Berlin Messe.",
  },
  {
    id: 'gacp-workshop-apac-mar27',
    name: 'GACP Workshop APAC 2027',
    dateStart: '2027-03-25', dateEnd: '2027-03-26',
    city: 'Singapore', countryIso2: 'SG', countryLabel: 'Singapore', region: 'Asia-Pacific',
    type: 'workshop', organizer: 'APAC GMP Partners',
    focus: ['GACP', 'EU GMP', 'Export Certification', 'APAC Producers', 'Quality'],
    roles: ['cultivator', 'gmp', 'exporter', 'importer', 'compliance', 'lab'],
    description: 'Intensive GACP and EU-GMP certification workshop for APAC producers targeting European export markets. Covers EU guidelines, WHO GACP standards, and pre-inspection readiness planning.',
  },
  {
    id: 'world-cannabis-amsterdam-mar27',
    name: 'World Cannabis Conference 2027',
    dateStart: '2027-03-30', dateEnd: '2027-04-01',
    city: 'Amsterdam', countryIso2: 'NL', countryLabel: 'Netherlands', region: 'Europe',
    type: 'conference', organizer: 'Global Cannabis Network',
    focus: ['Global Policy', 'International Trade', 'Research', 'Technology', 'Social Policy'],
    roles: ['all'],
    featured: true,
    description: 'International congress uniting government delegates, industry leaders, researchers, and civil society in Amsterdam for three days of high-level dialogue on global cannabis policy and trade.',
  },
]

export const EVENT_TYPE_LABELS: Record<CannabisEvent['type'], string> = {
  conference: 'Conference',
  expo:       'Expo',
  summit:     'Summit',
  workshop:   'Workshop',
  webinar:    'Webinar',
  awards:     'Awards',
}

export const EVENT_TYPE_COLORS: Record<CannabisEvent['type'], string> = {
  conference: '#5b9bd5',
  expo:       '#4caf82',
  summit:     '#d4a84b',
  workshop:   '#9b6dd4',
  webinar:    '#6dd4b8',
  awards:     '#e07b5b',
}
