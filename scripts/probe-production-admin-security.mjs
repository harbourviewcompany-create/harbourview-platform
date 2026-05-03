#!/usr/bin/env node
const DEFAULT_BASE_URL = 'https://harbourview-platform.vercel.app';
const rawBaseUrl = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || DEFAULT_BASE_URL;
const baseUrl = (rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`).replace(/\/$/, '');

const adminRoutes = [
  '/admin',
  '/admin/listings',
  '/admin/inquiries',
];

const forbiddenAdminStrings = [
  'Authenticated admin/operator workspace',
  'Admin Review',
  'View source listing',
  'Evidence captured',
  'Internal review notes',
  'Source intelligence',
  'sourceUrl',
  'sourceName',
  'provenanceSummary',
  'sourceEvidence',
  'internalReviewNotes',
];

const failures = [];
const results = [];

async function checkAdminAnonymousDenied(route) {
  const response = await fetch(`${baseUrl}${route}`, {
    redirect: 'manual',
    headers: {
      Accept: 'text/html',
      'User-Agent': 'HarbourviewAdminSecurityProbe/1.0',
    },
  });
  const html = await response.text();
  const leaked = forbiddenAdminStrings.filter((value) => value && html.includes(value));
  const denied = response.status === 404 || response.status === 401 || response.status === 403 || response.status === 307 || response.status === 308;

  results.push({
    route,
    status: response.status,
    denied,
    bytes: html.length,
    leaked,
  });

  if (!denied) failures.push(`${route} anonymous request returned HTTP ${response.status}, expected denial/not-found/redirect`);
  for (const match of leaked) failures.push(`${route} leaked protected admin marker to anonymous user: ${match}`);
}

for (const route of adminRoutes) {
  await checkAdminAnonymousDenied(route);
}

const result = {
  baseUrl,
  checkedAt: new Date().toISOString(),
  adminAnonymousDenied: results,
};

console.log(JSON.stringify(result, null, 2));

if (failures.length) {
  console.error('Production admin security probe failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok production admin routes deny anonymous users without leaking protected admin markers');
