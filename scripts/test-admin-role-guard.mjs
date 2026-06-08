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
const adminHub = readFileSync('app/admin/(protected)/hub/page.tsx', 'utf8');
const adminDealDashboard = readFileSync('app/admin/(protected)/deal-dashboard/page.tsx', 'utf8');
const dealflowRoute = readFileSync('app/api/genetics-routing/dealflow/route.ts', 'utf8');
const geneticsActionsRoute = readFileSync('app/api/genetics-routing/actions/route.ts', 'utf8');
const geneticsOperationsRoute = readFileSync('app/api/genetics-routing/operations/route.ts', 'utf8');
const adminSources = readFileSync('app/admin/(protected)/sources/page.tsx', 'utf8');
const adminSourcesNew = readFileSync('app/admin/(protected)/sources/new/page.tsx', 'utf8');
const adminCandidates = readFileSync('app/admin/(protected)/candidates/page.tsx', 'utf8');
const adminCandidateDetail = readFileSync('app/admin/(protected)/candidates/[id]/page.tsx', 'utf8');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertGuardedPage(name, content) {
  assert(content.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), `${name} page must import direct role guard`);
  assert(content.includes('await requireAdminAuth()'), `${name} page must invoke direct role guard before rendering private fields`);
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
assert(adminLayout.includes('href="/admin/hub"'), 'admin layout must link to dashboard hub');
assert(adminLayout.includes('href="/admin/deal-dashboard"'), 'admin layout must link to deal dashboard');
assert(adminRoot.includes("redirect('/admin/hub')"), 'admin root must redirect to /admin/hub');
assertGuardedPage('admin root', adminRoot);
assertGuardedPage('admin hub', adminHub);
assertGuardedPage('admin listings', adminListings);
assertGuardedPage('admin inquiries', adminInquiries);
assertGuardedPage('admin inquiry detail', adminInquiryDetail);
assertGuardedPage('admin deal dashboard', adminDealDashboard);
assert(adminDealDashboard.includes("export const dynamic = 'force-dynamic'"), 'admin deal dashboard page must be dynamic and not statically expose service-role-backed content');
assert(adminDealDashboard.includes('DealDashboardClient'), 'admin deal dashboard page must preserve existing dashboard client render');
assert(adminListings.includes("export const dynamic = 'force-dynamic'"), 'admin listings page must be dynamic and not statically expose provenance content');
for (const [name, content] of [
  ['admin sources', adminSources],
  ['admin source intake', adminSourcesNew],
  ['admin candidates', adminCandidates],
  ['admin candidate detail', adminCandidateDetail],
]) {
  assertGuardedPage(name, content);
}
assert(dealflowRoute.includes("import { requireAdminAuth } from '@/lib/auth/adminGuard'"), 'dealflow mutation route must import admin guard');
assert(dealflowRoute.includes('await requireAdminAuth()'), 'dealflow mutation route must require admin auth before service-role client creation');
assert(dealflowRoute.indexOf('await requireDealflowAdminAuth()') < dealflowRoute.indexOf('const client = getClient()'), 'dealflow route must authenticate before creating service-role client');
assert(dealflowRoute.includes("{ error: 'unauthorized' }, { status: 401 }"), 'dealflow route must return explicit 401 JSON');
assert(dealflowRoute.includes("{ error: 'forbidden' }, { status: 403 }"), 'dealflow route must return explicit 403 JSON');
assert(dealflowRoute.includes("{ error: 'invalid_record_id' }, { status: 400 }"), 'dealflow route must validate recordId with explicit 400 JSON');
assert(dealflowRoute.includes("{ error: 'invalid_action' }, { status: 400 }"), 'dealflow route must validate action with explicit 400 JSON');
assert(dealflowRoute.includes("{ error: 'record_not_found' }, { status: 404 }"), 'dealflow route must return explicit 404 JSON');
assert(dealflowRoute.includes("{ error: 'admin_data_client_unconfigured' }, { status: 500 }"), 'dealflow route must return explicit 500 JSON for missing admin data config');
for (const action of ['mark_engaged', 'mark_negotiating', 'mark_won', 'mark_lost']) {
  assert(dealflowRoute.includes(`'${action}'`), `dealflow route must preserve ${action} action`);
}
assert(!dealflowRoute.includes("'mark_introduced'"), 'dealflow route must not expose an unrendered mark_introduced mutation action');
assert(!dealflowRoute.includes("'archive'"), 'dealflow route must not expose an unrendered archive mutation action');
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
assert(adminLoginRoute.includes('enforceRateLimit'), 'admin login route must apply route-local throttling');
assert(adminLoginRoute.includes('isSameOriginFormPost'), 'admin login route must enforce same-origin form posts');
assert(adminLoginRoute.includes('rate_limited'), 'admin login route must return a rate-limited state');
assert(adminLoginRoute.includes('expireAdminCookie'), 'failed admin login must expire the existing admin session cookie before redirect');
for (const [name, content] of [
  ['genetics actions route', geneticsActionsRoute],
  ['genetics operations route', geneticsOperationsRoute],
]) {
  assert(content.includes("import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'"), `${name} must import admin API auth helper`);
  assert(content.includes('await requireAdminApiAuth()'), `${name} must require admin auth before service-role client creation`);
  assert(content.indexOf('await requireAdminApiAuth()') < content.indexOf('const client = getClient()'), `${name} must authenticate before creating service-role client`);
  assert(content.includes("{ error: 'unauthorized' }, { status: 401 }") || readFileSync('lib/auth/adminApiAuth.ts', 'utf8').includes("{ error: 'unauthorized' }, { status: 401 }"), `${name} must return explicit 401 JSON`);
  assert(content.includes("{ error: 'invalid_record_id' }, { status: 400 }"), `${name} must validate recordId`);
  assert(content.includes("{ error: 'admin_data_client_unconfigured' }, { status: 500 }"), `${name} must fail closed when admin data config is absent`);
}

if (failures.length) {
  console.error('Admin role guard test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok admin role model denies anonymous/missing roles with explicit auth interruptions');
console.log('ok admin/operator are the only allowed admin roles');
console.log('ok analyst/viewer are not admin-allowed');
console.log('ok admin root redirects to protected dashboard hub');
console.log('ok admin hub, inquiries, listings, deal dashboard, sources and candidates directly guard private render');
console.log('ok admin nav links include dashboard hub and deal dashboard');
console.log('ok dealflow mutation route authenticates before service-role access');
console.log('ok dealflow route returns explicit 401/403/400/404/500 JSON states');
console.log('ok dealflow route preserves rendered dashboard actions only');
console.log('ok admin login establishes only admin/operator HttpOnly sessions');
console.log('ok failed admin login expires stale admin session cookie');
console.log('ok admin login applies same-origin and rate-limit controls');
console.log('ok genetics actions and operations routes authenticate before service-role access');
