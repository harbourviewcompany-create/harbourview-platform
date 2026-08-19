import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

const guardSql = read('supabase/migrations/20260818110000_clinical_evidence_release_publication_guard.sql')
const depthSql = read('supabase/migrations/20260818192000_clinical_graded_evidence_interactions_depth.sql')
const evidenceRoute = read('app/api/clinical/evidence/route.ts')
const interactionRoute = read('app/api/clinical/interactions/route.ts')
const interactionQuery = read('lib/server/clinicalInteractionQuery.ts')
const explorer = read('components/dashboard/mobile-command/ClinicalEvidenceExplorer.tsx')

const depthEvidenceSlugs = [
  'ev-dravet-cbd-adjunctive',
  'ev-lgs-cbd-adjunctive',
  'ev-ms-spasticity-nabiximols',
  'ev-chemotherapy-nausea-thc',
  'ev-neuropathic-pain-cannabinoids',
  'ev-cbd-hepatic-safety',
  'ev-sleep-cannabinoids',
  'ev-anxiety-cbd',
  'ev-appetite-thc-cachexia',
]

const intendedPairs = [
  ['valproate', 'CBD'],
  ['clobazam', 'THC'],
  ['opioids', 'THC'],
  ['opioids', 'CBD'],
  ['benzodiazepines', 'THC'],
  ['benzodiazepines', 'CBD'],
  ['phenytoin', 'CBD'],
  ['carbamazepine', 'CBD'],
  ['everolimus', 'CBD'],
  ['alcohol', 'THC'],
  ['alcohol', 'CBD'],
  ['theophylline', 'CBD'],
  ['bupropion', 'CBD'],
  ['anticholinergics', 'THC'],
  ['cns-depressants', 'CBD'],
] as const

const legacyGradedSlugs = [
  'ev-neuropathic-pain-overview',
  'ev-cbd-epilepsy-dravet-lgs',
  'ev-safety-monitoring-overview',
  'ev-cannabinoid-drug-interactions',
  'ev-spasticity-ms-overview',
  'ev-chemo-nausea-overview',
  'ev-anxiety-cbd-overview',
  'ev-sleep-cannabinoids-overview',
  'ev-chronic-pain-non-cancer-overview',
  'ev-parkinson-symptoms-overview',
  'ev-ptsd-symptoms-overview',
]

describe('Clinical corpus-depth governed release contract', () => {
  it('preserves all nine intended graded records but stages them for qualified review', () => {
    for (const slug of depthEvidenceSlugs) expect(depthSql).toContain(`'${slug}'`)
    expect(depthSql).toContain("'under-review', 'clinical-synthesis', 'review-required'")
    expect(depthSql).toContain('valid credential-bound clinician/pharmacist review')
    expect(depthSql).not.toContain("'current',\n    'published',\n    'clinical-synthesis'")
  })

  it('requires normalized source provenance and rejects generic landing-page sources from corpus writes', () => {
    const requiredUrls = [
      'https://pubmed.ncbi.nlm.nih.gov/28538134/',
      'https://pubmed.ncbi.nlm.nih.gov/29768152/',
      'https://pubmed.ncbi.nlm.nih.gov/39502271/',
      'https://pubmed.ncbi.nlm.nih.gov/39953210/',
      'https://pubmed.ncbi.nlm.nih.gov/40238954/',
      'https://pubmed.ncbi.nlm.nih.gov/32969022/',
      'https://pubmed.ncbi.nlm.nih.gov/40929927/',
      'https://pubmed.ncbi.nlm.nih.gov/36239014/',
      'https://pubmed.ncbi.nlm.nih.gov/7730690/',
    ]
    for (const url of requiredUrls) expect(depthSql).toContain(url)
    const validationMarker = depthSql.indexOf('-- Fail the migration rather than accept generic landing pages')
    expect(validationMarker).toBeGreaterThan(0)
    const corpusWrites = depthSql.slice(0, validationMarker)
    expect(corpusWrites).not.toContain("'https://pubmed.ncbi.nlm.nih.gov/',")
    expect(corpusWrites).not.toContain("'https://www.accessdata.fda.gov/scripts/cder/daf/',")
    expect(depthSql).toContain('primary_source_registry_id')
    expect(depthSql).toContain('record-specific normalized primary-source provenance')
  })

  it('preserves all 15 intended interaction pairs with normalized pair uniqueness and idempotency', () => {
    for (const [medication, cannabinoid] of intendedPairs) {
      expect(depthSql).toContain(`'${medication}', '${cannabinoid}'`)
    }
    expect(depthSql).toContain('medication_ingredient_key')
    expect(depthSql).toContain('cannabinoid_key')
    expect(depthSql).toContain('clinical_medication_interactions_normalized_pair_uidx')
    expect(depthSql).toContain('on conflict (medication_ingredient_key, cannabinoid_key) do update set')
    expect(depthSql).toContain('review_status = existing.review_status')
  })

  it('fails before corpus writes when V1/V1.1 governance is absent', () => {
    const preconditionIndex = depthSql.indexOf("raise exception 'Clinical Evidence V1/V1.1 governance is required")
    const interactionInsertIndex = depthSql.indexOf('insert into public.clinical_medication_interactions')
    expect(preconditionIndex).toBeGreaterThan(0)
    expect(interactionInsertIndex).toBeGreaterThan(preconditionIndex)
    for (const object of [
      'clinical_evidence_sources',
      'clinical_evidence_reviews',
      'clinical_reviewer_credentials',
      'clinical_evidence_source_snapshots',
      'clinical_evidence_intake_queue',
    ]) expect(depthSql).toContain(object)
  })

  it('makes legacy graded seed replay fail closed without weakening normal publication review', () => {
    for (const slug of legacyGradedSlugs) expect(guardSql).toContain(`'${slug}'`)
    expect(guardSql).toContain("new.review_status := 'under-review'")
    expect(guardSql).toContain("new.publication_scope := 'clinical-synthesis'")
    expect(guardSql).toContain('clinical_reviewer_credential_is_valid')
    expect(guardSql).toContain("raise exception 'clinical evidence publication requires an approved provenance review'")
    expect(guardSql).toContain("raise exception 'clinical synthesis or graded certainty requires an approved credential-bound clinician/pharmacist review'")
    expect(guardSql).toContain("old.publication_scope is distinct from new.publication_scope")
    expect(guardSql).toContain("old.evidence_strength is distinct from new.evidence_strength")
  })

  it('keeps country and jurisdiction evidence query inputs equivalent', () => {
    expect(evidenceRoute).toContain('jurisdiction: request.nextUrl.searchParams.get')
    expect(evidenceRoute).toContain('country: request.nextUrl.searchParams.get')
    expect(evidenceRoute).toContain('const jurisdiction = parsed.data.jurisdiction ?? parsed.data.country')
    expect(explorer).toContain("params.set('country', countryIso2)")
  })

  it('keeps interactions DB-first and fixtures as an explicit fallback', () => {
    const dbQueryIndex = interactionQuery.indexOf(".from('clinical_medication_interactions')")
    const awaitQueryIndex = interactionQuery.indexOf('const { data, error } = await query')
    const errorFallbackIndex = interactionQuery.indexOf('if (error)')
    const emptyFallbackIndex = interactionQuery.indexOf('if (!interactions.length)')
    expect(dbQueryIndex).toBeGreaterThan(0)
    expect(awaitQueryIndex).toBeGreaterThan(dbQueryIndex)
    expect(errorFallbackIndex).toBeGreaterThan(awaitQueryIndex)
    expect(emptyFallbackIndex).toBeGreaterThan(errorFallbackIndex)
  })

  it('keeps the interactions API/mobile primarySource contract wired', () => {
    expect(interactionRoute).toContain('primarySource: {')
    expect(interactionRoute).toContain('publisher: ix.primarySourceTitle')
    expect(interactionRoute).toContain('url: ix.primarySourceUrl ?? undefined')
    expect(explorer).toContain('primarySource?: { publisher?: string; url?: string }')
    expect(explorer).toContain('ix.primarySource?.url')
  })

  it('does not add public grants for private governance provenance', () => {
    for (const privateTable of [
      'clinical_evidence_reviews',
      'clinical_reviewer_credentials',
      'clinical_evidence_sources',
      'clinical_evidence_source_snapshots',
      'clinical_evidence_intake_queue',
    ]) {
      expect(depthSql).not.toMatch(new RegExp(`grant\\s+select\\s+on\\s+(?:table\\s+)?public\\.${privateTable}\\s+to\\s+anon`, 'i'))
    }
  })
})
