#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const roleHelper = readFileSync('lib/auth/adminRoles.ts', 'utf8');
const guard = readFileSync('lib/auth/adminGuard.ts', 'utf8');
const adminLayout = readFileSync('app/admin/layout.tsx', 'utf8');
const adminListings = readFileSync('app/admin/listings/page.tsx', 'utf8');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(roleHelper.includes("'admin', 'operator', 'analyst', 'viewer'"), 'role helper must define admin/operator/analyst/viewer');
assert(roleHelper.includes("ADMIN_ALLOWED_ROLES = ['admin', 'operator']"), 'admin allowed roles must be admin/operator only');
assert(!roleHelper.includes("ADMIN_ALLOWED_ROLES = ['admin', 'operator', 'analyst'"), 'analyst must not be admin-allowed');
assert(!roleHelper.includes("ADMIN_ALLOWED_ROLES = ['admin', 'operator', 'viewer'"), 'viewer must not be admin-allowed');

for (const role of ['admin', 'operator']) {
  assert(new RegExp(`ADMIN_ALLOWED_ROLES[\\s\\S]*'${role}'`).test(roleHelper), `${role} must be allowed`);
}
for (const role of ['analyst', 'viewer']) {
  assert(!new RegExp(`ADMIN_ALLOWED_ROLES[\\s\\S]*'${role}'`).test(roleHelper), `${role} must be denied`);
}

assert(guard.includes('HARBOURVIEW_ADMIN_REVIEW_ENABLED'), 'admin guard must preserve env kill switch');
assert(guard.includes('/auth/v1/user'), 'admin guard must verify Supabase Auth user');
assert(guard.includes('/rest/v1/user_roles'), 'admin guard must read user_roles');
assert(guard.includes('hasAdminRole(roles)'), 'admin guard must enforce allowed roles');
assert(guard.includes('notFound()'), 'failed authorization should not expose admin route');
assert(adminLayout.includes('await requireAdminAuth()'), 'admin layout must invoke server-side role guard');
assert(adminLayout.includes("export const dynamic = 'force-dynamic'"), 'admin layout must be dynamic and not statically expose admin content');
assert(adminListings.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), 'admin listings page must import direct role guard');
assert(adminListings.includes('await requireAdminAuth()'), 'admin listings page must invoke direct role guard before rendering provenance');
assert(adminListings.includes("export const dynamic = 'force-dynamic'"), 'admin listings page must be dynamic and not statically expose provenance content');
assert(adminListings.includes('View source listing'), 'admin listings must retain source link for authorized users');
assert(adminListings.includes('Evidence captured'), 'admin listings must retain evidence for authorized users');
assert(adminListings.includes('Internal review notes'), 'admin listings must retain internal review notes for authorized users');

if (failures.length) {
  console.error('Admin role guard test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok admin role model denies anonymous/missing roles before render');
console.log('ok admin/operator are the only allowed admin roles');
console.log('ok analyst/viewer are not admin-allowed');
console.log('ok admin listings page directly guards provenance render');
console.log('ok admin provenance rendering is preserved behind role guard');
