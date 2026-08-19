/**
 * Published high-yield medication–cannabinoid interaction fixtures.
 * Used when Supabase has no published rows (local/dev) so the explorer stays useful.
 */

export type InteractionFixture = {
  id: string
  medicationIngredient: string
  cannabinoid: string
  mechanism: string | null
  clinicalSignificance: 'minor' | 'moderate' | 'major' | 'unknown'
  evidenceCertainty: string
  uncertainty: string | null
  monitoringConsideration: string | null
  primarySourceTitle: string
  primarySourceUrl: string | null
  verifiedAt: string
}

export const INTERACTION_FIXTURES: InteractionFixture[] = [
  {
    id: 'ix-clobazam-cbd',
    medicationIngredient: 'clobazam',
    cannabinoid: 'CBD',
    mechanism: 'CBD inhibits CYP2C19; may increase N-desmethylclobazam exposure',
    clinicalSignificance: 'major',
    evidenceCertainty: 'moderate',
    uncertainty: 'Magnitude varies with CBD dose and product composition',
    monitoringConsideration: 'Monitor sedation; consider clobazam adjustment with specialist input',
    primarySourceTitle: 'Pharmacokinetic studies / product labels',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ix-valproate-cbd',
    medicationIngredient: 'valproate',
    cannabinoid: 'CBD',
    mechanism: 'Higher rates of transaminase elevation with concomitant CBD',
    clinicalSignificance: 'major',
    evidenceCertainty: 'moderate',
    uncertainty: 'Dose and baseline liver status modify risk',
    monitoringConsideration: 'Baseline and follow-up LFTs; specialist review if enzymes rise',
    primarySourceTitle: 'Pharmaceutical CBD safety data / labels',
    primarySourceUrl: 'https://www.accessdata.fda.gov/scripts/cder/daf/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ix-warfarin-cbd',
    medicationIngredient: 'warfarin',
    cannabinoid: 'CBD',
    mechanism: 'Possible CYP-mediated effect on INR',
    clinicalSignificance: 'major',
    evidenceCertainty: 'low',
    uncertainty: 'Limited clinical series; product variability high',
    monitoringConsideration: 'Increase INR monitoring when starting, stopping or changing CBD',
    primarySourceTitle: 'Case series and interaction references',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'ix-tacrolimus-cbd',
    medicationIngredient: 'tacrolimus',
    cannabinoid: 'CBD',
    mechanism: 'Potential CYP3A4 interaction increasing tacrolimus levels',
    clinicalSignificance: 'major',
    evidenceCertainty: 'low',
    uncertainty: 'Evidence largely case-based',
    monitoringConsideration: 'Therapeutic drug monitoring if CBD introduced or dose-changed',
    primarySourceTitle: 'Case reports / interaction references',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'ix-everolimus-cbd',
    medicationIngredient: 'everolimus',
    cannabinoid: 'CBD',
    mechanism: 'Potential CYP3A4-mediated increase in everolimus exposure',
    clinicalSignificance: 'major',
    evidenceCertainty: 'low',
    uncertainty: 'Extrapolated from related immunosuppressant data',
    monitoringConsideration: 'Therapeutic drug monitoring if CBD introduced or dose-changed',
    primarySourceTitle: 'Immunosuppressant–CYP interaction references',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-07-15T00:00:00Z',
  },
  {
    id: 'ix-opioids-thc',
    medicationIngredient: 'opioids',
    cannabinoid: 'THC',
    mechanism: 'Additive CNS depression',
    clinicalSignificance: 'major',
    evidenceCertainty: 'moderate',
    uncertainty: 'Frailty, dose and route modify risk',
    monitoringConsideration: 'Avoid concurrent escalation; monitor sedation and respiratory status',
    primarySourceTitle: 'Cannabinoid safety reviews',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ix-opioids-cbd',
    medicationIngredient: 'opioids',
    cannabinoid: 'CBD',
    mechanism: 'Possible additive sedation',
    clinicalSignificance: 'moderate',
    evidenceCertainty: 'low',
    uncertainty: 'Sparse controlled co-administration data',
    monitoringConsideration: 'Monitor sedation in elderly or respiratory disease',
    primarySourceTitle: 'Clinical pharmacology summaries',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ix-benzo-thc',
    medicationIngredient: 'benzodiazepines',
    cannabinoid: 'THC',
    mechanism: 'Additive sedation and psychomotor impairment',
    clinicalSignificance: 'moderate',
    evidenceCertainty: 'moderate',
    uncertainty: 'Depends on agent half-life and THC dose',
    monitoringConsideration: 'Counsel on driving and falls; avoid concurrent titration',
    primarySourceTitle: 'CNS depressant class guidance',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ix-benzo-cbd',
    medicationIngredient: 'benzodiazepines',
    cannabinoid: 'CBD',
    mechanism: 'Possible increased sedation via additive CNS effects and/or CYP pathways',
    clinicalSignificance: 'moderate',
    evidenceCertainty: 'low',
    uncertainty: 'Agent-specific PK data incomplete',
    monitoringConsideration: 'Monitor sedation in complex regimens',
    primarySourceTitle: 'Interaction class summaries',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ix-alcohol-thc',
    medicationIngredient: 'alcohol',
    cannabinoid: 'THC',
    mechanism: 'Additive impairment of cognition, coordination and driving',
    clinicalSignificance: 'major',
    evidenceCertainty: 'moderate',
    uncertainty: 'Dose-dependent',
    monitoringConsideration: 'Counsel against combined use before driving or safety-critical work',
    primarySourceTitle: 'Impairment studies',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ix-cns-thc',
    medicationIngredient: 'cns-depressants',
    cannabinoid: 'THC',
    mechanism: 'Additive CNS depression',
    clinicalSignificance: 'moderate',
    evidenceCertainty: 'moderate',
    uncertainty: 'Depends on dose, route and tolerance',
    monitoringConsideration: 'Counsel on driving, falls and staggered titration',
    primarySourceTitle: 'Clinical pharmacology consensus',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'ix-cns-cbd',
    medicationIngredient: 'cns-depressants',
    cannabinoid: 'CBD',
    mechanism: 'Additive somnolence possible',
    clinicalSignificance: 'moderate',
    evidenceCertainty: 'moderate',
    uncertainty: 'Product and dose dependent',
    monitoringConsideration: 'Titrate slowly; counsel on sedation and driving',
    primarySourceTitle: 'Product labels and safety reviews',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ix-phenytoin-cbd',
    medicationIngredient: 'phenytoin',
    cannabinoid: 'CBD',
    mechanism: 'Potential CYP-mediated changes in phenytoin exposure',
    clinicalSignificance: 'moderate',
    evidenceCertainty: 'low',
    uncertainty: 'Limited clinical series',
    monitoringConsideration: 'Consider level monitoring when starting or stopping CBD',
    primarySourceTitle: 'AED–cannabinoid interaction reviews',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-07-15T00:00:00Z',
  },
  {
    id: 'ix-carbamazepine-cbd',
    medicationIngredient: 'carbamazepine',
    cannabinoid: 'CBD',
    mechanism: 'Possible bidirectional CYP effects',
    clinicalSignificance: 'moderate',
    evidenceCertainty: 'low',
    uncertainty: 'Product variability high',
    monitoringConsideration: 'Clinical monitoring; levels where used for carbamazepine',
    primarySourceTitle: 'AED–cannabinoid interaction reviews',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-07-15T00:00:00Z',
  },
  {
    id: 'ix-ssri-cbd',
    medicationIngredient: 'ssri',
    cannabinoid: 'CBD',
    mechanism: 'Theoretical CYP2C19 interaction; clinical significance often uncertain',
    clinicalSignificance: 'minor',
    evidenceCertainty: 'very-low',
    uncertainty: 'Few controlled data',
    monitoringConsideration: 'Monitor for adverse effects; do not assume safety from absence of data',
    primarySourceTitle: 'Interaction class summaries',
    primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    verifiedAt: '2026-06-15T00:00:00Z',
  },
]

export function searchInteractionFixtures(opts: {
  q?: string
  limit?: number
}): InteractionFixture[] {
  const limit = opts.limit ?? 30
  const q = opts.q?.trim().toLowerCase() ?? ''
  let rows = INTERACTION_FIXTURES
  if (q) {
    rows = rows.filter(
      (r) =>
        r.medicationIngredient.toLowerCase().includes(q) ||
        r.cannabinoid.toLowerCase().includes(q) ||
        (r.mechanism ?? '').toLowerCase().includes(q),
    )
  }
  return rows.slice(0, limit)
}
