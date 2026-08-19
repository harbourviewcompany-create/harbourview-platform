import fs from 'node:fs'

const base = process.env.CLINICAL_TEST_API_URL
const anon = process.env.CLINICAL_TEST_ANON_KEY
const service = process.env.CLINICAL_TEST_SERVICE_ROLE_KEY

if (!base || !anon || !service) {
  throw new Error('local Clinical Supabase credentials missing')
}

const headers = (key) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
})

async function get(path, key = service) {
  const response = await fetch(`${base}/rest/v1/${path}`, { headers: headers(key) })
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`)
  return response.json()
}

async function mutate(path, method, body, key = service, prefer = 'return=representation') {
  const response = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: { ...headers(key), Prefer: prefer },
    body: JSON.stringify(body),
  })
  return { ok: response.ok, status: response.status, text: await response.text() }
}

const depthSlugs = [
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

const originalInteractionPairs = new Set([
  'clobazam|cbd',
  'warfarin|cbd',
  'cns-depressants|thc',
  'tacrolimus|cbd',
  'ssri|cbd',
])

const intendedInteractionPairs = new Set([
  'valproate|cbd',
  'clobazam|thc',
  'opioids|thc',
  'opioids|cbd',
  'benzodiazepines|thc',
  'benzodiazepines|cbd',
  'phenytoin|cbd',
  'carbamazepine|cbd',
  'everolimus|cbd',
  'alcohol|thc',
  'alcohol|cbd',
  'theophylline|cbd',
  'bupropion|cbd',
  'anticholinergics|thc',
  'cns-depressants|cbd',
])

const depth = await get(
  `clinical_evidence_records?select=id,slug,review_status,publication_scope,freshness_status,jurisdictions,primary_source_url,primary_source_registry_id&slug=in.(${depthSlugs.join(',')})&order=slug.asc`,
)

if (depth.length !== 9) throw new Error(`expected nine corpus-depth records, got ${depth.length}`)
if (
  depth.some(
    (row) =>
      row.review_status !== 'under-review' ||
      row.publication_scope !== 'clinical-synthesis' ||
      row.freshness_status !== 'review-required',
  )
) {
  throw new Error('graded corpus-depth records were not staged under governed review')
}
if (
  depth.some(
    (row) =>
      !row.primary_source_registry_id ||
      !row.primary_source_url ||
      row.primary_source_url === 'https://pubmed.ncbi.nlm.nih.gov/' ||
      row.primary_source_url === 'https://www.accessdata.fda.gov/scripts/cder/daf/',
  )
) {
  throw new Error('corpus-depth record lacks record-specific normalized source provenance')
}

for (const slug of ['ev-dravet-cbd-adjunctive', 'ev-lgs-cbd-adjunctive', 'ev-cbd-hepatic-safety']) {
  const row = depth.find((candidate) => candidate.slug === slug)
  if (!row || !row.jurisdictions.includes('CA')) {
    throw new Error(`${slug} is not queryable in the Canada corpus context`)
  }
}

const legacy = await get(
  `clinical_evidence_records?select=slug,review_status,publication_scope&slug=in.(${legacyGradedSlugs.join(',')})`,
)
if (
  legacy.length !== 11 ||
  legacy.some((row) => row.review_status !== 'under-review' || row.publication_scope !== 'clinical-synthesis')
) {
  throw new Error('legacy August 18 graded seeds bypassed governed staging on zero-state replay')
}

const interactions = await get(
  'clinical_medication_interactions?select=id,medication_ingredient,cannabinoid,medication_ingredient_key,cannabinoid_key,primary_source_url,review_status',
)
if (interactions.length !== 20) throw new Error(`expected 20 total interaction pairs, got ${interactions.length}`)

const normalized = new Set(
  interactions.map((row) => `${row.medication_ingredient_key}|${row.cannabinoid_key}`),
)
if (normalized.size !== interactions.length) throw new Error('duplicate normalized interaction pair survived')

for (const pair of originalInteractionPairs) {
  if (!normalized.has(pair)) throw new Error(`pre-existing interaction pair was lost: ${pair}`)
}

const newInteractions = interactions.filter((row) =>
  intendedInteractionPairs.has(`${row.medication_ingredient_key}|${row.cannabinoid_key}`),
)
if (newInteractions.length !== 15) {
  throw new Error(`expected all 15 intended interaction pairs, got ${newInteractions.length}`)
}
if (
  newInteractions.some(
    (row) =>
      !row.primary_source_url ||
      row.primary_source_url === 'https://pubmed.ncbi.nlm.nih.gov/' ||
      row.primary_source_url === 'https://www.accessdata.fda.gov/scripts/cder/daf/',
  )
) {
  throw new Error('new interaction corpus contains a generic landing-page primary source')
}

const anonDepth = await get(
  `clinical_evidence_records?select=slug&slug=in.(${depthSlugs.join(',')})`,
  anon,
)
if (anonDepth.length !== 0) throw new Error('under-review graded depth records leaked through evidence RLS')

for (const table of [
  'clinical_evidence_sources',
  'clinical_evidence_reviews',
  'clinical_reviewer_credentials',
  'clinical_evidence_source_snapshots',
  'clinical_evidence_intake_queue',
]) {
  const response = await fetch(`${base}/rest/v1/${table}?select=id&limit=1`, {
    headers: headers(anon),
  })
  if (response.ok && (await response.json()).length > 0) {
    throw new Error(`private Clinical governance table leaked to anon: ${table}`)
  }
}

if (process.env.CLINICAL_TEST_SKIP_LIFECYCLE !== '1') {
  const target = depth.find((row) => row.slug === 'ev-dravet-cbd-adjunctive')
  if (!target) throw new Error('Dravet depth record missing')

  let attempt = await mutate(
    `clinical_evidence_records?id=eq.${target.id}`,
    'PATCH',
    { review_status: 'published' },
  )
  if (attempt.ok) throw new Error('publication succeeded without provenance or qualified clinical review')

  const provenance = await mutate('clinical_evidence_reviews', 'POST', {
    evidence_record_id: target.id,
    review_type: 'provenance',
    reviewer_type: 'system',
    reviewer_identity: 'CI provenance gate fixture',
    decision: 'approved',
    rationale: 'CI-only gate proof; not a production clinical approval.',
    reviewed_at: new Date().toISOString(),
  })
  if (!provenance.ok) {
    throw new Error(`CI provenance fixture failed: ${provenance.status} ${provenance.text}`)
  }

  attempt = await mutate(
    `clinical_evidence_records?id=eq.${target.id}`,
    'PATCH',
    { review_status: 'published' },
  )
  if (attempt.ok) {
    throw new Error('publication succeeded with provenance but without credential-bound clinical review')
  }

  const reviewerId = crypto.randomUUID()
  const credential = await mutate('clinical_reviewer_credentials', 'POST', {
    user_id: reviewerId,
    profession: 'clinician',
    jurisdiction: 'CA-TEST',
    credential_reference: `CORPUS-CI-${crypto.randomUUID()}`,
    verification_source_url: 'https://example.invalid/clinical-corpus-ci-credential',
    verification_status: 'verified',
    verified_at: new Date().toISOString(),
  })
  if (!credential.ok) {
    throw new Error(`credential fixture failed: ${credential.status} ${credential.text}`)
  }
  const credentialId = JSON.parse(credential.text)[0]?.id
  if (!credentialId) throw new Error('credential fixture did not return an id')

  const clinical = await mutate('clinical_evidence_reviews', 'POST', {
    evidence_record_id: target.id,
    review_type: 'clinical',
    reviewer_type: 'clinician',
    reviewer_user_id: reviewerId,
    reviewer_credential_id: credentialId,
    reviewer_identity: 'CI credential-bound clinician fixture',
    decision: 'approved',
    grading_method_key: 'harbourview-clinical-evidence-v1',
    assigned_evidence_strength: 'high',
    rationale: 'CI-only lifecycle gate proof; not a production clinical approval.',
    reviewed_at: new Date().toISOString(),
  })
  if (!clinical.ok) {
    throw new Error(`credential-bound clinical fixture failed: ${clinical.status} ${clinical.text}`)
  }

  attempt = await mutate(
    `clinical_evidence_records?id=eq.${target.id}`,
    'PATCH',
    { review_status: 'published' },
  )
  if (!attempt.ok) {
    throw new Error(
      `publication did not succeed after both governed review gates: ${attempt.status} ${attempt.text}`,
    )
  }

  const restore = await mutate(
    `clinical_evidence_records?id=eq.${target.id}`,
    'PATCH',
    { review_status: 'under-review', freshness_status: 'review-required' },
  )
  if (!restore.ok) throw new Error(`failed to restore CI depth fixture to under-review: ${restore.status}`)
}

const evidence = {
  depth_records: depth.length,
  depth_under_review: depth.filter((row) => row.review_status === 'under-review').length,
  legacy_graded_under_review: legacy.length,
  interaction_pairs: interactions.length,
  intended_new_interaction_pairs: newInteractions.length,
  normalized_interaction_pairs: normalized.size,
  original_interaction_pairs_preserved: originalInteractionPairs.size,
  anon_depth_visible: anonDepth.length,
  publication_gate:
    process.env.CLINICAL_TEST_SKIP_LIFECYCLE === '1'
      ? 'lifecycle skipped on post-replay cardinality check'
      : 'provenance + valid credential-bound clinician/pharmacist review required',
}

fs.mkdirSync('artifacts/clinical-corpus-depth', { recursive: true })
const name = process.env.CLINICAL_TEST_SKIP_LIFECYCLE === '1' ? 'idempotent-replay.json' : 'zero-state-contract.json'
fs.writeFileSync(
  `artifacts/clinical-corpus-depth/${name}`,
  `${JSON.stringify(evidence, null, 2)}\n`,
)
console.log('GO:', JSON.stringify(evidence))
