#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const roleHelper = readFileSync('lib/auth/adminRoles.ts', 'utf8');
const guard = readFileSync('lib/auth/adminGuard.ts', 'utf8');
const adminLayout = readFileSync('app/admin/(protected)/layout.tsx', 'utf8');
const adminLogin = readFileSync('lib/auth/adminLogin.ts', 'utf8');
const adminLoginRoute = readFileSync('app/admin/login/submit/route.ts', 'utf8');
const adminListings = readFileSync('app/admin/(protected)/listings/page.tsx', 'utf8');
const adminInquiries = readFileSync('app/admin/(protected)/inquiries/page.tsx', 'utf8');
const adminInquiryDetail = readFileSync('app/admin/(protected)/inquiries/[id]/page.tsx', 'utf8');
const adminRoot = readFileSync('app/admin/(protected)/page.tsx', 'utf8');
const adminSources = readFileSync('app/admin/(protected)/sources/page.tsx', 'utf8');
const adminSourcesNew = readFileSync('app/admin/(protected)/sources/new/page.tsx', 'utf8');
const adminCandidates = readFileSync('app/admin/(protected)/candidates/page.tsx', 'utf8');
const adminCandidateDetail = readFileSync('app/admin/(protected)/candidates/[id]/page.tsx', 'utf8');
const adminHub = readFileSync('app/admin/(protected)/hub/page.tsx', 'utf8');
const adminHubApi = readFileSync('app/api/admin/hub/context/route.ts', 'utf8');

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

assert(!guard.includes('HARBOURVIEW_ADMIN_REVIEW_ENABLED'), 'route auth must not depend on the admin review data-plane flag');
assert(guard.includes('/auth/v1/user'), 'admin guard must verify Supabase Auth user');
assert(guard.includes('/rest/v1/user_roles'), 'admin guard must read user_roles');
assert(guard.includes('hasAdminRole(roles)'), 'admin guard must enforce allowed roles');
assert(!guard.includes('notFound'), 'admin guard must not hide auth failures as a missing route');
assert(guard.includes('unauthorized()'), 'missing or invalid tokens must receive explicit unauthenticated denial');
assert(guard.includes('forbidden()'), 'valid non-admin roles must receive explicit forbidden denial');
assert(adminLayout.includes('await requireAdminAuth()'), 'admin layout must invoke server-side role guard');
assert(adminLayout.includes("export const dynamic = 'force-dynamic'"), 'admin layout must be dynamic and not statically expose admin content');
assert(adminListings.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), 'admin listings page must import direct role guard');
assert(adminListings.includes('await requireAdminAuth()'), 'admin listings page must invoke direct role guard before rendering provenance');
assert(adminListings.includes("export const dynamic = 'force-dynamic'"), 'admin listings page must be dynamic and not statically expose provenance content');
assert(adminListings.includes('View source listing'), 'admin listings must retain source link for authorized users');
assert(adminListings.includes('Evidence captured'), 'admin listings must retain evidence for authorized users');
assert(adminListings.includes('Internal review notes'), 'admin listings must retain internal review notes for authorized users');
assert(adminInquiries.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), 'admin inquiries page must import direct role guard');
assert(adminInquiries.includes('await requireAdminAuth()'), 'admin inquiries page must invoke direct role guard before rendering workflow fields');
assert(adminInquiryDetail.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), 'admin inquiry detail page must import direct role guard');
assert(adminInquiryDetail.includes('await requireAdminAuth()'), 'admin inquiry detail page must invoke direct role guard before rendering workflow fields');
assert(adminRoot.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), 'admin root page must import direct role guard before redirecting');
assert(adminRoot.includes('await requireAdminAuth()'), 'admin root page must invoke direct role guard before redirecting');
for (const [name, content] of [
  ['admin sources', adminSources],
  ['admin source intake', adminSourcesNew],
  ['admin candidates', adminCandidates],
  ['admin candidate detail', adminCandidateDetail],
  ['admin hub', adminHub],
]) {
  assert(content.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), `${name} page must import direct role guard`);
  assert(content.includes('await requireAdminAuth()'), `${name} page must invoke direct role guard before rendering private source/candidate fields`);
}
assert(adminHub.includes("export const dynamic = 'force-dynamic'"), 'admin hub page must be dynamic and not statically expose internal context');
assert(adminHubApi.includes("import { getAdminAuthCheck } from '@/lib/auth/adminGuard'"), 'admin hub API must import the existing admin auth check');
assert(adminHubApi.includes('await getAdminAuthCheck()'), 'admin hub API must enforce admin/operator auth before returning internal context');
assert(adminLogin.includes('/auth/v1/token?grant_type=password'), 'admin login must authenticate with Supabase Auth password flow');
assert(adminLogin.includes('/rest/v1/user_roles'), 'admin login must check user_roles before setting a session');
assert(adminLogin.includes('hasAdminRole'), 'admin login must allow only admin/operator roles');
assert(!adminLogin.includes('SUPABASE_SERVICE_ROLE_KEY'), 'admin login must not use the service-role key');
assert(adminLoginRoute.includes('httpOnly: true'), 'admin login route must set an HttpOnly session cookie');
assert(adminLoginRoute.includes('secure: true'), 'admin login route must set a Secure session cookie');
assert(adminLoginRoute.includes("sameSite: 'lax'"), 'admin login session cookie must use SameSite=Lax');
assert(adminLoginRoute.includes("path: '/'"), 'admin login session cookie must be available at the admin route path');
assert(adminLoginRoute.includes('ADMIN_SESSION_MAX_AGE_SECONDS'), 'admin login session cookie must use an explicit max age');
assert(guard.includes('ADMIN_SESSION_COOKIE_NAME'), 'admin guard must read the same named cookie that login sets');
assert(/if \(!result\.ok\)[\s\S]*response\.cookies\.set\(ADMIN_SESSION_COOKIE_NAME, '',[\s\S]*maxAge: 0,[\s\S]*return response/.test(adminLoginRoute), 'failed admin login must expire the existing admin session cookie before redirect');

if (failures.length) {
  console.error('Admin role guard test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok admin role model denies anonymous/missing roles with explicit auth interruptions');
console.log('ok admin/operator are the only allowed admin roles');
console.log('ok analyst/viewer are not admin-allowed');
console.log('ok admin listings page directly guards provenance render');
console.log('ok admin inquiry pages directly guard workflow render');
console.log('ok admin source, candidate and hub pages directly guard private render');
console.log('ok admin hub API uses existing admin/operator guard');
console.log('ok admin provenance rendering is preserved behind role guard');
console.log('ok admin login establishes only admin/operator HttpOnly sessions');
console.log('ok failed admin login expires stale admin session cookie');
