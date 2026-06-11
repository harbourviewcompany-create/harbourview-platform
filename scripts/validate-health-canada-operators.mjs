#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
const repoFiles = new Map();

function fail(message) {
  failures.push(message);
}

function read(path) {
  try {
    const value = readFileSync(path, 'utf8');
    repoFiles.set(path, value);
    return value;
  } catch {
    fail(`missing required file: ${path}`);
    return '';
  }
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git') continue;
    const path = join(dir, item.name);
    if (item.isDirectory()) walk(path, acc);
    else acc.push(path.replaceAll('\\', '/'));
  }
  return acc;
}

const migrationPath = 'supabase/migrations/20260611000000_health_canada_operator_registry.sql';
const migration = read(migrationPath);
const importer = read('scripts/import-health-canada-operators.ts');
const registryDoc = read('docs/control/HEALTH_CANADA_OPERATOR_REGISTRY.md');
const runbook = read('docs/control/HEALTH_CANADA_IMPORT_RUNBOOK.md');
const packageJson = JSON.parse(read('package.json') || '{}');

const requiredTables = [
  'health_canada_source_snapshots',
  'health_canada_raw_source_rows',
  'canadian_operator_canonical',
  'canadian_operator_licence_sites',
  'canadian_operator_outreach_queue',
  'canadian_operator_exclusions',
  'canadian_operator_duplicate_clusters',
  'canadian_operator_conflicts',
  'canadian_operator_individual_holds',
];

for (const table of requiredTables) {
  if (!migration.includes(`create table if not exists public.${table}`)) fail(`migration must create ${table}`);
  if (!migration.includes(`alter table public.${table} enable row level security`)) fail(`${table} must enable RLS`);
  if (!migration.includes(`${table}_admin_operator_all`)) fail(`${table} must have admin/operator policy`);
  if (!migration.includes(`revoke all on public.${table} from anon`)) fail(`${table} must revoke anon access`);
}

if (!migration.includes("role in ('admin','operator')")) fail('RLS policies must restrict writes/reads to admin/operator');
if (migration.includes("role in ('admin','operator','viewer')")) fail('viewer must not be allowed by registry policies');
if (migration.includes("role in ('admin','operator','analyst')")) fail('analyst write access must not be granted by registry policies');
if (!migration.includes('outreach_ready = false or status = \'active\'')) fail('licence sites must prevent outreach-ready non-active rows');
if (!migration.includes('outreach_ready boolean not null default false check (outreach_ready = false)')) fail('exclusions and individual holds must be non-outreach-ready');

for (const sheet of [
  'raw_source_rows',
  'canonical_operators',
  'active_site_licences',
  'outreach_ready_queue',
  'first_25_send_order',
  'exclusions_revoked_expired_suspended',
  'duplicate_second_site_clusters',
  'individual_name_verification_holds',
  'conflict_resolution_notes',
]) {
  if (!importer.includes(sheet)) fail(`importer must read ${sheet}`);
}

for (const required of [
  'HEALTH_CANADA_OPERATOR_IMPORT_DIR',
  'SUPABASE_SERVICE_ROLE_KEY',
  'source_snapshot',
  'Never delete rows',
]) {
  if (!importer.toLowerCase().includes(required.toLowerCase())) fail(`importer must cover ${required}`);
}

if (!packageJson.scripts?.['validate:health-canada-operators']) fail('package.json must expose validate:health-canada-operators');
if (!packageJson.scripts?.['test:health-canada-registry-leakage']) fail('package.json must expose test:health-canada-registry-leakage');

for (const phrase of [
  'RLS',
  'rollback',
  'transcript/reconciled-hold',
  'direct official machine parse',
  'no public supplier directory',
  'data/private/health-canada',
]) {
  if (!registryDoc.includes(phrase) && !runbook.includes(phrase)) fail(`docs must mention ${phrase}`);
}

const publicDirs = ['app', 'components', 'lib'];
const forbiddenPublicTokens = [
  'health_canada_raw_source_rows',
  'source_row_id',
  'source_snapshot_id',
  'outreach_queue_id',
  'outreach_ready',
  'conflict_flag',
  'conflict_resolution_notes',
  'individual_name_verification',
  'client-care',
  'Health Canada source',
  'raw registry JSON',
  'source evidence payloads',
];

const allowedPrivatePathPatterns = [
  /^app\/admin\//,
  /^lib\/server\//,
  /^lib\/admin\//,
  /^lib\/supabase\/adminDataClient\.ts$/,
  /^scripts\//,
  /^tests\//,
];

for (const dir of publicDirs) {
  for (const file of walk(dir)) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(file)) continue;
    if (allowedPrivatePathPatterns.some((pattern) => pattern.test(file))) continue;
    const content = readFileSync(file, 'utf8');
    for (const token of forbiddenPublicTokens) {
      if (content.includes(token)) fail(`public-surface leakage token ${token} found in ${file}`);
    }
  }
}

const publicMarketplaceFiles = walk('app/marketplace').concat(walk('lib/marketplace'), walk('components/marketplace'));
for (const file of publicMarketplaceFiles) {
  if (!/\.(ts|tsx|js|jsx|mjs)$/.test(file)) continue;
  const content = readFileSync(file, 'utf8');
  for (const token of ['canadian_operator_', 'health_canada_', 'phone', 'outreach_ready', 'conflict_resolution']) {
    if (content.includes(token)) fail(`marketplace public DTO/surface must not include ${token} in ${file}`);
  }
}

if (failures.length) {
  console.error('Health Canada operator registry validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok health canada registry tables exist in migration');
console.log('ok registry RLS policies restrict private tables to admin/operator');
console.log('ok anon access is explicitly revoked');
console.log('ok importer reads expected staged CSV sheets and requires server-side service role');
console.log('ok exclusion and individual-hold rows cannot be outreach-ready');
console.log('ok duplicate/second-site review structures exist');
console.log('ok package scripts expose registry validation and leakage gates');
console.log('ok public marketplace/app surfaces do not contain registry leakage tokens');
