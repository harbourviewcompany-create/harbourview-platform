/**
 * Published clinical monitoring protocol fixtures.
 * Used when Supabase has no published rows (local/dev) so the explorer stays useful.
 */

export type MonitoringFixture = {
  id: string
  protocolName: string
  context: string
  cannabinoid: string | null
  monitoringParameter: string
  baselineRequired: boolean
  followUpInterval: string | null
  rationale: string | null
  evidenceCertainty: string
  primarySourceTitle: string
  primarySourceUrl: string | null
  verifiedAt: string
}

export const MONITORING_FIXTURES: MonitoringFixture[] = [
  {
    id: 'mon-cbd-initiation-hepatic',
    protocolName: 'CBD initiation — hepatic monitoring',
    context: 'cbd-initiation',
    cannabinoid: 'CBD',
    monitoringParameter: 'Liver function tests (ALT, AST, bilirubin)',
    baselineRequired: true,
    followUpInterval: '4-6 weeks after initiation or dose increase, then every 3 months for the first year',
    rationale: 'Transaminase elevations are dose-related and more frequent with concomitant valproate',
    evidenceCertainty: 'moderate',
    primarySourceTitle: 'Pharmaceutical CBD safety data / product labels',
    primarySourceUrl: 'https://www.accessdata.fda.gov/scripts/cder/daf/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'mon-thc-initiation-psychiatric',
    protocolName: 'THC initiation — psychiatric screening',
    context: 'thc-initiation',
    cannabinoid: 'THC',
    monitoringParameter: 'Personal and family history of psychosis, mania or severe mood disorder',
    baselineRequired: true,
    followUpInterval: 'Reassess at each dose titration step',
    rationale: 'THC can precipitate or worsen psychotic and manic episodes in predisposed individuals',
    evidenceCertainty: 'moderate',
    primarySourceTitle: 'Cannabinoid psychiatric safety reviews',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'mon-anticoagulant-inr',
    protocolName: 'Concurrent anticoagulant — INR monitoring',
    context: 'concurrent-anticoagulant',
    cannabinoid: 'CBD',
    monitoringParameter: 'International normalised ratio (INR)',
    baselineRequired: true,
    followUpInterval: 'Within 1 week of starting, stopping, or changing CBD dose',
    rationale: 'Possible CYP-mediated interaction can shift INR outside therapeutic range',
    evidenceCertainty: 'low',
    primarySourceTitle: 'Case series and interaction references',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'mon-pediatric-growth-hepatic',
    protocolName: 'Paediatric epilepsy — growth and hepatic monitoring',
    context: 'pediatric',
    cannabinoid: 'CBD',
    monitoringParameter: 'Weight/height trend, LFTs, and concomitant antiepileptic drug levels',
    baselineRequired: true,
    followUpInterval: 'Every 4-6 weeks during titration, then every 3 months',
    rationale: 'Higher transaminase elevation rates in paediatric patients, especially with concomitant valproate',
    evidenceCertainty: 'moderate',
    primarySourceTitle: 'Paediatric CBD epilepsy trial safety data',
    primarySourceUrl: 'https://www.accessdata.fda.gov/scripts/cder/daf/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'mon-elderly-falls-sedation',
    protocolName: 'Older adults — falls and sedation monitoring',
    context: 'elderly',
    cannabinoid: null,
    monitoringParameter: 'Orthostatic blood pressure, gait/balance, and sedation score',
    baselineRequired: true,
    followUpInterval: 'At each visit during the first 4 weeks, then every 3 months',
    rationale: 'Higher sensitivity to CNS and postural effects, higher baseline falls risk',
    evidenceCertainty: 'moderate',
    primarySourceTitle: 'Geriatric cannabinoid safety reviews',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'mon-pregnancy-lactation',
    protocolName: 'Pregnancy and lactation — use avoidance and screening',
    context: 'pregnancy-lactation',
    cannabinoid: null,
    monitoringParameter: 'Pregnancy status confirmation and infant feeding plan review',
    baselineRequired: true,
    followUpInterval: 'At every visit for the duration of pregnancy or lactation',
    rationale: 'Cannabinoids cross the placenta and are present in breast milk',
    evidenceCertainty: 'low',
    primarySourceTitle: 'Obstetric and lactation cannabinoid safety guidance',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'mon-driving-safety',
    protocolName: 'Driving and safety-critical work counselling',
    context: 'thc-initiation',
    cannabinoid: 'THC',
    monitoringParameter: 'Documented counselling on impairment window and safety-critical duties',
    baselineRequired: true,
    followUpInterval: 'At initiation and at every dose increase',
    rationale: 'THC impairs psychomotor performance for a period that does not track subjective intoxication',
    evidenceCertainty: 'high',
    primarySourceTitle: 'Cannabis impairment and driving studies',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'mon-high-dose-thc-cardio',
    protocolName: 'High-dose THC — cardiovascular monitoring',
    context: 'high-dose-thc',
    cannabinoid: 'THC',
    monitoringParameter: 'Heart rate and blood pressure',
    baselineRequired: false,
    followUpInterval: 'At initiation and after each dose increase for cardiovascular disease patients',
    rationale: 'Dose-dependent tachycardia and orthostatic hypotension; rare cardiac event reports',
    evidenceCertainty: 'low',
    primarySourceTitle: 'Cardiovascular cannabinoid safety case reports',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-07-15T00:00:00Z',
  },
  {
    id: 'mon-organ-impairment',
    protocolName: 'Hepatic or renal impairment — dose and level monitoring',
    context: 'organ-impairment',
    cannabinoid: null,
    monitoringParameter: 'Renal function (eGFR) or hepatic function panel prior to and during titration',
    baselineRequired: true,
    followUpInterval: 'Before initiation, then every 4-6 weeks during titration',
    rationale: 'Reduced clearance can increase cannabinoid and interacting-drug exposure',
    evidenceCertainty: 'ungraded',
    primarySourceTitle: 'Pharmacokinetic labelling in organ impairment',
    primarySourceUrl: 'https://www.accessdata.fda.gov/scripts/cder/daf/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'mon-cud-screening',
    protocolName: 'Long-term use — cannabis use disorder screening',
    context: 'thc-initiation',
    cannabinoid: 'THC',
    monitoringParameter: 'Brief validated screening for problematic use patterns',
    baselineRequired: false,
    followUpInterval: 'At 3 months, then at least annually for ongoing therapy',
    rationale: 'Regular high-dose THC use carries a measurable risk of dependence',
    evidenceCertainty: 'moderate',
    primarySourceTitle: 'Cannabis use disorder prevalence and screening literature',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
]

export function searchMonitoringFixtures(opts: { q?: string; limit?: number }): MonitoringFixture[] {
  const limit = opts.limit ?? 30
  const q = opts.q?.trim().toLowerCase() ?? ''
  let rows = MONITORING_FIXTURES
  if (q) {
    rows = rows.filter(
      (r) =>
        r.protocolName.toLowerCase().includes(q) ||
        r.context.toLowerCase().includes(q) ||
        (r.cannabinoid ?? '').toLowerCase().includes(q) ||
        r.monitoringParameter.toLowerCase().includes(q),
    )
  }
  return rows.slice(0, limit)
}
