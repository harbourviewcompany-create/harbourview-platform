import type { JurisdictionPlaybook } from './jurisdictionPlaybooks'
const STEPS = (agency: string): JurisdictionPlaybook['steps'] => [
  { step: 1, title: 'Confirm licence scope', required: true, description: `Verify authorisations under ${agency} match product class and trade direction.`, estimated_weeks: 2 },
  { step: 2, title: 'Quality / GMP evidence', required: true, description: 'Assemble GACP/GMP package the destination importer and QP will accept.', estimated_weeks: 6 },
  { step: 3, title: 'Narcotics / controlled permits', required: true, description: 'Sequence origin export and destination import permits; avoid quantity mismatches.', estimated_weeks: 6 },
  { step: 4, title: 'Counterparty & quality agreement', required: true, description: 'Importer/exporter diligence, quality agreement, recall contacts.', estimated_weeks: 3 },
  { step: 5, title: 'Shipment & release', required: true, description: 'Controlled-drug logistics, customs pack, inbound testing/release as required.', estimated_weeks: 3 },
]

const PITFALLS = [
  'Permit sequencing failures',
  'Assuming origin GMP automatically satisfies destination expectations',
  'Incomplete batch documentation for importer/QP release',
]

function pb(
  iso: string,
  name: string,
  difficulty: JurisdictionPlaybook['difficulty'],
  months: number,
  summary: string,
  agency: string,
): JurisdictionPlaybook {
  return {
    country_iso2: iso,
    country_name: name,
    difficulty,
    typical_timeline_months: months,
    estimated_cost_range: 'Jurisdiction-specific — verify with counsel',
    legal_framework_summary: summary,
    steps: STEPS(agency),
    key_regulators: [{ name: agency, role: 'Primary competent authority', tier: 'top' }],
    common_pitfalls: PITFALLS,
    last_reviewed: '2026-08-19',
    last_verified_at: null,
  }
}

export const STATIC_PLAYBOOKS: Record<string, JurisdictionPlaybook> = {
  CA: pb('CA', 'Canada', 'moderate', 9, 'Cannabis Act export path; destination often requires EU-GMP.', 'Health Canada'),
  DE: pb('DE', 'Germany', 'very_high', 12, 'BfArM narcotics import; EU-GMP; QP release.', 'BfArM'),
  AU: pb('AU', 'Australia', 'high', 10, 'ODC permits + TGA quality.', 'ODC / TGA'),
  GB: pb('GB', 'United Kingdom', 'high', 9, 'MHRA + controlled drugs; TCA ≠ single market.', 'MHRA / Home Office'),
  PT: pb('PT', 'Portugal', 'moderate', 6, 'Intra-EU Infarmed; EU-GMP; narcotics transport.', 'Infarmed'),
  NL: pb('NL', 'Netherlands', 'moderate', 6, 'Intra-EU OMC/wholesale; EU-GMP.', 'IGJ / OMC'),
  ES: pb('ES', 'Spain', 'moderate', 6, 'Intra-EU AEMPS medical pathways.', 'AEMPS'),
  DK: pb('DK', 'Denmark', 'moderate', 6, 'Intra-EU DKMA; EU-GMP.', 'DKMA'),
  CZ: pb('CZ', 'Czechia', 'moderate', 6, 'Intra-EU processing/release hub.', 'SÚKL'),
  MT: pb('MT', 'Malta', 'moderate', 6, 'EU-GMP processing corridor.', 'Malta Medicines Authority'),
  GR: pb('GR', 'Greece', 'moderate', 7, 'Intra-EU expanding cultivation.', 'EOF'),
  IT: pb('IT', 'Italy', 'high', 8, 'AIFA medical import; product-class sensitive.', 'AIFA'),
  FR: pb('FR', 'France', 'high', 10, 'ANSM constrained medical access.', 'ANSM'),
  PL: pb('PL', 'Poland', 'moderate', 8, 'CEE medical demand corridor.', 'GIF'),
  CH: pb('CH', 'Switzerland', 'high', 8, 'Swissmedic; non-EU border formalities.', 'Swissmedic'),
  IL: pb('IL', 'Israel', 'high', 10, 'IMCA export; ACAA/EU mapping per product.', 'IMCA'),
  CO: pb('CO', 'Colombia', 'high', 12, 'GACP export; often EU processing for EU medical.', 'INVIMA'),
  ZA: pb('ZA', 'South Africa', 'high', 10, 'SAHPRA; EU-GMP for EU destinations.', 'SAHPRA'),
  UY: pb('UY', 'Uruguay', 'high', 12, 'IRCCA; no EU GMP MRA.', 'IRCCA'),
  BR: pb('BR', 'Brazil', 'high', 12, 'ANVISA; often EU processing hubs.', 'ANVISA'),
  TH: pb('TH', 'Thailand', 'high', 10, 'Export rules evolving.', 'Thai FDA'),
  MX: pb('MX', 'Mexico', 'very_high', 14, 'COFEPRIS; cross-border highly constrained.', 'COFEPRIS'),
}

export function getStaticPlaybook(iso2: string): JurisdictionPlaybook | null {
  return STATIC_PLAYBOOKS[iso2.toUpperCase()] ?? null
}

export function listStaticPlaybookIso2(): string[] {
  return Object.keys(STATIC_PLAYBOOKS)
}
