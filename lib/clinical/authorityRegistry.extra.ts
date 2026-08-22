/**
 * Extra regional clinical authority packs. Never fall back across countries.
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

const strength = 'Primary authority — evidence strength not graded by source' as const

function ministry(
  iso2: string,
  label: string,
  name: string,
  href: string,
  accessLabel: string,
  accessPurpose: string,
): ClinicalAuthorityRecord[] {
  const verifiedAt = '2026-08-16'
  return [
    { id: 'federal-authority', label: 'Competent authority', purpose: `Primary medicines / controlled-substance competent authority context for ${label} (${name}).`, jurisdiction: label, countryIso2: iso2, evidenceType: 'regulation', evidenceStrength: strength, sourceName: name, href, verifiedAt },
    { id: 'medical-document', label: accessLabel, purpose: accessPurpose, jurisdiction: label, countryIso2: iso2, evidenceType: 'federal-guidance', evidenceStrength: strength, sourceName: name, href, verifiedAt },
    { id: 'safety-interactions', label: 'Safety & product information', purpose: `Use authorized product information and ${name} safety communications. Harbourview does not provide a structured interaction checker.`, jurisdiction: label, countryIso2: iso2, evidenceType: 'safety-guidance', evidenceStrength: strength, sourceName: `${name} · Safety`, href, verifiedAt },
    { id: 'pharmacovigilance', label: 'Adverse-reaction reporting', purpose: `Health-professional pathway for suspected adverse reactions in ${label}.`, jurisdiction: label, countryIso2: iso2, evidenceType: 'pharmacovigilance-guidance', evidenceStrength: strength, sourceName: name, href, verifiedAt },
  ]
}

export const EXTRA_CLINICAL_AUTHORITY_PACKS: ClinicalAuthorityRecord[] = [
  ...ministry('ES', 'Spain', 'AEMPS', 'https://www.aemps.gob.es/', 'Compassionate / magistral framework', 'AEMPS and regional pathways govern medical cannabis access; confirm authorised products.'),
  ...ministry('PT', 'Portugal', 'INFARMED', 'https://www.infarmed.pt/', 'Medical cannabis authorization', 'INFARMED authorises medical cannabis products and operators.'),
  ...ministry('MT', 'Malta', 'MCA / Malta Medicines Authority', 'https://medicinesauthority.gov.mt/', 'Medical cannabis framework', 'Malta regulates medical cannabis production and patient access under the Medicines Authority.'),
  ...ministry('DK', 'Denmark', 'Danish Medicines Agency', 'https://laegemiddelstyrelsen.dk/en/', 'Pilot / medicines framework', 'Danish Medicines Agency oversees medicinal cannabis pilot and authorised products.'),
  ...ministry('SE', 'Sweden', 'MPA (Läkemedelsverket)', 'https://www.lakemedelsverket.se/en', 'Licence / special permission', 'Medical cannabis requires MPA special permission pathways.'),
  ...ministry('NO', 'Norway', 'Norwegian Medicines Agency', 'https://www.dmp.no/en', 'Special permission framework', 'Cannabis-based medicines under Norwegian special-permission rules.'),
  ...ministry('BE', 'Belgium', 'FAMHP', 'https://www.famhp.be/en', 'Magistral / special access', 'FAMHP regulates magistral preparations and special-access pathways.'),
  ...ministry('AT', 'Austria', 'BASG / AGES', 'https://www.basg.gv.at/en/', 'Medicines / narcotics framework', 'BASG oversees authorised cannabis medicines and narcotics controls.'),
  ...ministry('IE', 'Ireland', 'HPRA', 'https://www.hpra.ie/', 'MCAP / ministerial licence', 'Medical Cannabis Access Programme and ministerial licence routes.'),
  ...ministry('CZ', 'Czechia', 'SÚKL', 'https://www.sukl.cz/', 'Medical cannabis prescribing', 'SÚKL and State Institute regulate prescribed medical cannabis.'),
  ...ministry('GR', 'Greece', 'EOF', 'https://www.eof.gr/web/guest/home', 'Medical cannabis framework', 'EOF oversees medical cannabis product authorization.'),
  ...ministry('CO', 'Colombia', 'INVIMA / Ministry of Health', 'https://www.invima.gov.co/', 'Licensed medical cannabis', 'INVIMA and Ministry of Health regulate medical cannabis production and patient access.'),
  ...ministry('MX', 'Mexico', 'COFEPRIS', 'https://www.gob.mx/cofepris', 'COFEPRIS authorization', 'COFEPRIS regulates cannabis-derived products under federal health rules.'),
  ...ministry('AR', 'Argentina', 'ANMAT / REPROCANN', 'https://www.argentina.gob.ar/anmat', 'REPROCANN programme', 'REPROCANN and ANMAT frameworks govern medical cannabis access.'),
  ...ministry('CL', 'Chile', 'ISP', 'https://www.ispch.cl/', 'Magistral / special access', 'ISP oversees pharmaceutical and magistral cannabis pathways.'),
  ...ministry('PE', 'Peru', 'DIGEMID', 'https://www.digemid.minsa.gob.pe/', 'Medical cannabis regulation', 'DIGEMID regulates medical cannabis products and establishments.'),
  ...ministry('UY', 'Uruguay', 'MSP / IRCCA', 'https://www.gub.uy/ministerio-salud-publica/', 'Medical cannabis programme', 'MSP and IRCCA govern medical cannabis under Uruguay’s regulatory framework.'),
  ...ministry('JP', 'Japan', 'MHLW / PMDA', 'https://www.pmda.go.jp/english/', 'Cannabis-derived medicines', 'Strictly limited cannabis-derived pharmaceuticals under MHLW/PMDA rules.'),
  ...ministry('SG', 'Singapore', 'HSA', 'https://www.hsa.gov.sg/', 'Controlled substances framework', 'HSA controls cannabis under Misuse of Drugs rules; clinical use is exceptional.'),
  ...ministry('MY', 'Malaysia', 'NPRA / Ministry of Health', 'https://www.npra.gov.my/', 'Controlled medicines framework', 'Medical cannabis remains tightly controlled; confirm MOH authorization.'),
  ...ministry('PH', 'Philippines', 'FDA Philippines', 'https://www.fda.gov.ph/', 'Compassionate special access', 'FDA special-access pathways may apply; confirm current authorization.'),
  ...ministry('LU', 'Luxembourg', 'Ministry of Health', 'https://sante.lu/', 'Medical cannabis programme', 'Luxembourg medical cannabis programme under Ministry of Health rules.'),
  ...ministry('HR', 'Croatia', 'HALMED', 'https://www.halmed.hr/en/', 'Medical cannabis prescribing', 'HALMED oversees medicines including prescribed cannabis preparations.'),
  ...ministry('RO', 'Romania', 'ANMDMR', 'https://www.anm.ro/en/', 'Special access medicines', 'ANMDMR regulates special-access and controlled medicines pathways.'),
  ...ministry('HU', 'Hungary', 'OGYÉI', 'https://ogyei.gov.hu/main_page', 'Controlled medicines framework', 'OGYÉI oversees authorized cannabis-based medicines where applicable.'),
]

export const EXTRA_CLINICAL_COUNTRY_ALIASES: Record<string, string> = {
  ES: 'ES', SPAIN: 'ES', ESPANA: 'ES', ESPAÑA: 'ES',
  PT: 'PT', PORTUGAL: 'PT',
  MT: 'MT', MALTA: 'MT',
  DK: 'DK', DENMARK: 'DK',
  SE: 'SE', SWEDEN: 'SE',
  NO: 'NO', NORWAY: 'NO',
  BE: 'BE', BELGIUM: 'BE',
  AT: 'AT', AUSTRIA: 'AT',
  IE: 'IE', IRELAND: 'IE',
  CZ: 'CZ', CZECHIA: 'CZ', 'CZECH REPUBLIC': 'CZ',
  GR: 'GR', GREECE: 'GR',
  CO: 'CO', COLOMBIA: 'CO',
  MX: 'MX', MEXICO: 'MX', MÉXICO: 'MX',
  AR: 'AR', ARGENTINA: 'AR',
  CL: 'CL', CHILE: 'CL',
  PE: 'PE', PERU: 'PE', PERÚ: 'PE',
  UY: 'UY', URUGUAY: 'UY',
  JP: 'JP', JAPAN: 'JP',
  SG: 'SG', SINGAPORE: 'SG',
  MY: 'MY', MALAYSIA: 'MY',
  PH: 'PH', PHILIPPINES: 'PH',
  LU: 'LU', LUXEMBOURG: 'LU',
  HR: 'HR', CROATIA: 'HR',
  RO: 'RO', ROMANIA: 'RO',
  HU: 'HU', HUNGARY: 'HU',
  'UNITED STATES OF AMERICA': 'US',
  DEUTSCHLAND: 'DE',
  'GREAT BRITAIN': 'GB',
  'NETHERLANDS (KINGDOM OF THE)': 'NL',
  BRASIL: 'BR',
  ITALIA: 'IT',
  'REPUBLIC OF KOREA': 'KR',
}
