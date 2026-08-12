import fs from 'node:fs/promises';
import path from 'node:path';

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const primaryBaseUrl = cleanBaseUrl(process.env.PRIMARY_BASE_URL || 'https://harbourview.vercel.app');
const secondaryBaseUrl = cleanBaseUrl(process.env.SECONDARY_BASE_URL || 'https://harbourview-platform.vercel.app');
const includeSecondary = String(process.env.INCLUDE_SECONDARY || 'false').toLowerCase() === 'true';
const expectedCommit = process.env.EXPECTED_COMMIT || '';

const publicRoutes = [
  {
    route: '/',
    requiredAny: [
      'market access backed by intelligence and relationships',
      'commercial intelligence',
      'harbourview network',
      'regulated cannabis market routing',
      'reviewed intelligence',
    ],
  },
  {
    route: '/marketplace',
    requiredAny: [
      'harbourview network',
      'controlled commercial network',
      'regulated cannabis',
      'controlled access',
    ],
  },
  {
    route: '/intelligence',
    requiredAny: [
      'intelligence',
      'reviewed signal',
      'country',
      'market access',
    ],
  },
  {
    route: '/signals',
    requiredAny: [
      'signals',
      'reviewed signal',
      'market signal',
      'commercial intelligence',
    ],
  },
  {
    route: '/about',
    requiredAny: [
      'about harbourview',
      'commercial intelligence',
      'relationships',
      'market access',
    ],
  },
  {
    route: '/contact',
    requiredAny: [
      'contact',
      'confidential',
      'inquiry',
      'harbourview',
    ],
  },
  {
    route: '/intake',
    requiredAny: [
      'confidential',
      'discussion',
      'intake',
      'harbourview',
    ],
  },
  {
    route: '/marketplace/sell',
    requiredAny: [
      'submit',
      'opportunity',
      'listing',
      'review',
    ],
  },
  {
    route: '/marketplace/wanted',
    requiredAny: [
      'wanted',
      'request',
      'buyer',
      'review',
    ],
  },
];

const adminRoute = '/admin';

const controlledAccessAny = [
  'harbourview network',
  'controlled access',
  'controlled commercial network',
  'commercial intelligence',
  'qualified introduction',
  'qualified introductions',
  'reviewed',
  'confidential',
  'private',
  'market access backed by intelligence and relationships',
  'regulated cannabis',
];

const forbiddenLeakageStrings = [
  'View source listing',
  'sourceUrl',
  'sourceName',
  'Evidence captured',
  'provenanceSummary',
  'sourceEvidence',
  'verificationStatus',
  'availabilityStatus',
  'sellerAuthorizationStatus',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
];

const legacyMarketplaceStrings = [
  'verified supplier marketplace',
  'verified suppliers',
  'trusted suppliers',
  'direct seller contact',
  'contact the seller directly',
  'open marketplace',
  'real-time buyer network',
  'active deal flow',
  'guaranteed route',
  'confirmed buyers',
  'exclusive access',
];

const allowedLegacyContexts = new Map([
  ['open marketplace', ['open marketplace exposure']],
]);

const adminDeniedAny = [
  'unauthorized',
  'forbidden',
  'access denied',
  'admin access required',
  'sign in',
  'log in',
  'login',
  'not authorized',
];

const bases = [
  { label: 'primary', baseUrl: primaryBaseUrl },
  ...(includeSecondary ? [{ label: 'secondary', baseUrl: secondaryBaseUrl }] : []),
];

const evidence = {
  verdict: 'PENDING',
  generatedAt: new Date().toISOString(),
  runId,
  expectedCommit,
  includeSecondary,
  bases: bases.map((base) => base.baseUrl),
  publicRoutes: [],
  adminRoutes: [],
  failures: [],
};

for (const base of bases) {
  for (const routeSpec of publicRoutes) {
    const result = await verifyPublicRoute(base, routeSpec);
    evidence.publicRoutes.push(result);
    if (!result.passed) evidence.failures.push(...result.failures.map((failure) => `${base.label} ${routeSpec.route}: ${failure}`));
  }

  const adminResult = await verifyAdminDenied(base);
  evidence.adminRoutes.push(adminResult);
  if (!adminResult.passed) evidence.failures.push(...adminResult.failures.map((failure) => `${base.label} ${adminRoute}: ${failure}`));
}

evidence.verdict = evidence.failures.length === 0 ? 'PRODUCTION VERIFIED' : 'HOLD';

await fs.mkdir('verification-results/production', { recursive: true });
await fs.writeFile(
  'verification-results/production/production-verification.json',
  `${JSON.stringify(evidence, null, 2)}\n`,
);
await fs.writeFile(
  'verification-results/production/production-verification.md',
  renderMarkdown(evidence),
);

console.log(evidence.verdict);
if (evidence.failures.length > 0) {
  for (const failure of evidence.failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}

async function verifyPublicRoute(base, routeSpec) {
  const url = buildCacheBustedUrl(base.baseUrl, routeSpec.route);
  const fetched = await fetchText(url, { redirect: 'follow' });
  const html = fetched.text || '';
  const normalized = normalize(html);
  const lowerRequiredAny = routeSpec.requiredAny.map((term) => term.toLowerCase());
  const failures = [];

  if (!fetched.ok) failures.push(`HTTP fetch failed with status ${fetched.status}`);
  if (!normalized.includes('harbourview')) failures.push('Missing Harbourview brand text');

  if (!lowerRequiredAny.some((term) => normalized.includes(term))) {
    failures.push(`Missing route-specific expected copy. Expected one of: ${routeSpec.requiredAny.join(' | ')}`);
  }

  if (!controlledAccessAny.some((term) => normalized.includes(term.toLowerCase()))) {
    failures.push(`Missing controlled-access / current-positioning copy. Expected one of: ${controlledAccessAny.join(' | ')}`);
  }

  const leakageHits = forbiddenLeakageStrings.filter((term) => containsInsensitive(html, term));
  if (leakageHits.length > 0) failures.push(`Forbidden leakage strings present: ${leakageHits.join(', ')}`);

  const legacyHits = legacyMarketplaceStrings.filter((term) => containsUnapprovedLegacyClaim(normalized, term));
  if (legacyHits.length > 0) failures.push(`Legacy / overbroad marketplace copy present: ${legacyHits.join(', ')}`);

  return {
    baseLabel: base.label,
    baseUrl: base.baseUrl,
    route: routeSpec.route,
    url,
    status: fetched.status,
    finalUrl: fetched.finalUrl,
    contentLength: html.length,
    passed: failures.length === 0,
    failures,
  };
}

async function verifyAdminDenied(base) {
  const url = buildCacheBustedUrl(base.baseUrl, adminRoute);
  const fetched = await fetchText(url, { redirect: 'manual' });
  const html = fetched.text || '';
  const normalized = normalize(html);
  const location = fetched.headers?.location || fetched.headers?.Location || '';
  const locationLower = String(location).toLowerCase();
  const failures = [];

  const deniedByStatus = [401, 403, 404].includes(fetched.status);
  const deniedByRedirect = fetched.status >= 300 && fetched.status < 400 && ['login', 'sign-in', 'signin', 'auth', 'unauthorized'].some((term) => locationLower.includes(term));
  const deniedByCopy = adminDeniedAny.some((term) => normalized.includes(term));

  if (!deniedByStatus && !deniedByRedirect && !deniedByCopy) {
    failures.push(`Anonymous /admin was not clearly denied. Status ${fetched.status}, location ${location || 'none'}`);
  }

  const leakageHits = forbiddenLeakageStrings.filter((term) => containsInsensitive(html, term));
  if (leakageHits.length > 0) failures.push(`Forbidden leakage strings present on /admin response: ${leakageHits.join(', ')}`);

  return {
    baseLabel: base.label,
    baseUrl: base.baseUrl,
    route: adminRoute,
    url,
    status: fetched.status,
    location,
    finalUrl: fetched.finalUrl,
    contentLength: html.length,
    denied: deniedByStatus || deniedByRedirect || deniedByCopy,
    passed: failures.length === 0,
    failures,
  };
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        pragma: 'no-cache',
        'user-agent': 'HarbourviewProductionVerification/1.0',
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    return {
      ok: response.ok || (response.status >= 300 && response.status < 400),
      status: response.status,
      finalUrl: response.url,
      headers,
      text,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      headers: {},
      text: '',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildCacheBustedUrl(baseUrl, route) {
  const url = new URL(route, `${baseUrl}/`);
  url.searchParams.set('hv_verify', runId);
  url.searchParams.set('ts', String(Date.now()));
  return url.toString();
}

function cleanBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function containsInsensitive(text, term) {
  return normalize(text).includes(String(term).toLowerCase());
}

function containsUnapprovedLegacyClaim(normalizedText, term) {
  const normalizedTerm = String(term).toLowerCase();
  if (!normalizedText.includes(normalizedTerm)) return false;

  let remaining = normalizedText;
  for (const allowedContext of allowedLegacyContexts.get(normalizedTerm) || []) {
    remaining = remaining.replaceAll(allowedContext.toLowerCase(), '');
  }
  return remaining.includes(normalizedTerm);
}

function normalize(text) {
  return String(text || '')
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\u0026/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function renderMarkdown(report) {
  const lines = [];
  lines.push(`# Harbourview Production Verification`);
  lines.push('');
  lines.push(`Verdict: **${report.verdict}**`);
  lines.push(`Generated: ${report.generatedAt}`);
  if (report.expectedCommit) lines.push(`Expected commit: \`${report.expectedCommit}\``);
  lines.push(`Run ID: \`${report.runId}\``);
  lines.push('');
  lines.push(`Base URLs: ${report.bases.map((base) => `\`${base}\``).join(', ')}`);
  lines.push('');
  lines.push('## Public route checks');
  lines.push('');
  lines.push('| Base | Route | Status | Result | URL |');
  lines.push('| --- | --- | ---: | --- | --- |');
  for (const route of report.publicRoutes) {
    lines.push(`| ${route.baseLabel} | \`${route.route}\` | ${route.status} | ${route.passed ? 'PASS' : 'FAIL'} | ${route.url} |`);
  }
  lines.push('');
  lines.push('## Admin denial checks');
  lines.push('');
  lines.push('| Base | Route | Status | Denied | Result |');
  lines.push('| --- | --- | ---: | --- | --- |');
  for (const route of report.adminRoutes) {
    lines.push(`| ${route.baseLabel} | \`${route.route}\` | ${route.status} | ${route.denied ? 'YES' : 'NO'} | ${route.passed ? 'PASS' : 'FAIL'} |`);
  }
  lines.push('');
  lines.push('## Failures');
  lines.push('');
  if (report.failures.length === 0) {
    lines.push('None.');
  } else {
    for (const failure of report.failures) lines.push(`- ${failure}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}
