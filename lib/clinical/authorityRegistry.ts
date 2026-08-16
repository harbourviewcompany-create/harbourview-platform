/**
 * Global clinical authority registry for medical-cannabis prescribing markets.
 * Links only — not clinical claims. Never fall back across countries.
 */

export type ClinicalAuthorityId =
  | 'federal-authority'
  | 'medical-document'
  | 'safety-interactions'
  | 'pharmacovigilance'

export type ClinicalAuthorityRecord = {
  id: ClinicalAuthorityId
  label: string
  purpose: string
  jurisdiction: string
  countryIso2: string
  evidenceType: 'regulation' | 'federal-guidance' | 'safety-guidance' | 'pharmacovigilance-guidance'
  evidenceStrength: 'Primary authority — evidence strength not graded by source'
  sourceName: string
  href: string
  verifiedAt: string
}

type PackInput = {
  iso2: string
  label: string
  regulatorName: string
  regulatorHref: string
  accessLabel: string
  accessPurpose: string
  accessHref: string
  safetyHref: string
  pvName: string
  pvHref: string
  verifiedAt?: string
}

function pack(input: PackInput): ClinicalAuthorityRecord[] {
  const verifiedAt = input.verifiedAt ?? '2026-08-16'
  const strength = 'Primary authority — evidence strength not graded by source' as const
  return [
    {
      id: 'federal-authority',
      label: 'Competent authority',
      purpose: `Primary medicines / controlled-substance competent authority context for ${input.label} (${input.regulatorName}).`,
      jurisdiction: input.label,
      countryIso2: input.iso2,
      evidenceType: 'regulation',
      evidenceStrength: strength,
      sourceName: input.regulatorName,
      href: input.regulatorHref,
      verifiedAt,
    },
    {
      id: 'medical-document',
      label: input.accessLabel,
      purpose: input.accessPurpose,
      jurisdiction: input.label,
      countryIso2: input.iso2,
      evidenceType: 'federal-guidance',
      evidenceStrength: strength,
      sourceName: input.regulatorName,
      href: input.accessHref,
      verifiedAt,
    },
    {
      id: 'safety-interactions',
      label: 'Safety & product information',
      purpose: `Use authorized product information and ${input.regulatorName} safety communications. Harbourview does not provide a structured interaction checker.`,
      jurisdiction: input.label,
      countryIso2: input.iso2,
      evidenceType: 'safety-guidance',
      evidenceStrength: strength,
      sourceName: `${input.regulatorName} · Safety`,
      href: input.safetyHref,
      verifiedAt,
    },
    {
      id: 'pharmacovigilance',
      label: 'Adverse-reaction reporting',
      purpose: `Health-professional pathway for suspected adverse reactions in ${input.label}.`,
      jurisdiction: input.label,
      countryIso2: input.iso2,
      evidenceType: 'pharmacovigilance-guidance',
      evidenceStrength: strength,
      sourceName: input.pvName,
      href: input.pvHref,
      verifiedAt,
    },
  ]
}

/** Compact helper for ministry-style packs where one portal covers all four cards. */
function ministry(
  iso2: string,
  label: string,
  name: string,
  href: string,
  accessLabel: string,
  accessPurpose: string,
): PackInput {
  return {
    iso2,
    label,
    regulatorName: name,
    regulatorHref: href,
    accessLabel,
    accessPurpose,
    accessHref: href,
    safetyHref: href,
    pvName: name,
    pvHref: href,
  }
}

const CANADA_PACK: ClinicalAuthorityRecord[] = [
  {
    id: 'federal-authority',
    label: 'Authorization framework',
    purpose: 'Current federal authority for health care practitioners under the Cannabis Regulations.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'regulation',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'Justice Laws Website · Cannabis Regulations §272',
    href: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-272.html',
    verifiedAt: '2026-08-14',
  },
  {
    id: 'medical-document',
    label: 'Medical document requirements',
    purpose: 'Required contents and validity of the federal medical document.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'regulation',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'Justice Laws Website · Cannabis Regulations §273',
    href: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-273.html',
    verifiedAt: '2026-08-14',
  },
  {
    id: 'safety-interactions',
    label: 'Safety & interaction guidance',
    purpose: 'Current federal safety, contraindication-like and interaction guidance for cannabis used for medical purposes.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'safety-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'Health Canada · Cannabis for medical purposes',
    href: 'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
    verifiedAt: '2026-08-14',
  },
  {
    id: 'pharmacovigilance',
    label: 'Adverse-reaction reporting',
    purpose: 'Current federal health-professional guidance for reporting suspected adverse reactions to cannabis.',
    jurisdiction: 'Canada',
    countryIso2: 'CA',
    evidenceType: 'pharmacovigilance-guidance',
    evidenceStrength: 'Primary authority — evidence strength not graded by source',
    sourceName: 'Health Canada · Report a side effect to cannabis: Health care professionals',
    href: 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/recalls-adverse-reactions-reporting/report-side-effects-cannabis-products/health-care-professionals.html',
    verifiedAt: '2026-08-14',
  },
]

const GLOBAL_PACKS: PackInput[] = [
  // ── Americas ─────────────────────────────────────────────────────────────
  ministry('US', 'United States', 'U.S. FDA',
    'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd',
    'Federal vs state access',
    'FDA regulates cannabis-derived drugs federally; most patient access is state-regulated. Confirm state programme rules and any FDA-approved labeling.'),
  ministry('MX', 'Mexico', 'COFEPRIS', 'https://www.gob.mx/cofepris',
    'Medical cannabis framework', 'Mexican medical cannabis regulation is evolving under COFEPRIS. Verify current authorization and prescribing requirements.'),
  ministry('BR', 'Brazil', 'ANVISA', 'https://www.gov.br/anvisa/pt-br',
    'Cannabis products authorization', 'ANVISA regulates cannabis-derived products and import authorization. Confirm current RDC rules and registration status.'),
  ministry('CO', 'Colombia', 'INVIMA', 'https://www.invima.gov.co/',
    'Medical cannabis framework', 'Colombia regulates medical cannabis under Ministry of Health and INVIMA. Confirm licensed product and prescriber rules.'),
  ministry('AR', 'Argentina', 'ANMAT', 'https://www.argentina.gob.ar/anmat',
    'REPROCANN / medical programme', 'Argentina operates medical cannabis access including REPROCANN. Confirm current national programme rules.'),
  ministry('CL', 'Chile', 'ISP Chile', 'https://www.ispch.gob.cl/',
    'Medicines authority', 'Chilean cannabis medicines and magistral preparations fall under ISP and health ministry rules.'),
  ministry('PE', 'Peru', 'DIGEMID', 'https://www.digemid.minsa.gob.pe/',
    'Medical cannabis regulation', 'Peru regulates medical cannabis under DIGEMID and national health frameworks.'),
  ministry('UY', 'Uruguay', 'IRCCA / MSP', 'https://www.ircca.gub.uy/',
    'Regulated cannabis system', 'Uruguay regulates cannabis including medical channels under IRCCA and health authorities.'),
  ministry('EC', 'Ecuador', 'ARCSA', 'https://www.controlsanitario.gob.ec/',
    'Health regulation', 'Confirm current Ecuadorian health-authority rules for any cannabis-based medicine before prescribing.'),
  ministry('BO', 'Bolivia', 'Ministry of Health', 'https://www.minsalud.gob.bo/',
    'National health framework', 'Confirm current Bolivian rules for cannabis-based medicines with national health authorities.'),
  ministry('PY', 'Paraguay', 'DINAVISA', 'https://www.mspbs.gov.py/',
    'Medicines regulation', 'Confirm current Paraguayan medicines authority rules for cannabis-based products.'),
  ministry('CR', 'Costa Rica', 'Ministry of Health', 'https://www.ministeriodesalud.go.cr/',
    'Medical cannabis framework', 'Costa Rica has developed medical cannabis legislation. Confirm current ministry rules before prescribing.'),
  ministry('PA', 'Panama', 'Ministry of Health', 'https://www.minsa.gob.pa/',
    'Medical cannabis framework', 'Panama has enacted medical cannabis legislation. Confirm current national implementing rules.'),
  ministry('JM', 'Jamaica', 'Cannabis Licensing Authority / MOHW', 'https://www.cla.org.jm/',
    'Medical cannabis framework', 'Jamaica regulates medical cannabis under the CLA and Ministry of Health. Confirm current prescriber/dispensing rules.'),
  ministry('TT', 'Trinidad and Tobago', 'Ministry of Health', 'https://health.gov.tt/',
    'National health framework', 'Confirm current national rules before any cannabis-based prescribing.'),
  ministry('DO', 'Dominican Republic', 'Ministry of Public Health', 'https://www.msp.gob.do/',
    'National health framework', 'Confirm current Dominican rules for cannabis-based medicines.'),

  // ── Europe ───────────────────────────────────────────────────────────────
  {
    iso2: 'DE', label: 'Germany', regulatorName: 'BfArM', regulatorHref: 'https://www.bfarm.de/EN/Home/_node.html',
    accessLabel: 'Prescribing & reimbursement', accessPurpose: 'Medical cannabis within German medicines/narcotics framework; reimbursement involves G-BA and insurers.',
    accessHref: 'https://www.g-ba.de/english/', safetyHref: 'https://www.bfarm.de/EN/Medicinal-products/Safety/_node.html',
    pvName: 'BfArM PV', pvHref: 'https://www.bfarm.de/EN/Medicinal-products/Pharmacovigilance/_node.html',
  },
  {
    iso2: 'GB', label: 'United Kingdom', regulatorName: 'MHRA / Home Office',
    regulatorHref: 'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
    accessLabel: 'Specialist CBPM prescribing', accessPurpose: 'CBPMs restricted to GMC specialist-register prescribers under current rules.',
    accessHref: 'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
    safetyHref: 'https://www.gov.uk/drug-safety-update', pvName: 'Yellow Card', pvHref: 'https://yellowcard.mhra.gov.uk/',
  },
  ministry('FR', 'France', 'ANSM', 'https://ansm.sante.fr/',
    'Medical cannabis access', 'Supervised medical cannabis framework under ANSM. Confirm current pathway and site requirements.'),
  ministry('NL', 'Netherlands', 'OMC / Farmatec', 'https://english.farmatec.nl/',
    'Office of Medicinal Cannabis', 'OMC supply framework; physicians may prescribe; pharmacies dispense OMC products.'),
  ministry('IT', 'Italy', 'AIFA', 'https://www.aifa.gov.it/',
    'Medical cannabis / magistral', 'Often via magistral preparation under Ministry of Health / AIFA rules.'),
  ministry('ES', 'Spain', 'AEMPS', 'https://www.aemps.gob.es/',
    'Medicines & controlled substances', 'Spanish medical cannabis policy is evolving under AEMPS. Verify current pathways.'),
  ministry('PT', 'Portugal', 'INFARMED', 'https://www.infarmed.pt/',
    'Medical cannabis authorization', 'INFARMED authorizes products and pharmacy dispensing.'),
  ministry('PL', 'Poland', 'GIF / URPL', 'https://www.gif.gov.pl/',
    'Medical cannabis prescribing', 'Physician prescription of preparations under pharmaceutical inspection rules.'),
  ministry('CZ', 'Czechia', 'SÚKL', 'https://www.sukl.eu/',
    'Medical cannabis framework', 'Regulated under SÚKL and national medicines law.'),
  ministry('DK', 'Denmark', 'Danish Medicines Agency', 'https://laegemiddelstyrelsen.dk/en/',
    'Pilot / medical schemes', 'Confirm whether a product is inside a current legal pathway.'),
  ministry('SE', 'Sweden', 'Läkemedelsverket', 'https://www.lakemedelsverket.se/en',
    'Licensed medicines only', 'Generally restricted to approved medicinal products under MPA rules.'),
  ministry('NO', 'Norway', 'Norwegian Medicines Agency', 'https://www.dmp.no/en',
    'Prescription medicines framework', 'Tightly regulated specialized routes under DMP.'),
  ministry('CH', 'Switzerland', 'Swissmedic', 'https://www.swissmedic.ch/swissmedic/en/home.html',
    'Medical cannabis framework', 'Revised narcotics law with Swissmedic oversight.'),
  ministry('AT', 'Austria', 'BASG', 'https://www.basg.gv.at/en/',
    'Medicines authority', 'Cannabis medicines under BASG/AGES regulation.'),
  ministry('BE', 'Belgium', 'FAMHP', 'https://www.famhp.be/en',
    'Medicines agency', 'Verify current authorized pathways and product status.'),
  ministry('IE', 'Ireland', 'HPRA', 'https://www.hpra.ie/',
    'Medical Cannabis Access Programme', 'MCAP under HPRA / Department of Health rules.'),
  ministry('MT', 'Malta', 'Malta Medicines Authority', 'https://medicinesauthority.gov.mt/',
    'Medical cannabis framework', 'Medicines Authority and related legislation.'),
  ministry('GR', 'Greece', 'EOF', 'https://www.eof.gr/web/guest/home',
    'Medical cannabis framework', 'National medicines regulation under EOF.'),
  ministry('HR', 'Croatia', 'HALMED', 'https://www.halmed.hr/en/',
    'Medicines agency', 'HALMED and national prescribing rules.'),
  ministry('SI', 'Slovenia', 'JAZMP', 'https://www.jazmp.si/en/',
    'Medicines agency', 'JAZMP oversight for cannabis medicines.'),
  ministry('SK', 'Slovakia', 'ŠÚKL', 'https://www.sukl.sk/en',
    'Medicines agency', 'ŠÚKL and national medicines law.'),
  ministry('FI', 'Finland', 'Fimea', 'https://www.fimea.fi/web/en',
    'Special licence framework', 'Typically requires special authorization routes under Fimea.'),
  ministry('LU', 'Luxembourg', 'Ministry of Health', 'https://sante.public.lu/',
    'Medical cannabis programme', 'National health programme rules.'),
  ministry('EE', 'Estonia', 'State Agency of Medicines', 'https://www.ravimiamet.ee/en',
    'Medicines agency', 'Confirm current Estonian rules for cannabis-based medicines.'),
  ministry('LV', 'Latvia', 'State Agency of Medicines', 'https://www.zva.gov.lv/en',
    'Medicines agency', 'Confirm current Latvian rules for cannabis-based medicines.'),
  ministry('LT', 'Lithuania', 'State Medicines Control Agency', 'https://www.vvkt.lt/index.php?1460878419',
    'Medicines agency', 'Confirm current Lithuanian rules for cannabis-based medicines.'),
  ministry('HU', 'Hungary', 'OGYÉI', 'https://www.ogyei.gov.hu/main_page',
    'Medicines agency', 'Confirm current Hungarian rules for cannabis-based medicines.'),
  ministry('RO', 'Romania', 'ANMDMR', 'https://www.anm.ro/en/',
    'Medicines agency', 'Confirm current Romanian rules for cannabis-based medicines.'),
  ministry('BG', 'Bulgaria', 'BDA', 'https://www.bda.bg/en/',
    'Medicines agency', 'Confirm current Bulgarian rules for cannabis-based medicines.'),
  ministry('CY', 'Cyprus', 'Pharmaceutical Services', 'https://www.moh.gov.cy/',
    'Medical cannabis framework', 'Cyprus has licensed medical cannabis activity. Confirm current ministry rules.'),
  ministry('IS', 'Iceland', 'Icelandic Medicines Agency', 'https://www.lyfjastofnun.is/english',
    'Medicines agency', 'Confirm current Icelandic rules for cannabis-based medicines.'),
  ministry('RS', 'Serbia', 'ALIMS', 'https://www.alims.gov.rs/',
    'Medicines agency', 'Confirm current Serbian rules for cannabis-based medicines.'),
  ministry('MK', 'North Macedonia', 'MALMED', 'https://malmed.gov.mk/',
    'Medical cannabis framework', 'North Macedonia licenses medical cannabis activity. Confirm current national rules.'),
  ministry('AL', 'Albania', 'National Agency for Medicines', 'https://www.shendetesia.gov.al/',
    'National health framework', 'Confirm current Albanian rules for cannabis-based medicines.'),
  ministry('UA', 'Ukraine', 'State Service / Ministry of Health', 'https://moz.gov.ua/',
    'Medical cannabis framework', 'Ukraine has moved toward regulated medical cannabis. Confirm current implementing rules.'),
  ministry('GE', 'Georgia', 'Ministry of Health', 'https://www.moh.gov.ge/',
    'National health framework', 'Confirm current Georgian rules for cannabis-based medicines.'),
  ministry('TR', 'Türkiye', 'TİTCK', 'https://www.titck.gov.tr/',
    'Medicines and medical devices', 'Türkiye tightly controls cannabis-based medicines. Confirm authorized products only.'),

  // ── Middle East / Asia-Pacific ───────────────────────────────────────────
  ministry('IL', 'Israel', 'IMCA / Ministry of Health', 'https://www.gov.il/en/departments/units/cannabis_unit',
    'IMCA programme', 'Mature medical cannabis programme; authorized prescribers and central patient registration.'),
  ministry('LB', 'Lebanon', 'Ministry of Public Health', 'https://www.moph.gov.lb/',
    'National health framework', 'Confirm current Lebanese rules for any cannabis-based medicine.'),
  ministry('JO', 'Jordan', 'JFDA', 'https://www.jfda.jo/',
    'Medicines authority', 'Confirm current Jordanian rules for cannabis-based medicines.'),
  ministry('AE', 'United Arab Emirates', 'Ministry of Health & Prevention', 'https://mohap.gov.ae/',
    'Strict controls', 'UAE maintains strict controlled-substance rules. Do not assume medical-cannabis prescribing rights without explicit authorization.'),
  ministry('AU', 'Australia', 'TGA / ODC', 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/medicinal-cannabis',
    'SAS / Authorised Prescriber', 'SAS or Authorised Prescriber pathways; import may require ODC licensing.'),
  ministry('NZ', 'New Zealand', 'Medicinal Cannabis Agency', 'https://www.health.govt.nz/our-work/regulation-health-and-disability-system/medicinal-cannabis-agency',
    'Medicinal Cannabis Scheme', 'Products must meet scheme standards; confirm verified products.'),
  ministry('TH', 'Thailand', 'Thai FDA', 'https://www.fda.moph.go.th/Pages/Home.aspx',
    'Medical cannabis framework', 'Ministry of Public Health and Thai FDA licensed pathways.'),
  ministry('KR', 'South Korea', 'MFDS', 'https://www.mfds.go.kr/eng/index.do',
    'Narcotics / orphan pathways', 'Limited cannabis-based medicines under strict MFDS rules.'),
  ministry('JP', 'Japan', 'PMDA / MHLW', 'https://www.pmda.go.jp/english/',
    'Strict cannabis controls', 'Only specific approved medicines may be available. Do not assume general medical-cannabis rights.'),
  ministry('IN', 'India', 'CDSCO / Ministry of AYUSH', 'https://cdsco.gov.in/',
    'Ayurvedic / narcotics framework', 'India has complex cannabis-related traditional and narcotics rules. Confirm product class and authorization before any clinical use.'),
  ministry('LK', 'Sri Lanka', 'NMRA', 'https://nmra.gov.lk/',
    'Medicines authority', 'Confirm current Sri Lankan rules for cannabis-based medicines.'),
  ministry('PH', 'Philippines', 'FDA Philippines', 'https://www.fda.gov.ph/',
    'Medicines authority', 'Confirm current Philippine rules; medical cannabis policy remains restricted.'),
  ministry('MY', 'Malaysia', 'NPRA', 'https://www.npra.gov.my/',
    'Strict controls', 'Malaysia maintains strict cannabis controls. Do not assume prescribing rights without explicit authorization.'),
  ministry('SG', 'Singapore', 'HSA', 'https://www.hsa.gov.sg/',
    'Strict controls', 'Singapore maintains strict controlled-substance rules. Only explicitly authorized medicines apply.'),
  ministry('TW', 'Taiwan', 'TFDA', 'https://www.fda.gov.tw/ENG/',
    'Medicines authority', 'Confirm current Taiwanese rules for any cannabis-derived medicine.'),
  ministry('HK', 'Hong Kong', 'Drug Office / DH', 'https://www.drugoffice.gov.hk/',
    'Strict controls', 'Hong Kong maintains strict controls. Confirm authorized medicines only.'),
  ministry('MN', 'Mongolia', 'Ministry of Health', 'https://moh.gov.mn/',
    'National health framework', 'Confirm current Mongolian rules for cannabis-based medicines.'),
  ministry('NP', 'Nepal', 'Department of Drug Administration', 'https://www.dda.gov.np/',
    'Medicines authority', 'Confirm current Nepalese rules for cannabis-based medicines.'),

  // ── Africa ───────────────────────────────────────────────────────────────
  ministry('ZA', 'South Africa', 'SAHPRA', 'https://www.sahpra.org.za/',
    'Section 21 / medicines framework', 'SAHPRA regulates medicines including Section 21 pathways where applicable.'),
  ministry('LS', 'Lesotho', 'Ministry of Health', 'https://www.gov.ls/',
    'Licensed industry framework', 'Cultivation/export licensing exists; confirm local medical prescribing rules.'),
  ministry('MW', 'Malawi', 'Pharmacy and Medicines Regulatory Authority', 'https://www.pmra.mw/',
    'Medicines regulation', 'Malawi has cannabis industry frameworks. Confirm medical prescribing rules with national authorities.'),
  ministry('ZW', 'Zimbabwe', 'MCAZ', 'https://www.mcaz.co.zw/',
    'Medicines authority', 'Confirm current Zimbabwean rules for cannabis-based medicines.'),
  ministry('UG', 'Uganda', 'NDA', 'https://www.nda.or.ug/',
    'Medicines authority', 'Confirm current Ugandan rules for cannabis-based medicines.'),
  ministry('KE', 'Kenya', 'Pharmacy and Poisons Board', 'https://www.pharmacyboardkenya.org/',
    'Medicines authority', 'Confirm current Kenyan rules for cannabis-based medicines.'),
  ministry('RW', 'Rwanda', 'FDA Rwanda', 'https://www.rwandafda.gov.rw/',
    'Medicines authority', 'Confirm current Rwandan rules for cannabis-based medicines.'),
  ministry('GH', 'Ghana', 'FDA Ghana', 'https://www.fdaghana.gov.gh/',
    'Medicines authority', 'Confirm current Ghanaian rules for cannabis-based medicines.'),
  ministry('NG', 'Nigeria', 'NAFDAC', 'https://www.nafdac.gov.ng/',
    'Medicines authority', 'Confirm current Nigerian rules for cannabis-based medicines.'),
  ministry('MA', 'Morocco', 'Ministry of Health', 'https://www.sante.gov.ma/',
    'Medical cannabis framework', 'Morocco has licensed medical/industrial cannabis activity. Confirm medical prescribing rules.'),
  ministry('EG', 'Egypt', 'EDA', 'https://www.edaegypt.gov.eg/',
    'Strict controls', 'Egypt maintains strict controls. Confirm any authorized medicine explicitly.'),
]

export const CLINICAL_AUTHORITY_SEED: readonly ClinicalAuthorityRecord[] = [
  ...CANADA_PACK,
  ...GLOBAL_PACKS.flatMap(pack),
]

export const CLINICAL_COUNTRY_ALIASES: Record<string, string> = {
  CA: 'CA', CANADA: 'CA',
  US: 'US', USA: 'US', 'UNITED STATES': 'US', 'UNITED-STATES': 'US',
  MX: 'MX', MEXICO: 'MX',
  BR: 'BR', BRAZIL: 'BR',
  CO: 'CO', COLOMBIA: 'CO',
  AR: 'AR', ARGENTINA: 'AR',
  CL: 'CL', CHILE: 'CL',
  PE: 'PE', PERU: 'PE',
  UY: 'UY', URUGUAY: 'UY',
  EC: 'EC', ECUADOR: 'EC',
  BO: 'BO', BOLIVIA: 'BO',
  PY: 'PY', PARAGUAY: 'PY',
  CR: 'CR', 'COSTA RICA': 'CR',
  PA: 'PA', PANAMA: 'PA',
  JM: 'JM', JAMAICA: 'JM',
  TT: 'TT', 'TRINIDAD AND TOBAGO': 'TT',
  DO: 'DO', 'DOMINICAN REPUBLIC': 'DO',
  DE: 'DE', GERMANY: 'DE',
  GB: 'GB', UK: 'GB', 'UNITED KINGDOM': 'GB', 'UNITED-KINGDOM': 'GB',
  FR: 'FR', FRANCE: 'FR',
  NL: 'NL', NETHERLANDS: 'NL', HOLLAND: 'NL',
  IT: 'IT', ITALY: 'IT',
  ES: 'ES', SPAIN: 'ES',
  PT: 'PT', PORTUGAL: 'PT',
  PL: 'PL', POLAND: 'PL',
  CZ: 'CZ', CZECHIA: 'CZ', 'CZECH REPUBLIC': 'CZ',
  DK: 'DK', DENMARK: 'DK',
  SE: 'SE', SWEDEN: 'SE',
  NO: 'NO', NORWAY: 'NO',
  CH: 'CH', SWITZERLAND: 'CH',
  AT: 'AT', AUSTRIA: 'AT',
  BE: 'BE', BELGIUM: 'BE',
  IE: 'IE', IRELAND: 'IE',
  MT: 'MT', MALTA: 'MT',
  GR: 'GR', GREECE: 'GR',
  HR: 'HR', CROATIA: 'HR',
  SI: 'SI', SLOVENIA: 'SI',
  SK: 'SK', SLOVAKIA: 'SK',
  FI: 'FI', FINLAND: 'FI',
  LU: 'LU', LUXEMBOURG: 'LU',
  EE: 'EE', ESTONIA: 'EE',
  LV: 'LV', LATVIA: 'LV',
  LT: 'LT', LITHUANIA: 'LT',
  HU: 'HU', HUNGARY: 'HU',
  RO: 'RO', ROMANIA: 'RO',
  BG: 'BG', BULGARIA: 'BG',
  CY: 'CY', CYPRUS: 'CY',
  IS: 'IS', ICELAND: 'IS',
  RS: 'RS', SERBIA: 'RS',
  MK: 'MK', 'NORTH MACEDONIA': 'MK',
  AL: 'AL', ALBANIA: 'AL',
  UA: 'UA', UKRAINE: 'UA',
  GE: 'GE', GEORGIA: 'GE',
  TR: 'TR', TURKEY: 'TR', TÜRKIYE: 'TR', TURKIYE: 'TR',
  IL: 'IL', ISRAEL: 'IL',
  LB: 'LB', LEBANON: 'LB',
  JO: 'JO', JORDAN: 'JO',
  AE: 'AE', UAE: 'AE', 'UNITED ARAB EMIRATES': 'AE',
  AU: 'AU', AUSTRALIA: 'AU',
  NZ: 'NZ', 'NEW ZEALAND': 'NZ',
  TH: 'TH', THAILAND: 'TH',
  KR: 'KR', 'SOUTH KOREA': 'KR', KOREA: 'KR',
  JP: 'JP', JAPAN: 'JP',
  IN: 'IN', INDIA: 'IN',
  LK: 'LK', 'SRI LANKA': 'LK',
  PH: 'PH', PHILIPPINES: 'PH',
  MY: 'MY', MALAYSIA: 'MY',
  SG: 'SG', SINGAPORE: 'SG',
  TW: 'TW', TAIWAN: 'TW',
  HK: 'HK', 'HONG KONG': 'HK',
  MN: 'MN', MONGOLIA: 'MN',
  NP: 'NP', NEPAL: 'NP',
  ZA: 'ZA', 'SOUTH AFRICA': 'ZA',
  LS: 'LS', LESOTHO: 'LS',
  MW: 'MW', MALAWI: 'MW',
  ZW: 'ZW', ZIMBABWE: 'ZW',
  UG: 'UG', UGANDA: 'UG',
  KE: 'KE', KENYA: 'KE',
  RW: 'RW', RWANDA: 'RW',
  GH: 'GH', GHANA: 'GH',
  NG: 'NG', NIGERIA: 'NG',
  MA: 'MA', MOROCCO: 'MA',
  EG: 'EG', EGYPT: 'EG',
}

export const CLINICAL_JURISDICTION_LABELS: Record<string, string> = Object.fromEntries(
  CLINICAL_AUTHORITY_SEED.map(a => [a.countryIso2, a.jurisdiction]),
)

export function listClinicalAuthorityCountries(): string[] {
  return [...new Set(CLINICAL_AUTHORITY_SEED.map(a => a.countryIso2))].sort()
}

export function getClinicalAuthoritiesForCountry(countryIso2: string | null | undefined): readonly ClinicalAuthorityRecord[] {
  if (!countryIso2) return []
  const iso = CLINICAL_COUNTRY_ALIASES[countryIso2.trim().toUpperCase()] ?? (countryIso2.trim().length === 2 ? countryIso2.trim().toUpperCase() : null)
  if (!iso) return []
  return CLINICAL_AUTHORITY_SEED.filter(a => a.countryIso2 === iso)
}
