#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const workflow = readFileSync('lib/marketplace/inquiryWorkflow.ts', 'utf8');
const updateAction = readFileSync('app/actions/updateInquiryStatus.ts', 'utf8');
const listPage = readFileSync('app/admin/(protected)/inquiries/page.tsx', 'utf8');
const detailPage = readFileSync('app/admin/(protected)/inquiries/[id]/page.tsx', 'utf8');
const workflowRoute = readFileSync('app/admin/(protected)/inquiries/[id]/workflow/route.ts', 'utf8');
const migration = readFileSync('supabase/migrations/006_marketplace_conversion_v1.sql', 'utf8');
const notification = readFileSync('lib/marketplace/notification.ts', 'utf8');
const captureRoute = readFileSync('app/api/marketplace/capture/route.ts', 'utf8');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const column of ['review_status', 'priority', 'last_contacted_at', 'next_follow_up_at', 'internal_response_notes']) {
  assert(migration.includes(`add column if not exists ${column}`), `migration must add ${column} safely`);
  assert(detailPage.includes(column), `admin inquiry detail must render ${column}`);
}
for (const column of ['review_status', 'priority', 'last_contacted_at', 'next_follow_up_at']) {
  assert(listPage.includes(column), `admin inquiry list must render ${column}`);
}

assert(migration.includes('marketplace_inquiries_review_status_check'), 'migration must add review status check');
assert(migration.includes('marketplace_inquiries_priority_check'), 'migration must add priority check');
assert(updateAction.includes('await requireAdminAuth()'), 'workflow update must require admin/operator auth');
assert(updateAction.includes('getAdminDataClient()'), 'workflow update must use server-side admin data client');
assert(!updateAction.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), 'workflow update must not use anon credentials');
assert(workflowRoute.includes('applyInquiryWorkflowUpdate'), 'workflow route must use guarded workflow updater');
assert(detailPage.includes('/workflow'), 'detail workflow form must post to the protected workflow route');
assert(updateAction.includes("reviewStatus === 'contacted' && !current.last_contacted_at"), 'contacted status must set first-contact timestamp only when empty');
assert(updateAction.includes('markContactedNow'), 'workflow update must support explicit mark-contacted-now action');

for (const status of ['received', 'reviewing', 'contacted', 'qualified', 'not_fit', 'closed']) {
  assert(workflow.includes(`'${status}'`), `workflow must define status ${status}`);
}
for (const priority of ['high', 'medium', 'low']) {
  assert(workflow.includes(`'${priority}'`), `workflow must define priority ${priority}`);
}
assert(workflow.includes('getPriorityRank'), 'workflow must expose priority ranking');
assert(listPage.includes('getPriorityRank(a.priority) - getPriorityRank(b.priority)'), 'admin list must sort high, medium, low');
assert(listPage.includes('new Date(a.created_at).getTime() - new Date(b.created_at).getTime()'), 'admin list must sort oldest first within priority');

for (const label of ['Listing submission', 'Wanted request', 'Quote/general inquiry', 'Not fit']) {
  assert(workflow.includes(label), `response template label missing: ${label}`);
  assert(detailPage.includes('responseTemplates.map'), 'detail page must render response templates');
}
for (const subject of [
  'Harbourview marketplace listing received',
  'Harbourview wanted request received',
  'Harbourview inquiry received',
  'Harbourview inquiry review',
]) {
  assert(workflow.includes(subject), `response template subject missing: ${subject}`);
}

assert(notification.includes('HARBOURVIEW_MARKETPLACE_NOTIFY_EMAIL'), 'notification must use HARBOURVIEW_MARKETPLACE_NOTIFY_EMAIL');
assert(notification.includes('MISSING_NOTIFICATION_PROVIDER'), 'notification must report missing provider safely');
assert(captureRoute.includes('notifyMarketplaceInquiry'), 'server capture route must notify after successful capture');
assert(captureRoute.includes("Prefer: 'return=minimal'"), 'server capture route must preserve insert-only RLS behavior');

if (failures.length) {
  console.error('Marketplace conversion workflow test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok conversion migration adds workflow fields and constraints');
console.log('ok admin/operator workflow updates are server-only and role guarded');
console.log('ok high priority sorts before medium and low, then oldest first');
console.log('ok admin response templates render for listing, wanted, quote/general and not-fit');
console.log('ok notification path is safe and does not weaken capture');
