export type ClinicalSourceState =
  | 'loaded'
  | 'empty'
  | 'no-match'
  | 'stale'
  | 'degraded'
  | 'permission'
  | 'error'
  | 'limited-coverage'

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

/** Canada keeps deeper, regulation-specific cards (not only generic pack). */
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

/**
 * Global medical-cannabis competent-authority packs.
 * Goal: every Command country where cannabis can be prescribed has local regulator links.
 * Depth varies; absence of a pack must never fall back to another country.
 */
const GLOBAL_PACKS: PackInput[] = [
  // North America
  {
    iso2: 'US', label: 'United States', regulatorName: 'U.S. Food and Drug Administration (FDA)',
    regulatorHref: 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd',
    accessLabel: 'Federal vs state access',
    accessPurpose: 'FDA regulates cannabis-derived drugs at federal level; most medical cannabis access is state-regulated. Confirm state program rules and any FDA-approved product labeling separately.',
    accessHref: 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd',
    safetyHref: 'https://www.fda.gov/consumers/consumer-updates/what-you-need-know-and-what-were-working-find-out-about-products-containing-cannabis-or-cannabis',
    pvName: 'FDA MedWatch', pvHref: 'https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program',
  },
  {
    iso2: 'MX', label: 'Mexico', regulatorName: 'COFEPRIS',
    regulatorHref: 'https://www.gob.mx/cofepris',
    accessLabel: 'Medical cannabis framework',
    accessPurpose: 'Mexican medical cannabis regulation is evolving under COFEPRIS and health ministry rules. Verify current authorization and prescribing requirements before acting.',
    accessHref: 'https://www.gob.mx/cofepris',
    safetyHref: 'https://www.gob.mx/cofepris',
    pvName: 'COFEPRIS', pvHref: 'https://www.gob.mx/cofepris',
  },
  // Europe
  {
    iso2: 'DE', label: 'Germany', regulatorName: 'BfArM',
    regulatorHref: 'https://www.bfarm.de/EN/Home/_node.html',
    accessLabel: 'Prescribing & reimbursement context',
    accessPurpose: 'Medical cannabis is prescribed within the German medicines/narcotics framework; reimbursement involves G-BA and insurers — verify current rules.',
    accessHref: 'https://www.g-ba.de/english/',
    safetyHref: 'https://www.bfarm.de/EN/Medicinal-products/Safety/_node.html',
    pvName: 'BfArM Pharmacovigilance', pvHref: 'https://www.bfarm.de/EN/Medicinal-products/Pharmacovigilance/_node.html',
  },
  {
    iso2: 'GB', label: 'United Kingdom', regulatorName: 'MHRA / Home Office',
    regulatorHref: 'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
    accessLabel: 'Specialist CBPM prescribing',
    accessPurpose: 'CBPMs are controlled drugs; prescribing is restricted to specialists on the GMC specialist register under current rules.',
    accessHref: 'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
    safetyHref: 'https://www.gov.uk/drug-safety-update',
    pvName: 'MHRA Yellow Card', pvHref: 'https://yellowcard.mhra.gov.uk/',
  },
  {
    iso2: 'FR', label: 'France', regulatorName: 'ANSM',
    regulatorHref: 'https://ansm.sante.fr/',
    accessLabel: 'Medical cannabis access framework',
    accessPurpose: 'France operates a supervised medical cannabis framework under ANSM. Confirm current experiment/permanent pathway rules and prescriber site requirements.',
    accessHref: 'https://ansm.sante.fr/',
    safetyHref: 'https://ansm.sante.fr/',
    pvName: 'ANSM — adverse effects', pvHref: 'https://ansm.sante.fr/',
  },
  {
    iso2: 'NL', label: 'Netherlands', regulatorName: 'OMC / Farmatec',
    regulatorHref: 'https://english.farmatec.nl/',
    accessLabel: 'Office of Medicinal Cannabis',
    accessPurpose: 'Dutch medical cannabis is supplied through the Office for Medicinal Cannabis (OMC) framework. Any physician may prescribe; confirm current OMC product and pharmacy rules.',
    accessHref: 'https://english.farmatec.nl/',
    safetyHref: 'https://www.knmp.nl/',
    pvName: 'Lareb', pvHref: 'https://www.lareb.nl/',
  },
  {
    iso2: 'IT', label: 'Italy', regulatorName: 'AIFA / Ministry of Health',
    regulatorHref: 'https://www.aifa.gov.it/',
    accessLabel: 'Medical cannabis prescribing',
    accessPurpose: 'Italian medical cannabis is prescribed under Ministry of Health / AIFA rules, often via magistral preparation. Confirm current national and regional requirements.',
    accessHref: 'https://www.salute.gov.it/',
    safetyHref: 'https://www.aifa.gov.it/',
    pvName: 'AIFA pharmacovigilance', pvHref: 'https://www.aifa.gov.it/',
  },
  {
    iso2: 'ES', label: 'Spain', regulatorName: 'AEMPS',
    regulatorHref: 'https://www.aemps.gob.es/',
    accessLabel: 'Medicines & controlled substances',
    accessPurpose: 'Spanish medical cannabis policy is evolving under AEMPS and health ministry frameworks. Verify current authorized pathways before prescribing.',
    accessHref: 'https://www.aemps.gob.es/',
    safetyHref: 'https://www.aemps.gob.es/',
    pvName: 'AEMPS', pvHref: 'https://www.aemps.gob.es/',
  },
  {
    iso2: 'PT', label: 'Portugal', regulatorName: 'INFARMED',
    regulatorHref: 'https://www.infarmed.pt/',
    accessLabel: 'Medical cannabis authorization',
    accessPurpose: 'INFARMED regulates medical cannabis products and pharmacies in Portugal. Confirm authorized products and prescribing rules.',
    accessHref: 'https://www.infarmed.pt/',
    safetyHref: 'https://www.infarmed.pt/',
    pvName: 'INFARMED', pvHref: 'https://www.infarmed.pt/',
  },
  {
    iso2: 'PL', label: 'Poland', regulatorName: 'GIF / URPL',
    regulatorHref: 'https://www.gif.gov.pl/',
    accessLabel: 'Medical cannabis prescribing',
    accessPurpose: 'Poland allows physician prescription of medical cannabis preparations under pharmaceutical inspection rules. Confirm current GIF/URPL requirements.',
    accessHref: 'https://www.urpl.gov.pl/',
    safetyHref: 'https://www.urpl.gov.pl/',
    pvName: 'URPL', pvHref: 'https://www.urpl.gov.pl/',
  },
  {
    iso2: 'CZ', label: 'Czechia', regulatorName: 'SÚKL',
    regulatorHref: 'https://www.sukl.eu/',
    accessLabel: 'Medical cannabis framework',
    accessPurpose: 'Czech medical cannabis is regulated under SÚKL and national medicines law. Confirm current prescriber and pharmacy rules.',
    accessHref: 'https://www.sukl.eu/',
    safetyHref: 'https://www.sukl.eu/',
    pvName: 'SÚKL', pvHref: 'https://www.sukl.eu/',
  },
  {
    iso2: 'DK', label: 'Denmark', regulatorName: 'Danish Medicines Agency',
    regulatorHref: 'https://laegemiddelstyrelsen.dk/en/',
    accessLabel: 'Pilot / medical cannabis schemes',
    accessPurpose: 'Denmark has operated regulated medical cannabis schemes under the Danish Medicines Agency. Confirm whether a product is inside a current legal pathway.',
    accessHref: 'https://laegemiddelstyrelsen.dk/en/',
    safetyHref: 'https://laegemiddelstyrelsen.dk/en/',
    pvName: 'Danish Medicines Agency', pvHref: 'https://laegemiddelstyrelsen.dk/en/',
  },
  {
    iso2: 'SE', label: 'Sweden', regulatorName: 'Läkemedelsverket (MPA)',
    regulatorHref: 'https://www.lakemedelsverket.se/en',
    accessLabel: 'Licensed medicines only',
    accessPurpose: 'Sweden generally restricts cannabis medicines to approved medicinal products under MPA rules. Verify authorization status of any product before prescribing.',
    accessHref: 'https://www.lakemedelsverket.se/en',
    safetyHref: 'https://www.lakemedelsverket.se/en',
    pvName: 'Läkemedelsverket', pvHref: 'https://www.lakemedelsverket.se/en',
  },
  {
    iso2: 'NO', label: 'Norway', regulatorName: 'Norwegian Medicines Agency',
    regulatorHref: 'https://www.dmp.no/en',
    accessLabel: 'Prescription medicines framework',
    accessPurpose: 'Norwegian access to cannabis-based medicines is tightly regulated. Confirm current DMP guidance and specialized prescribing routes.',
    accessHref: 'https://www.dmp.no/en',
    safetyHref: 'https://www.dmp.no/en',
    pvName: 'DMP', pvHref: 'https://www.dmp.no/en',
  },
  {
    iso2: 'CH', label: 'Switzerland', regulatorName: 'Swissmedic',
    regulatorHref: 'https://www.swissmedic.ch/swissmedic/en/home.html',
    accessLabel: 'Medical cannabis framework',
    accessPurpose: 'Switzerland permits medical cannabis under revised narcotics law with Swissmedic oversight. Confirm current prescriber and product rules.',
    accessHref: 'https://www.swissmedic.ch/swissmedic/en/home.html',
    safetyHref: 'https://www.swissmedic.ch/swissmedic/en/home.html',
    pvName: 'Swissmedic', pvHref: 'https://www.swissmedic.ch/swissmedic/en/home.html',
  },
  {
    iso2: 'AT', label: 'Austria', regulatorName: 'AGES / BASG',
    regulatorHref: 'https://www.basg.gv.at/en/',
    accessLabel: 'Medicines authority',
    accessPurpose: 'Austrian cannabis medicines fall under BASG/AGES medicines regulation. Confirm authorized products and prescribing constraints.',
    accessHref: 'https://www.basg.gv.at/en/',
    safetyHref: 'https://www.basg.gv.at/en/',
    pvName: 'BASG', pvHref: 'https://www.basg.gv.at/en/',
  },
  {
    iso2: 'BE', label: 'Belgium', regulatorName: 'FAMHP',
    regulatorHref: 'https://www.famhp.be/en',
    accessLabel: 'Medicines agency',
    accessPurpose: 'Belgian medical cannabis policy is regulated under FAMHP. Verify current authorized pathways and product status.',
    accessHref: 'https://www.famhp.be/en',
    safetyHref: 'https://www.famhp.be/en',
    pvName: 'FAMHP', pvHref: 'https://www.famhp.be/en',
  },
  {
    iso2: 'IE', label: 'Ireland', regulatorName: 'HPRA',
    regulatorHref: 'https://www.hpra.ie/',
    accessLabel: 'Medical cannabis access programme',
    accessPurpose: 'Ireland operates a Medical Cannabis Access Programme under HPRA/Department of Health rules. Confirm eligibility and product lists.',
    accessHref: 'https://www.hpra.ie/',
    safetyHref: 'https://www.hpra.ie/',
    pvName: 'HPRA', pvHref: 'https://www.hpra.ie/',
  },
  {
    iso2: 'MT', label: 'Malta', regulatorName: 'Malta Medicines Authority',
    regulatorHref: 'https://medicinesauthority.gov.mt/',
    accessLabel: 'Medical cannabis framework',
    accessPurpose: 'Malta regulates medical cannabis through the Medicines Authority and related legislation. Confirm current prescribing and dispensing rules.',
    accessHref: 'https://medicinesauthority.gov.mt/',
    safetyHref: 'https://medicinesauthority.gov.mt/',
    pvName: 'Malta Medicines Authority', pvHref: 'https://medicinesauthority.gov.mt/',
  },
  {
    iso2: 'GR', label: 'Greece', regulatorName: 'EOF (National Organization for Medicines)',
    regulatorHref: 'https://www.eof.gr/web/guest/home',
    accessLabel: 'Medical cannabis framework',
    accessPurpose: 'Greece has established a medical cannabis framework under national medicines regulation. Confirm current EOF and ministry requirements.',
    accessHref: 'https://www.eof.gr/web/guest/home',
    safetyHref: 'https://www.eof.gr/web/guest/home',
    pvName: 'EOF', pvHref: 'https://www.eof.gr/web/guest/home',
  },
  {
    iso2: 'HR', label: 'Croatia', regulatorName: 'HALMED',
    regulatorHref: 'https://www.halmed.hr/en/',
    accessLabel: 'Medicines agency',
    accessPurpose: 'Croatian medical cannabis prescriptions are regulated under HALMED and national rules. Confirm current product and prescriber requirements.',
    accessHref: 'https://www.halmed.hr/en/',
    safetyHref: 'https://www.halmed.hr/en/',
    pvName: 'HALMED', pvHref: 'https://www.halmed.hr/en/',
  },
  {
    iso2: 'SI', label: 'Slovenia', regulatorName: 'JAZMP',
    regulatorHref: 'https://www.jazmp.si/en/',
    accessLabel: 'Medicines agency',
    accessPurpose: 'Slovenian cannabis medicines fall under JAZMP oversight. Verify authorized pathways before prescribing.',
    accessHref: 'https://www.jazmp.si/en/',
    safetyHref: 'https://www.jazmp.si/en/',
    pvName: 'JAZMP', pvHref: 'https://www.jazmp.si/en/',
  },
  {
    iso2: 'SK', label: 'Slovakia', regulatorName: 'ŠÚKL',
    regulatorHref: 'https://www.sukl.sk/en',
    accessLabel: 'Medicines agency',
    accessPurpose: 'Slovak medical cannabis policy is governed under ŠÚKL and national medicines law. Confirm current status before prescribing.',
    accessHref: 'https://www.sukl.sk/en',
    safetyHref: 'https://www.sukl.sk/en',
    pvName: 'ŠÚKL', pvHref: 'https://www.sukl.sk/en',
  },
  {
    iso2: 'FI', label: 'Finland', regulatorName: 'Fimea',
    regulatorHref: 'https://www.fimea.fi/web/en',
    accessLabel: 'Special licence / medicines framework',
    accessPurpose: 'Finnish access to cannabis-based medicines typically requires special authorization routes under Fimea. Confirm current process.',
    accessHref: 'https://www.fimea.fi/web/en',
    safetyHref: 'https://www.fimea.fi/web/en',
    pvName: 'Fimea', pvHref: 'https://www.fimea.fi/web/en',
  },
  {
    iso2: 'LU', label: 'Luxembourg', regulatorName: 'Ministry of Health / ALIMS context',
    regulatorHref: 'https://sante.public.lu/',
    accessLabel: 'Medical cannabis programme',
    accessPurpose: 'Luxembourg has developed medical cannabis access under national health rules. Confirm current programme documentation.',
    accessHref: 'https://sante.public.lu/',
    safetyHref: 'https://sante.public.lu/',
    pvName: 'Luxembourg health authorities', pvHref: 'https://sante.public.lu/',
  },
  // Middle East / Asia-Pacific
  {
    iso2: 'IL', label: 'Israel', regulatorName: 'IMCA / Ministry of Health',
    regulatorHref: 'https://www.gov.il/en/departments/units/cannabis_unit',
    accessLabel: 'IMCA medical cannabis programme',
    accessPurpose: 'Israel operates a mature medical cannabis programme under the Ministry of Health (IMCA). Confirm current indication lists, prescriber authorization, and pharmacy rules.',
    accessHref: 'https://www.gov.il/en/departments/units/cannabis_unit',
    safetyHref: 'https://www.gov.il/en/departments/ministry_of_health',
    pvName: 'Ministry of Health', pvHref: 'https://www.gov.il/en/departments/ministry_of_health',
  },
  {
    iso2: 'AU', label: 'Australia', regulatorName: 'TGA / ODC',
    regulatorHref: 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/medicinal-cannabis',
    accessLabel: 'SAS / Authorised Prescriber',
    accessPurpose: 'Access via Special Access Scheme or Authorised Prescriber pathways; import may require ODC licensing.',
    accessHref: 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/special-access-scheme',
    safetyHref: 'https://www.tga.gov.au/safety',
    pvName: 'TGA reporting', pvHref: 'https://www.tga.gov.au/safety/reporting-problems',
  },
  {
    iso2: 'NZ', label: 'New Zealand', regulatorName: 'Medsafe / Ministry of Health',
    regulatorHref: 'https://www.health.govt.nz/our-work/regulation-health-and-disability-system/medicinal-cannabis-agency',
    accessLabel: 'Medicinal Cannabis Scheme',
    accessPurpose: 'New Zealand operates a Medicinal Cannabis Scheme under the Ministry of Health. Confirm product verification and prescribing rules.',
    accessHref: 'https://www.health.govt.nz/our-work/regulation-health-and-disability-system/medicinal-cannabis-agency',
    safetyHref: 'https://www.medsafe.govt.nz/',
    pvName: 'Medsafe', pvHref: 'https://www.medsafe.govt.nz/',
  },
  {
    iso2: 'TH', label: 'Thailand', regulatorName: 'Thai FDA / Ministry of Public Health',
    regulatorHref: 'https://www.fda.moph.go.th/Pages/Home.aspx',
    accessLabel: 'Medical cannabis framework',
    accessPurpose: 'Thailand regulates medical cannabis under the Ministry of Public Health and Thai FDA. Confirm current licensed product and clinic rules.',
    accessHref: 'https://www.fda.moph.go.th/Pages/Home.aspx',
    safetyHref: 'https://www.fda.moph.go.th/Pages/Home.aspx',
    pvName: 'Thai FDA', pvHref: 'https://www.fda.moph.go.th/Pages/Home.aspx',
  },
  {
    iso2: 'KR', label: 'South Korea', regulatorName: 'Ministry of Food and Drug Safety (MFDS)',
    regulatorHref: 'https://www.mfds.go.kr/eng/index.do',
    accessLabel: 'Narcotics / orphan drug pathways',
    accessPurpose: 'South Korea allows limited cannabis-based medicines under strict MFDS narcotics rules. Confirm authorized products only.',
    accessHref: 'https://www.mfds.go.kr/eng/index.do',
    safetyHref: 'https://www.mfds.go.kr/eng/index.do',
    pvName: 'MFDS', pvHref: 'https://www.mfds.go.kr/eng/index.do',
  },
  {
    iso2: 'JP', label: 'Japan', regulatorName: 'MHLW / PMDA',
    regulatorHref: 'https://www.pmda.go.jp/english/',
    accessLabel: 'Strict cannabis controls',
    accessPurpose: 'Japan maintains strict cannabis controls; only specific approved medicines may be available. Verify PMDA/MHLW status — do not assume general medical-cannabis prescribing rights.',
    accessHref: 'https://www.mhlw.go.jp/english/',
    safetyHref: 'https://www.pmda.go.jp/english/',
    pvName: 'PMDA', pvHref: 'https://www.pmda.go.jp/english/',
  },
  // Latin America
  {
    iso2: 'BR', label: 'Brazil', regulatorName: 'ANVISA',
    regulatorHref: 'https://www.gov.br/anvisa/pt-br',
    accessLabel: 'Cannabis products authorization',
    accessPurpose: 'ANVISA regulates cannabis-derived products and import authorization in Brazil. Confirm current RDC rules and product registration status.',
    accessHref: 'https://www.gov.br/anvisa/pt-br',
    safetyHref: 'https://www.gov.br/anvisa/pt-br',
    pvName: 'ANVISA', pvHref: 'https://www.gov.br/anvisa/pt-br',
  },
  {
    iso2: 'CO', label: 'Colombia', regulatorName: 'INVIMA / Ministry of Health',
    regulatorHref: 'https://www.invima.gov.co/',
    accessLabel: 'Medical cannabis framework',
    accessPurpose: 'Colombia has a regulated medical cannabis framework under Ministry of Health and INVIMA. Confirm licensed product and prescriber rules.',
    accessHref: 'https://www.minsalud.gov.co/',
    safetyHref: 'https://www.invima.gov.co/',
    pvName: 'INVIMA', pvHref: 'https://www.invima.gov.co/',
  },
  {
    iso2: 'AR', label: 'Argentina', regulatorName: 'ANMAT / REPROCANN',
    regulatorHref: 'https://www.argentina.gob.ar/anmat',
    accessLabel: 'REPROCANN / medical programme',
    accessPurpose: 'Argentina operates medical cannabis access including REPROCANN registration pathways. Confirm current national programme rules.',
    accessHref: 'https://www.argentina.gob.ar/salud',
    safetyHref: 'https://www.argentina.gob.ar/anmat',
    pvName: 'ANMAT', pvHref: 'https://www.argentina.gob.ar/anmat',
  },
  {
    iso2: 'CL', label: 'Chile', regulatorName: 'ISP Chile',
    regulatorHref: 'https://www.ispch.gob.cl/',
    accessLabel: 'Medicines authority',
    accessPurpose: 'Chilean cannabis medicines and magistral preparations are overseen under ISP and health ministry rules. Confirm current access pathways.',
    accessHref: 'https://www.ispch.gob.cl/',
    safetyHref: 'https://www.ispch.gob.cl/',
    pvName: 'ISP Chile', pvHref: 'https://www.ispch.gob.cl/',
  },
  {
    iso2: 'PE', label: 'Peru', regulatorName: 'DIGEMID',
    regulatorHref: 'https://www.digemid.minsa.gob.pe/',
    accessLabel: 'Medical cannabis regulation',
    accessPurpose: 'Peru regulates medical cannabis under national health and DIGEMID frameworks. Confirm current authorized pathways.',
    accessHref: 'https://www.digemid.minsa.gob.pe/',
    safetyHref: 'https://www.digemid.minsa.gob.pe/',
    pvName: 'DIGEMID', pvHref: 'https://www.digemid.minsa.gob.pe/',
  },
  {
    iso2: 'UY', label: 'Uruguay', regulatorName: 'IRCCA / MSP',
    regulatorHref: 'https://www.ircca.gub.uy/',
    accessLabel: 'Regulated cannabis system',
    accessPurpose: 'Uruguay regulates cannabis including medical channels under IRCCA and health authorities. Confirm medical prescribing/dispensing rules.',
    accessHref: 'https://www.gub.uy/ministerio-salud-publica/',
    safetyHref: 'https://www.gub.uy/ministerio-salud-publica/',
    pvName: 'MSP Uruguay', pvHref: 'https://www.gub.uy/ministerio-salud-publica/',
  },
  // Africa
  {
    iso2: 'ZA', label: 'South Africa', regulatorName: 'SAHPRA',
    regulatorHref: 'https://www.sahpra.org.za/',
    accessLabel: 'Section 21 / medicines framework',
    accessPurpose: 'South African access to cannabis-based medicines is regulated by SAHPRA (including Section 21 pathways where applicable). Confirm current authorization status.',
    accessHref: 'https://www.sahpra.org.za/',
    safetyHref: 'https://www.sahpra.org.za/',
    pvName: 'SAHPRA', pvHref: 'https://www.sahpra.org.za/',
  },
  {
    iso2: 'LES', label: 'Lesotho', regulatorName: 'Ministry of Health',
    regulatorHref: 'https://www.gov.ls/',
    accessLabel: 'Licensed cannabis industry framework',
    accessPurpose: 'Lesotho licenses cannabis cultivation/export; local medical prescribing rules must be confirmed with national health authorities.',
    accessHref: 'https://www.gov.ls/',
    safetyHref: 'https://www.gov.ls/',
    pvName: 'Ministry of Health', pvHref: 'https://www.gov.ls/',
  },
]

// Fix Lesotho ISO — should be LS not LES
const NORMALIZED_GLOBAL_PACKS = GLOBAL_PACKS.map(p =>
  p.iso2 === 'LES' ? { ...p, iso2: 'LS' } : p,
)

const AUTHORITY_SEED: readonly ClinicalAuthorityRecord[] = [
  ...CANADA_PACK,
  ...NORMALIZED_GLOBAL_PACKS.flatMap(pack),
]

/** @deprecated Prefer getClinicalAuthoritiesForCountry */
export const CANADA_CLINICAL_AUTHORITIES: readonly ClinicalAuthorityRecord[] =
  AUTHORITY_SEED.filter(a => a.countryIso2 === 'CA')

const COUNTRY_ALIASES: Record<string, string> = {
  CA: 'CA', CANADA: 'CA',
  US: 'US', USA: 'US', 'UNITED STATES': 'US', 'UNITED-STATES': 'US',
  MX: 'MX', MEXICO: 'MX',
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
  IL: 'IL', ISRAEL: 'IL',
  AU: 'AU', AUSTRALIA: 'AU',
  NZ: 'NZ', 'NEW ZEALAND': 'NZ',
  TH: 'TH', THAILAND: 'TH',
  KR: 'KR', 'SOUTH KOREA': 'KR', KOREA: 'KR',
  JP: 'JP', JAPAN: 'JP',
  BR: 'BR', BRAZIL: 'BR',
  CO: 'CO', COLOMBIA: 'CO',
  AR: 'AR', ARGENTINA: 'AR',
  CL: 'CL', CHILE: 'CL',
  PE: 'PE', PERU: 'PE',
  UY: 'UY', URUGUAY: 'UY',
  ZA: 'ZA', 'SOUTH AFRICA': 'ZA',
  LS: 'LS', LESOTHO: 'LS',
}

const JURISDICTION_LABELS: Record<string, string> = {
  CA: 'Canada', US: 'United States', MX: 'Mexico',
  DE: 'Germany', GB: 'United Kingdom', FR: 'France', NL: 'Netherlands',
  IT: 'Italy', ES: 'Spain', PT: 'Portugal', PL: 'Poland', CZ: 'Czechia',
  DK: 'Denmark', SE: 'Sweden', NO: 'Norway', CH: 'Switzerland',
  AT: 'Austria', BE: 'Belgium', IE: 'Ireland', MT: 'Malta', GR: 'Greece',
  HR: 'Croatia', SI: 'Slovenia', SK: 'Slovakia', FI: 'Finland', LU: 'Luxembourg',
  IL: 'Israel', AU: 'Australia', NZ: 'New Zealand', TH: 'Thailand',
  KR: 'South Korea', JP: 'Japan',
  BR: 'Brazil', CO: 'Colombia', AR: 'Argentina', CL: 'Chile', PE: 'Peru', UY: 'Uruguay',
  ZA: 'South Africa', LS: 'Lesotho',
}

export function normalizeClinicalCountryIso2(raw: string | null | undefined): string | null {
  const key = raw?.trim().toUpperCase()
  if (!key) return null
  return COUNTRY_ALIASES[key] ?? (key.length === 2 ? key : null)
}

export function clinicalJurisdictionLabel(iso2: string | null): string {
  if (!iso2) return 'Unknown jurisdiction'
  return JURISDICTION_LABELS[iso2] ?? iso2
}

/** ISO2 codes with a published authority pack. */
export function listClinicalAuthorityCountries(): string[] {
  return [...new Set(AUTHORITY_SEED.map(a => a.countryIso2))].sort()
}

export function countryIso2FromCommandHref(commandHref: string): string | null {
  const query = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  const raw = new URLSearchParams(query).get('country')?.trim() ?? ''
  return normalizeClinicalCountryIso2(raw)
}

export function getClinicalAuthoritiesForCountry(countryIso2: string | null | undefined): readonly ClinicalAuthorityRecord[] {
  const iso = normalizeClinicalCountryIso2(countryIso2 ?? null)
  if (!iso) return []
  return AUTHORITY_SEED.filter(a => a.countryIso2 === iso)
}

export function hasClinicalAuthorityCoverage(countryIso2: string | null | undefined): boolean {
  return getClinicalAuthoritiesForCountry(countryIso2).length > 0
}

const LEGACY_MEDICAL_FRAMEWORK = /\bACMPR\b|Access to Cannabis for Medical Purposes Regulations/i

export function containsLegacyClinicalFramework(value: string | null | undefined): boolean {
  return Boolean(value && LEGACY_MEDICAL_FRAMEWORK.test(value))
}

export function safeClinicalBriefing(value: string | null | undefined): string | null {
  const text = value?.trim()
  if (!text || containsLegacyClinicalFramework(text)) return null
  return text
}

export function deriveClinicalSourceState(input: {
  programStatus?: string | null
  medicalStatus?: string | null
  patientAccess?: string | null
  physicianAccess?: string | null
  error?: boolean
  permissionDenied?: boolean
  noMatch?: boolean
  limitedAuthorityCoverage?: boolean
}): ClinicalSourceState {
  if (input.error) return 'error'
  if (input.permissionDenied) return 'permission'
  if (input.noMatch) return 'no-match'

  const values = [input.programStatus, input.medicalStatus, input.patientAccess, input.physicianAccess]
  if (values.some(containsLegacyClinicalFramework)) return 'stale'
  if (values.every(value => !value?.trim())) {
    return input.limitedAuthorityCoverage ? 'limited-coverage' : 'empty'
  }
  if (values.some(value => !value?.trim())) return 'degraded'
  return 'loaded'
}

export const CLINICAL_SOURCE_STATE_COPY: Record<ClinicalSourceState, string> = {
  loaded:
    'Jurisdiction briefing loaded. Verify material clinical decisions against the cited primary authority for this country. Cannabinoid / medical-cannabis clinical reference only — not general prescribing across all drug classes.',
  empty:
    'No reviewed jurisdiction-specific clinical briefing is loaded. Primary authorities for this country remain available below when registered.',
  'no-match':
    'No reviewed clinical record matches this context. Change jurisdiction or query, or use the primary authorities below.',
  stale:
    'Legacy medical-cannabis terminology was detected and suppressed. Use current primary authorities for this jurisdiction.',
  degraded:
    'Only part of the jurisdiction briefing is available. Treat missing fields as unknown and use the primary authorities below.',
  permission:
    'This clinical workspace requires additional permission. Public primary-authority guidance remains available when registered for this jurisdiction.',
  error:
    'Clinical briefing data could not be loaded. Retry the Command context or use the primary authorities below.',
  'limited-coverage':
    'No reviewed primary-authority pack is published for this jurisdiction yet. Clinical Command will not substitute another country’s rules. Use local regulators directly.',
}

export const CLINICAL_SCOPE_NOTICE =
  'Reviewed cannabinoid and medical-cannabis clinical reference for the active country. Not a general medicines monograph service. Not patient-specific advice.'
