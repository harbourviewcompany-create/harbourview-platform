#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

const hubPagePath = 'app/admin/(protected)/hub/page.tsx';
const hubApiPath = 'app/api/admin/hub/context/route.ts';
const hubClientPath = 'components/admin/AdminHubClient.tsx';
const opsHubFiles = walk('lib/ops-hub');
const publicFiles = [
  ...walk('app'),
  ...walk('components'),
].filter((path) =>
  /\.(tsx?|jsx?)$/.test(path) &&
  !path.startsWith('app/admin/') &&
  !path.startsWith('app/api/admin/') &&
  !path.startsWith('components/admin/')
);

assert(existsSync(hubPagePath), 'admin hub page must exist under the protected admin route group');
assert(existsSync(hubApiPath), 'admin hub context API must exist under /api/admin');
assert(existsSync(hubClientPath), 'admin hub client component must stay under components/admin');
assert(opsHubFiles.length >= 4, 'server-only ops-hub read modules must exist');

const hubPage = read(hubPagePath);
const hubApi = read(hubApiPath);
const hubClient = read(hubClientPath);
const opsHubSource = opsHubFiles.map(read).join('\n');
const packageJson = read('package.json');

assert(hubPage.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), 'admin hub page must use the existing admin/operator guard');
assert(hubPage.includes('await requireAdminAuth()'), 'admin hub page must invoke the role guard before rendering');
assert(hubPage.includes("export const dynamic = 'force-dynamic'"), 'admin hub page must be dynamic');
assert(hubApi.includes("import { getAdminAuthCheck } from '@/lib/auth/adminGuard'"), 'admin hub API must use existing admin auth check');
assert(hubApi.includes('await getAdminAuthCheck()'), 'admin hub API must check auth before reading internal sources');
assert(hubApi.includes("'Cache-Control': 'no-store'"), 'admin hub API must disable caching');
assert(hubClient.includes("fetch('/api/admin/hub/context'"), 'admin hub client must call the protected admin API namespace');

assert(opsHubSource.includes("import 'server-only'"), 'ops hub modules must be server-only');
assert(!opsHubSource.includes('hv_update_active_context'), 'authoritative active-context write tool must not be included');
assert(!opsHubSource.includes('hv_promote_decision'), 'decision-promotion write tool must not be included');
assert(!opsHubSource.includes('hv_update_linear_issue'), 'Linear mutation write tool must not be included');
assert(!opsHubSource.includes('commentCreate'), 'Linear comment mutation must not be included');
assert(!opsHubSource.includes('issueUpdate'), 'Linear issue mutation must not be included');
assert(!opsHubSource.includes("method: 'PATCH'"), 'Notion PATCH writes must not be included');
assert(!opsHubSource.includes('NOTION_PROPOSAL_QUEUE_DB_ID'), 'proposal queue writes must not be included in the read-only first PR');
assert(!opsHubSource.includes('@anthropic-ai/sdk'), 'AI chat dependency must not be introduced in the read-only first PR');
assert(!opsHubSource.includes('HUB_ADMIN_EMAIL'), 'hub auth must not use parallel email allowlisting');

for (const path of publicFiles) {
  const source = read(path);
  assert(!source.includes('@/lib/ops-hub'), `${path} must not import private ops hub modules`);
  assert(!source.includes('/api/admin/hub/context'), `${path} must not call the admin hub context API`);
  assert(!source.includes('NOTION_API_KEY'), `${path} must not expose Notion env names in public code`);
  assert(!source.includes('LINEAR_API_KEY'), `${path} must not expose Linear env names in public code`);
}

assert(packageJson.includes('test:admin-hub'), 'package.json must expose the admin hub boundary test');

if (failures.length) {
  console.error('Admin hub internal boundary test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok admin hub is under the protected admin route group');
console.log('ok admin hub API is under /api/admin and uses the existing admin/operator guard');
console.log('ok ops hub services are server-only and read-only');
console.log('ok write tools, decision promotion, Linear mutation and Notion PATCH paths are absent');
console.log('ok public routes/components do not import ops hub modules or call the admin hub API');
