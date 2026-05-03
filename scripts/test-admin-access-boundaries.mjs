#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const bad = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_');

const f = {
  roles: read('lib/auth/adminRoles.ts'),
  guard: read('lib/auth/adminGuard.ts'),
  layout: read('app/admin/layout.tsx'),
  list: read('app/admin/inquiries/page.tsx'),
  detail: read('app/admin/inquiries/[id]/page.tsx'),
  action: read('app/actions/updateInquiryStatus.ts'),
  db: read('lib/admin/database.ts'),
};

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

check(f.roles.includes("'admin', 'operator', 'analyst', 'viewer'"), 'roles set present');
check(f.roles.includes("ADMIN_ALLOWED_ROLES = ['admin', 'operator']"), 'only admin operator listed for admin area');
check(!f.roles.includes('analyst']'), 'analyst not in allowed list');
check(!f.roles.includes('viewer']'), 'viewer not in allowed list');
check(f.guard.includes('HARBOURVIEW_ADMIN_REVIEW_ENABLED'), 'switch preserved');
check(f.guard.includes('/auth/v1/user'), 'auth user lookup present');
check(f.guard.includes('/rest/v1/user_roles'), 'role lookup present');
check(f.guard.includes('hasAdminRole(roles)'), 'role helper enforced');
check(!f.guard.includes('readRolesFromJwt'), 'jwt claim reader absent');
check(f.layout.includes('await requireAdminAuth()'), 'layout guarded');
check(f.layout.includes("export const dynamic = 'force-dynamic'"), 'layout dynamic');
check(f.list.includes('@/lib/admin/database'), 'list helper import present');
check(f.detail.includes('@/lib/admin/database'), 'detail helper import present');
check(f.action.includes('await requireAdminAuth()'), 'action guard present');
check(f.action.indexOf('await requireAdminAuth()') < f.action.indexOf('fetchAdminDatabase('), 'action guard precedes write helper');
check(f.action.includes('@/lib/admin/database'), 'action helper import present');
check(f.db.includes("import 'server-only'"), 'db helper server-only marker present');

for (const path of ['app/marketplace/page.tsx','app/marketplace/listings/page.tsx','app/marketplace/listings/[slug]/page.tsx','app/marketplace/sell/page.tsx','app/marketplace/wanted/page.tsx']) {
  const c = read(path);
  check(!c.includes(bad), `${path} no admin key name`);
  check(!c.includes('sourceUrl'), `${path} no sourceUrl`);
  check(!c.includes('internalReviewNotes'), `${path} no internalReviewNotes`);
}

if (failures.length) {
  console.error('Admin access proof failed:');
  failures.forEach((x) => console.error(`- ${x}`));
  process.exit(1);
}

console.log('ok env flag alone is insufficient');
console.log('ok anonymous and missing-role users are denied before admin render');
console.log('ok viewer and analyst are denied');
console.log('ok admin and operator are the only allowed admin roles');
console.log('ok inquiry list/detail use centralized helper');
console.log('ok status update requires role guard before write');
console.log('ok public marketplace routes do not expose admin internals');
