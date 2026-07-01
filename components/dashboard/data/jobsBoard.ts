export type JobType   = 'full-time' | 'part-time' | 'contract' | 'consulting' | 'advisory'
export type JobSector = 'cultivation' | 'manufacturing' | 'regulatory' | 'medical' | 'legal' | 'finance' | 'logistics' | 'research' | 'technology' | 'sales' | 'executive'

export type JobListing = {
  id:          string
  title:       string
  company:     string
  country:     string
  city:        string
  type:        JobType
  sector:      JobSector
  roles:       string[]   // matches role short labels
  salary?:     string
  description: string
  requirements: string[]
  posted:      string
  closes?:     string
  featured?:   boolean
  remote?:     boolean
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  'full-time':  'Full-Time',
  'part-time':  'Part-Time',
  'contract':   'Contract',
  'consulting': 'Consulting',
  'advisory':   'Advisory Board',
}
export const JOB_TYPE_COLORS: Record<JobType, string> = {
  'full-time':  '#10b981',
  'part-time':  '#6366f1',
  'contract':   '#d4a84b',
  'consulting': '#8b5cf6',
  'advisory':   '#f97316',
}
export const JOB_SECTOR_LABELS: Record<JobSector, string> = {
  cultivation:   'Cultivation & Genetics',
  manufacturing: 'Manufacturing & QA',
  regulatory:    'Regulatory Affairs',
  medical:       'Medical & Clinical',
  legal:         'Legal & Compliance',
  finance:       'Finance & Investment',
  logistics:     'Logistics & Supply Chain',
  research:      'Research & Science',
  technology:    'Technology & Data',
  sales:         'Sales & BD',
  executive:     'Executive Leadership',
}

export const JOB_LISTINGS: JobListing[] = [
  // ── Germany ────────────────────────────────────────────────────────────────
  {
    id: 'j-de-reg-affairs',
    title: 'Regulatory Affairs Manager — Cannabis (CanG)',
    company: 'Cannabinoid Therapeutics GmbH',
    country: 'DE', city: 'Berlin',
    type: 'full-time', sector: 'regulatory',
    roles: ['regulator', 'importer'],
    salary: '€65,000–€85,000',
    description: 'Lead all BfArM interactions, import/export licence applications, and CanG social club compliance documentation. You will be the internal expert on German narcotics law (BtMG/CanG) and EU-GMP dossiers.',
    requirements: ['5+ years pharmaceutical regulatory affairs', 'BtMG/CanG knowledge', 'German C1+', 'EU-GMP dossier experience'],
    posted: '2026-06-20', closes: '2026-07-31', featured: true,
  },
  {
    id: 'j-de-compliance',
    title: 'Cannabis Compliance Officer — Anbauvereinigung',
    company: 'Berliner Anbauverein e.V.',
    country: 'DE', city: 'Berlin',
    type: 'full-time', sector: 'legal',
    roles: ['regulator'],
    salary: '€45,000–€58,000',
    description: 'Ensure full CanG compliance for a 250-member Berlin social club. Manage track-and-trace, member verification, THC limit controls, and reporting obligations to local authorities.',
    requirements: ['Knowledge of CanG and BtMG', 'German native-level', 'Experience in regulated industries'],
    posted: '2026-06-18',
  },
  {
    id: 'j-de-qa-gmp',
    title: 'QA Manager / Qualified Person — EU-GMP Cannabis',
    company: 'PhytoMedical AG',
    country: 'DE', city: 'Munich',
    type: 'full-time', sector: 'manufacturing',
    roles: ['manufacturer'],
    salary: '€80,000–€105,000',
    description: 'Act as QP for batch release of medical cannabis products under EU-GMP. Oversee QMS, supplier qualification, deviation management, and regulatory agency inspections.',
    requirements: ['EU-GMP Annex 1 experience', 'QP designation (desirable)', 'Cannabis or pharma manufacturing background'],
    posted: '2026-06-15', featured: true,
  },
  // ── Portugal ───────────────────────────────────────────────────────────────
  {
    id: 'j-pt-cultivation',
    title: 'Head of Cultivation — Outdoor Cannabis',
    company: 'Lusocanna, S.A.',
    country: 'PT', city: 'Alentejo',
    type: 'full-time', sector: 'cultivation',
    roles: ['cultivator', 'exporter'],
    salary: '€50,000–€70,000',
    description: 'Lead a 120-hectare outdoor and greenhouse cultivation programme in the Alentejo region. Manage growing protocols, IPM programme, harvest scheduling, and post-harvest handling for EU medical export.',
    requirements: ['5+ years large-scale cannabis or horticultural cultivation', 'GACP knowledge', 'Portuguese or English working level'],
    posted: '2026-06-22', featured: true,
  },
  {
    id: 'j-pt-export-coordinator',
    title: 'Export Coordinator — Medical Cannabis',
    company: 'AgroMedical Portugal Lda.',
    country: 'PT', city: 'Lisbon',
    type: 'full-time', sector: 'logistics',
    roles: ['exporter', 'importer'],
    salary: '€30,000–€42,000',
    description: 'Manage INFARMED export permit applications, freight forwarder coordination, and documentation packages for shipments to Germany, Czech Republic, and the UK.',
    requirements: ['Experience with controlled substance export documentation', 'English fluent', 'Portuguese desirable'],
    posted: '2026-06-14',
  },
  // ── Israel ─────────────────────────────────────────────────────────────────
  {
    id: 'j-il-bd-eu',
    title: 'Business Development Manager — European Markets',
    company: 'Teva Cannabis Export Ltd.',
    country: 'IL', city: 'Tel Aviv',
    type: 'full-time', sector: 'sales',
    roles: ['exporter', 'wholesaler'],
    salary: 'USD $70,000–$95,000',
    description: 'Build and manage distributor relationships across Germany, Czech Republic, Denmark, and the UK for IMCA-licensed Israeli cannabis exports. Represent the company at European trade events.',
    requirements: ['3+ years B2B cannabis or pharma sales', 'European market experience', 'English fluent; German or Czech a bonus'],
    posted: '2026-06-25', featured: true,
  },
  {
    id: 'j-il-genetics',
    title: 'Cannabis Geneticist / Breeding Programme Lead',
    company: 'Kibbutz Cannabis Research',
    country: 'IL', city: 'Negev',
    type: 'full-time', sector: 'research',
    roles: ['researcher', 'cultivator'],
    salary: 'ILS ₪240,000–₪320,000 p.a.',
    description: 'Lead a cannabis plant breeding programme focused on developing novel chemovars for the European medical market. Manage phenotype selection, genetic stability testing, and IP documentation.',
    requirements: ['PhD or MSc in Plant Genetics or Horticulture', 'Cannabis or specialty crop breeding experience', 'Hebrew or English working level'],
    posted: '2026-06-10',
  },
  // ── United Kingdom ─────────────────────────────────────────────────────────
  {
    id: 'j-gb-medical-advisor',
    title: 'Medical Cannabis Clinical Advisor (GP / Specialist)',
    company: 'Sapphire Medical Clinics',
    country: 'GB', city: 'London',
    type: 'part-time', sector: 'medical',
    roles: ['doctor', 'prescriber'],
    salary: '£800–£1,200 per session',
    description: 'Provide specialist cannabis prescribing consultations for patients with chronic pain, MS, epilepsy, and anxiety. GMC-registered; must hold appropriate specialist qualifications.',
    requirements: ['GMC registration', 'Specialist medical qualification', 'Willingness to prescribe Schedule 2 medications', 'CBPM prescribing training (can be supported)'],
    posted: '2026-06-28', remote: true, featured: true,
  },
  {
    id: 'j-gb-legal-cannabis',
    title: 'Associate Solicitor — Cannabis Regulatory Law',
    company: 'Mackrell.Solicitors',
    country: 'GB', city: 'London',
    type: 'full-time', sector: 'legal',
    roles: ['lawyer'],
    salary: '£55,000–£75,000',
    description: 'Advise cannabis operators on UK Misuse of Drugs Act, MHRA licensing, Schedule 2 import/export, and commercial contracts. Growing practice with domestic and international clients.',
    requirements: ['Qualified solicitor (England & Wales)', '3+ years regulatory or life sciences law', 'Cannabis/pharma regulatory experience desirable'],
    posted: '2026-06-19',
  },
  // ── Canada ─────────────────────────────────────────────────────────────────
  {
    id: 'j-ca-vp-international',
    title: 'VP, International Business — Cannabis Export',
    company: 'Canopy Growth Corporation',
    country: 'CA', city: 'Smiths Falls, ON',
    type: 'full-time', sector: 'executive',
    roles: ['exporter', 'wholesaler'],
    salary: 'CAD $150,000–$200,000 + bonus',
    description: 'Own the P&L for all international cannabis export markets (EU, UK, Australia, Latin America). Lead key account relationships with distributors, pharmacies, and wholesalers across 10+ markets.',
    requirements: ['10+ years international trade / regulated goods leadership', 'Cannabis or pharma background', 'Travel 40%'],
    posted: '2026-06-12', featured: true,
  },
  {
    id: 'j-ca-nurse-practitioner',
    title: 'Nurse Practitioner — Virtual Cannabis Clinic',
    company: 'Spectrum Therapeutics',
    country: 'CA', city: 'Toronto, ON',
    type: 'full-time', sector: 'medical',
    roles: ['doctor', 'prescriber', 'nurse'],
    salary: 'CAD $90,000–$115,000',
    description: 'Conduct virtual consultations for medical cannabis authorisations. Assess patients with chronic pain, PTSD, cancer-related conditions, and sleep disorders. RN with NP designation required.',
    requirements: ['NP licence (Ontario or national register)', 'Cannabis authorisation experience', 'Virtual care platform proficiency'],
    posted: '2026-06-24', remote: true,
  },
  // ── Australia ──────────────────────────────────────────────────────────────
  {
    id: 'j-au-reg-affairs',
    title: 'Regulatory Affairs Specialist — TGA/ODC',
    company: 'Cann Group Limited',
    country: 'AU', city: 'Melbourne',
    type: 'full-time', sector: 'regulatory',
    roles: ['regulator', 'manufacturer'],
    salary: 'AUD $85,000–$110,000',
    description: 'Manage TGA product registrations, ODC licence applications, Schedule 8 authorised prescriber program submissions, and SAR-B pathway documentation for Cann Group\'s medical cannabis product portfolio.',
    requirements: ['TGA/ODC regulatory experience essential', 'EU-GMP desirable', 'Pharma or cannabis regulatory background'],
    posted: '2026-06-26',
  },
  // ── Netherlands ────────────────────────────────────────────────────────────
  {
    id: 'j-nl-pharmacist',
    title: 'Pharmacist — Medical Cannabis Dispensary',
    company: 'Apotheek Centrum Amsterdam',
    country: 'NL', city: 'Amsterdam',
    type: 'full-time', sector: 'medical',
    roles: ['pharmacist'],
    salary: '€48,000–€62,000',
    description: 'Dispense and counsel patients on BMC medical cannabis products including Bedrocan, Bediol, and Bedrolite varieties. Provide pharmacovigilance support and manage controlled substance inventory under Dutch BIG-wet.',
    requirements: ['BIG-registered pharmacist', 'Dutch fluent', 'Knowledge of medical cannabis products'],
    posted: '2026-06-08',
  },
  // ── Switzerland ────────────────────────────────────────────────────────────
  {
    id: 'j-ch-finance',
    title: 'CFO / Head of Finance — Cannabis Startup',
    company: 'Swiss Cannatech AG',
    country: 'CH', city: 'Zurich',
    type: 'full-time', sector: 'finance',
    roles: ['investor', 'retailer'],
    salary: 'CHF 120,000–160,000',
    description: 'Lead financial strategy, fundraising, and investor relations for a Swiss cannabis tech and retail platform participating in the federal pilot programme. Build financial controls ahead of a Series A round.',
    requirements: ['CPA/CA or equivalent', '5+ years startup or scale-up CFO experience', 'Cannabis or regulated industry a plus', 'Fundraising track record'],
    posted: '2026-06-17', featured: true,
  },
  // ── South Africa ───────────────────────────────────────────────────────────
  {
    id: 'j-za-cultivation-manager',
    title: 'Cultivation Manager — Export Cannabis Programme',
    company: 'Cannafrica Holdings',
    country: 'ZA', city: 'Western Cape',
    type: 'full-time', sector: 'cultivation',
    roles: ['cultivator', 'exporter'],
    salary: 'ZAR R480,000–R650,000 p.a.',
    description: 'Manage cultivation operations at a SAHPRA-licensed outdoor facility in the Western Cape. Drive GACP compliance, harvest planning, and drying/curing protocol for EU export quality flower.',
    requirements: ['Cannabis or horticultural management experience', 'GACP knowledge', 'SAHPRA facility experience preferred'],
    posted: '2026-06-21',
  },
  // ── Remote ─────────────────────────────────────────────────────────────────
  {
    id: 'j-remote-tech-lead',
    title: 'Lead Engineer — Cannabis Intelligence SaaS',
    company: 'Harbourview (Global)',
    country: 'GB', city: 'Remote',
    type: 'full-time', sector: 'technology',
    roles: ['technology'],
    salary: '£70,000–£95,000 + equity',
    description: 'Build and scale the Harbourview platform serving the global cannabis industry. Work on data pipelines, regulatory intelligence automation, and the Command Centre dashboard. Next.js 15, Supabase, TypeScript.',
    requirements: ['5+ years full-stack engineering', 'Next.js/React expertise', 'PostgreSQL/Supabase', 'Interest in regulated industries or global trade'],
    posted: '2026-06-29', remote: true, featured: true,
  },
  {
    id: 'j-remote-data-analyst',
    title: 'Market Intelligence Analyst — Cannabis',
    company: 'Green Analytics (Remote)',
    country: 'NL', city: 'Remote',
    type: 'contract', sector: 'research',
    roles: ['researcher', 'analyst'],
    salary: '€400–€600 / day',
    description: 'Track regulatory developments, market data, and price benchmarks across European cannabis markets. Produce structured intelligence reports for institutional clients including LPs, distributors, and investors.',
    requirements: ['Analytical background', 'Cannabis regulatory knowledge', 'EU language skills a bonus', 'Advanced Excel/Python'],
    posted: '2026-06-27', remote: true,
  },
]
