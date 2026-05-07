#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/007_live_source_intake_v0_consumables.sql', 'utf8');
const consumables = readFileSync('lib/marketplace/consumables.ts', 'utf8');
const liveSources = readFileSync('lib/marketplace/liveSources.ts', 'utf8');
const candidates = readFileSync('lib/marketplace/candidates.ts', 'utf8');
const createAction = readFileSync('app/actions/createLiveSourceIntake.ts', 'utf8');
const updateAction = readFileSync('app/actions/updateCandidateStatus.ts', 'utf8');
const sourcePage = readFileSync('app/admin/(protected)/sources/page.tsx', 'utf8');
const sourceNewPage = readFileSync('app/admin/(protected)/sources/new/page.tsx', 'utf8');
const candidatePage = readFileSync('app/admin/(protected)/candidates/page.tsx', 'utf8');
const candidateDetailPage = readFileSync('app/admin/(protected)/candidates/[id]/page.tsx', 'utf8');
const publicConsumablesPage = readFileSync('app/marketplace/consumables/page.tsx', 'utf8');
const publicConsumablesFixture = readFileSync('lib/fixtures/consumables.ts', 'utf8');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const table of ['source_registry', 'source_snapshots', 'marketplace_candidates', 'candidate_review_events']) {
  assert(migration.includes(`create table if not exists public.${table}`), `migration must create ${table}`);
  assert(migration.includes(`alter table public.${table} enable row level security`), `migration must enable RLS on ${table}`);
  assert(migration.includes(`revoke all on public.${table} from anon`), `migration must revoke anon on ${table}`);
  assert(migration.includes(`${table}_admin_operator_only`), `migration must define admin/operator policy for ${table}`);
}

assert(!migration.includes('candidate_publication_links'), 'V0 must not create candidate_publication_links');
assert(migration.includes("fetch_method in ('manual_url')"), 'source registry fetch_method must be manual_url only');
assert(migration.includes("fetch_status in ('success', 'failed', 'blocked', 'skipped')"), 'source snapshots must constrain fetch_status');
assert(migration.includes("marketplace_category = 'Consumables & Operating Supplies'"), 'candidate category must be locked to consumables category');
assert(migration.includes("role in ('admin', 'operator')"), 'RLS must use existing admin/operator roles');
assert(!migration.includes('to anon using'), 'private ingestion tables must not have public anon policies');

for (const value of ['Packaging', 'Lab & QA Supplies', 'Cultivation Supplies', 'Processing Supplies', 'Sanitation & PPE', 'Logistics & Warehouse Supplies', 'Retail Supplies', 'Maintenance Consumables']) {
  assert(consumables.includes(value), `consumables helper must define ${value}`);
  assert(migration.includes(value), `migration must allow ${value}`);
}

for (const value of ['Supply Listing', 'Supplier Directory Entry', 'Wanted Consumables Request']) {
  assert(consumables.includes(value), `consumables helper must define listing type ${value}`);
  assert(migration.includes(value), `migration must allow listing type ${value}`);
}

for (const term of ['flower', 'trim', 'biomass', 'extract', 'oil', 'distillate', 'isolate', 'api', 'seed', 'clone', 'genetics', 'pesticide', 'restricted chemical', 'controlled solvent', 'prescription', 'medical product']) {
  assert(consumables.toLowerCase().includes(term), `excluded keyword guard must include ${term}`);
}

assert(liveSources.includes("fetch_status: 'skipped'"), 'source intake must create skipped snapshots');
assert(liveSources.includes('Automatic fetch deferred in V0'), 'source intake must document automatic fetch deferral');
assert(liveSources.includes("['http:', 'https:']"), 'source intake must accept only http/https URLs');
assert(liveSources.includes('Private or internal network URLs are not accepted'), 'source intake must reject obvious private/internal URLs');
assert(createAction.includes('await requireAdminAuth()'), 'source intake action must require admin/operator auth');
assert(createAction.includes('createManualSourceIntake'), 'source intake action must use manual intake helper');

for (const [from, to] of [
  ['needs_review', 'needs_verification'],
  ['needs_review', 'approved_draft'],
  ['needs_review', 'rejected'],
  ['needs_review', 'archived'],
  ['needs_verification', 'approved_draft'],
  ['needs_verification', 'rejected'],
  ['approved_draft', 'archived'],
]) {
  assert(candidates.includes(from) && candidates.includes(to), `candidate workflow must include ${from} -> ${to}`);
}
assert(candidates.includes('Rejected candidates require a note'), 'rejected transition must require a note');
assert(candidates.includes('getDraftApprovalBlockers(candidate)'), 'approved draft must use blocker review');
assert(candidates.includes('candidate_review_events'), 'status changes must write candidate_review_events');
assert(!candidates.toLowerCase().includes('publish public listing'), 'candidate helper must not publish public listings');
assert(!updateAction.includes('create public listing'), 'candidate action must not create public listings');

for (const [name, content] of [
  ['sources page', sourcePage],
  ['source new page', sourceNewPage],
  ['candidates page', candidatePage],
  ['candidate detail page', candidateDetailPage],
]) {
  assert(content.includes('await requireAdminAuth()'), `${name} must directly guard render`);
}

assert(publicConsumablesPage.includes('Consumables & Operating Supplies'), 'public consumables page must use full category label');
assert(publicConsumablesFixture.includes('Inquiry Required'), 'public consumables fixture must use safe inquiry label');
assert(publicConsumablesFixture.includes('Supplier Qualification Required'), 'public consumables fixture must use safe supplier qualification label');
for (const unsafe of ['verified supplier', 'available now', 'EU-GMP ready', 'Health Canada approved', 'FDA approved', 'COA available', 'licensed supplier', 'exclusive', 'guaranteed', 'confirmed supply']) {
  assert(!publicConsumablesFixture.toLowerCase().includes(unsafe.toLowerCase()), `public consumables fixture must not include unsafe claim ${unsafe}`);
}

if (failures.length) {
  console.error('Live source intake contract test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok live source intake migration creates private RLS tables');
console.log('ok source intake is manual-only and admin/operator guarded');
console.log('ok candidate workflow blocks unsafe approved_draft and never publishes');
console.log('ok consumables category uses public-safe labels and allowed subcategories');
