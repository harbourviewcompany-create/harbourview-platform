import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FORBIDDEN = [
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

const SEED_PAGE_ROUTES = [
  '/',
  '/network',
  '/opportunities',
  '/intelligence',
  '/signals',
  '/compliance',
  '/network/clinical-education',
  '/contact',
  '/intake',
  '/marketplace',
  '/marketplace/listings',
  '/marketplace/wanted',
  '/marketplace/sell',
  '/intelligence/country-briefs',
  '/intelligence/licensing-pathways',
  '/intelligence/regulatory-pathways',
  '/intelligence/counterparty-intelligence',
  '/intelligence/logistics-trade-routes',
  '/education',
  '/policy-standards',
  '/assessments',
  '/institutional-partnerships',
  '/trust-governance',
  '/about',
  '/legal/privacy',
  '/legal/terms',
  '/admin',
];

const DEFAULT_DOMAINS = [
  'https://harbourview.vercel.app',
  'https://harbourview-14bdr4iuk-harbourviewnetwork.vercel.app',
];

function normalizeOrigin(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).origin.replace(/\/$/, '');
  } catch {
    return trimmed.replace(/\/$/, '');
  }
}

function normalizeRoute(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '/') return '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.length > 1 ? withSlash.replace(/\/$/, '') : withSlash;
}

const domains = (process.env.HARBOURVIEW_SCAN_DOMAINS || DEFAULT_DOMAINS.join(','))
  .split(',')
  .map((value) => normalizeOrigin(value))
  .filter(Boolean);

const protectedDomains = new Set(
  (process.env.HARBOURVIEW_PROTECTED_DOMAINS || DEFAULT_DOMAINS[1])
    .split(',')
    .map((value) => normalizeOrigin(value))
    .filter(Boolean),
);

const extraApiGetRoutes = (process.env.HARBOURVIEW_EXTRA_API_GET_ROUTES || '')
  .split(',')
  .map((value) => normalizeRoute(value))
  .filter((value) => value.startsWith('/api'));

const expectedCommit = process.env.HARBOURVIEW_EXPECTED_COMMIT || '2ee3105e236122083d3fb86a16ca3c8811cce440';
const deploymentId = process.env.HARBOURVIEW_DEPLOYMENT_ID || 'FRHiKm5k7';
const maxDiscoveredRoutes = Number(process.env.HARBOURVIEW_SCAN_MAX_DISCOVERED_ROUTES || 120);
const fetchTimeoutMs = Number(process.env.HARBOURVIEW_SCAN_FETCH_TIMEOUT_MS || 15_000);
const outDir = process.env.HARBOURVIEW_SCAN_OUT_DIR || 'artifacts/production-artifact-scan';

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function findForbidden(text) {
  return FORBIDDEN.filter((needle) => text.includes(needle));
}

async function walkFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolute)));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

function routeFromAppFile(file, appDir) {
  const relativeDir = path.relative(appDir, path.dirname(file));
  if (!relativeDir || relativeDir === '.') return '/';

  const routeParts = [];
  for (const part of relativeDir.split(path.sep).filter(Boolean)) {
    if (part.startsWith('@')) continue;
    if (part.startsWith('(') && part.endsWith(')')) continue;
    if (part.startsWith('[') || part.includes(']')) return null;
    routeParts.push(part);
  }

  return normalizeRoute(routeParts.join('/'));
}

function hasGetExport(source) {
  return /export\s+(?:async\s+)?function\s+GET\s*\(/.test(source)
    || /export\s+const\s+GET\s*=/.test(source)
    || /export\s*\{[^}]*\bGET\b[^}]*\}/.test(source);
}

async function discoverSourceManifest() {
  const appDir = path.join(process.cwd(), 'app');
  const files = await walkFiles(appDir);
  const sourcePageRoutes = new Set();
  const sourceApiGetRoutes = new Set();
  const skippedDynamicRoutes = [];

  for (const file of files) {
    const name = path.basename(file);
    if (/^page\.(?:js|jsx|ts|tsx|mdx)$/.test(name)) {
      const route = routeFromAppFile(file, appDir);
      if (route) sourcePageRoutes.add(route);
      else skippedDynamicRoutes.push(path.relative(process.cwd(), file));
      continue;
    }

    if (/^route\.(?:js|ts)$/.test(name)) {
      const route = routeFromAppFile(file, appDir);
      if (!route || !route.startsWith('/api')) {
        if (!route) skippedDynamicRoutes.push(path.relative(process.cwd(), file));
        continue;
      }
      const source = await readFile(file, 'utf8');
      if (hasGetExport(source)) sourceApiGetRoutes.add(route);
    }
  }

  for (const route of extraApiGetRoutes) sourceApiGetRoutes.add(route);

  return {
    seedPageRoutes: [...SEED_PAGE_ROUTES].sort(),
    sourcePageRoutes: Array.from(sourcePageRoutes).sort(),
    sourceApiGetRoutes: Array.from(sourceApiGetRoutes).sort(),
    extraApiGetRoutes: Array.from(new Set(extraApiGetRoutes)).sort(),
    skippedDynamicRoutes: skippedDynamicRoutes.sort(),
  };
}

function addRouteOrigin(origins, route, origin) {
  const normalized = normalizeRoute(route);
  if (!origins.has(normalized)) origins.set(normalized, new Set());
  origins.get(normalized).add(origin);
}

function routeOriginString(origins, route) {
  return Array.from(origins.get(normalizeRoute(route)) || []).sort().join(',');
}

function extractInternalLinks(baseUrl, text) {
  const links = new Set();
  const patterns = [
    /href=["']([^"'#?]+)(?:[?#][^"']*)?["']/g,
    /\\"href\\":\\"([^\\"#?]+)(?:[?#][^\\"]*)?\\"/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[1]
        .replaceAll('\\/', '/')
        .replaceAll('\\u0026', '&')
        .trim();
      if (!raw || raw.startsWith('mailto:') || raw.startsWith('tel:')) continue;
      try {
        const url = new URL(raw, baseUrl);
        const origin = new URL(baseUrl).origin;
        if (url.origin !== origin) continue;
        if (url.pathname.startsWith('/_next/')) continue;
        if (url.pathname.includes('/api/')) continue;
        links.add(normalizeRoute(url.pathname));
      } catch {
        // Ignore malformed links; this is a verifier, not a parser.
      }
    }
  }
  return links;
}

function extractScriptChunks(baseUrl, text) {
  const chunks = new Set();
  const patterns = [
    /src=["']([^"']*\/_next\/static\/chunks\/[^"']+\.js)["']/g,
    /href=["']([^"']*\/_next\/static\/chunks\/[^"']+\.js)["']/g,
    /\\"(\/_next\/static\/chunks\/[^\\"]+\.js)\\"/g,
    /static\/chunks\/([^"'\\]+\.js)/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      let raw = match[1];
      if (pattern.source.startsWith('static')) raw = `/_next/static/chunks/${raw}`;
      raw = raw.replaceAll('\\/', '/').trim();
      try {
        chunks.add(new URL(raw, baseUrl).toString());
      } catch {
        // Ignore malformed chunk references.
      }
    }
  }
  return chunks;
}

async function fetchText(url) {
  const startedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'harbourview-production-artifact-scan/1.2 verification-only',
        accept: 'text/html,application/json,text/plain,application/javascript,*/*;q=0.8',
      },
    });
    const text = await response.text();
    return {
      ok: true,
      requestedUrl: url,
      finalUrl: response.url,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type') || '',
      byteCount: Buffer.byteLength(text, 'utf8'),
      sha256: sha256(text),
      text,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      requestedUrl: url,
      finalUrl: url,
      status: 0,
      statusText: 'FETCH_ERROR',
      contentType: '',
      byteCount: 0,
      sha256: '',
      text: '',
      error: error instanceof Error ? error.message : String(error),
      startedAt,
      completedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function classifyAdminDenial(route, text, status) {
  if (route !== '/admin') return '';
  const hasDeniedCopy = text.includes('Admin sign-in required') || text.includes('Admin access restricted');
  const hasProtectedAdminContent = text.includes('Admin dashboard')
    || text.includes('Operator console')
    || text.includes('Review queue')
    || text.includes('Approve listing')
    || text.includes('Reject listing');
  if ((status === 401 || status === 403) && !hasProtectedAdminContent) return 'PASS_HTTP_DENIED';
  if (hasDeniedCopy && !hasProtectedAdminContent) return 'PASS_DENIED_COPY';
  if (hasProtectedAdminContent) return 'FAIL_ADMIN_CONTENT_VISIBLE';
  return 'UNKNOWN_NO_DENIAL_COPY';
}

function classifyExpectedStatus({ kind, domain, route, result, adminDenial }) {
  if (result.status === 0) {
    return ['FAIL_FETCH_ERROR', false, result.error || 'fetch failed before HTTP response'];
  }

  if (protectedDomains.has(normalizeOrigin(domain)) && (result.status === 401 || result.status === 403)) {
    return ['EXPECTED_PROTECTED_DOMAIN_401_403', true, '401/403 allowed only for the configured protected secondary deployment domain'];
  }

  if ((kind === 'page' || kind === 'rsc') && route === '/admin') {
    if (adminDenial.startsWith('PASS')) {
      return ['EXPECTED_ADMIN_DENIAL', true, 'anonymous /admin denied without protected admin content'];
    }
    return ['FAIL_ADMIN_DENIAL_NOT_CONFIRMED', false, 'anonymous /admin did not produce a clear denial signal'];
  }

  if (result.status >= 200 && result.status < 400) {
    return ['EXPECTED_PUBLIC_2XX_3XX', true, 'public artifact returned an accessible non-error response'];
  }

  if (result.status >= 400 && result.status < 500) {
    return ['FAIL_UNEXPECTED_PUBLIC_4XX', false, '4xx is allowed only for protected secondary domain records or anonymous /admin denial'];
  }

  if (result.status >= 500) {
    return ['FAIL_UNEXPECTED_PUBLIC_5XX', false, '5xx is never acceptable for this production artifact scan'];
  }

  return ['FAIL_UNCLASSIFIED_STATUS', false, `unclassified HTTP status ${result.status}`];
}

function recordFor({ kind, domain, route, routeOrigin = '', result, forbiddenMatches, chunkMatches = [] }) {
  const adminDenial = classifyAdminDenial(route, result.text, result.status);
  const [statusClass, statusExpected, statusReason] = classifyExpectedStatus({ kind, domain, route, result, adminDenial });
  return {
    kind,
    domain,
    route,
    routeOrigin,
    requestedUrl: result.requestedUrl,
    finalUrl: result.finalUrl,
    status: result.status,
    statusText: result.statusText,
    contentType: result.contentType,
    byteCount: result.byteCount,
    sha256: result.sha256,
    statusExpected,
    statusClass,
    statusReason,
    forbiddenMatches,
    chunkMatches,
    adminDenial,
    error: result.error || '',
  };
}

async function scanDomain(domain, sourceManifest) {
  const pageOrigins = new Map();
  const apiOrigins = new Map();
  for (const route of SEED_PAGE_ROUTES) addRouteOrigin(pageOrigins, route, 'seed');
  for (const route of sourceManifest.sourcePageRoutes) addRouteOrigin(pageOrigins, route, 'source');
  for (const route of sourceManifest.sourceApiGetRoutes) addRouteOrigin(apiOrigins, route, 'source-get');
  for (const route of sourceManifest.extraApiGetRoutes) addRouteOrigin(apiOrigins, route, 'extra-get');

  const pageRoutes = new Set(Array.from(pageOrigins.keys()).sort());
  const apiRoutes = new Set(Array.from(apiOrigins.keys()).sort());
  const pageRecords = [];
  const rscRecords = [];
  const apiRecords = [];
  const chunkRecords = [];
  const chunkUrls = new Set();
  const pendingPageRoutes = Array.from(pageRoutes).sort();

  for (let index = 0; index < pendingPageRoutes.length; index += 1) {
    const route = pendingPageRoutes[index];
    const result = await fetchText(`${domain}${route}`);
    const forbiddenMatches = findForbidden(result.text);
    for (const link of extractInternalLinks(`${domain}${route}`, result.text)) {
      if (!pageRoutes.has(link) && pageRoutes.size < maxDiscoveredRoutes) {
        pageRoutes.add(link);
        addRouteOrigin(pageOrigins, link, `rendered:${route}`);
        pendingPageRoutes.push(link);
      } else if (pageRoutes.has(link)) {
        addRouteOrigin(pageOrigins, link, `rendered:${route}`);
      }
    }
    for (const chunk of extractScriptChunks(`${domain}${route}`, result.text)) chunkUrls.add(chunk);
    pageRecords.push(recordFor({
      kind: 'page',
      domain,
      route,
      routeOrigin: routeOriginString(pageOrigins, route),
      result,
      forbiddenMatches,
    }));

    const rscResult = await fetchText(`${domain}${route}?_rsc=1`);
    for (const chunk of extractScriptChunks(`${domain}${route}`, rscResult.text)) chunkUrls.add(chunk);
    rscRecords.push(recordFor({
      kind: 'rsc',
      domain,
      route,
      routeOrigin: routeOriginString(pageOrigins, route),
      result: rscResult,
      forbiddenMatches: findForbidden(rscResult.text),
    }));
  }

  for (const route of Array.from(apiRoutes).sort()) {
    const result = await fetchText(`${domain}${route}`);
    apiRecords.push(recordFor({
      kind: 'api-get',
      domain,
      route,
      routeOrigin: routeOriginString(apiOrigins, route),
      result,
      forbiddenMatches: findForbidden(result.text),
    }));
  }

  for (const chunkUrl of Array.from(chunkUrls).sort()) {
    const result = await fetchText(chunkUrl);
    chunkRecords.push(recordFor({
      kind: 'js-chunk',
      domain,
      route: new URL(chunkUrl).pathname,
      routeOrigin: 'referenced-chunk',
      result,
      forbiddenMatches: findForbidden(result.text),
    }));
  }

  return {
    pageRoutes: Array.from(pageRoutes).sort(),
    apiRoutes: Array.from(apiRoutes).sort(),
    pageRecords,
    rscRecords,
    apiRecords,
    chunkRecords,
  };
}

function escapeCell(value) {
  const text = Array.isArray(value) ? value.join(', ') : String(value ?? '');
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ').slice(0, 500);
}

function table(records) {
  const headers = [
    'kind',
    'domain',
    'route',
    'routeOrigin',
    'status',
    'statusExpected',
    'statusClass',
    'byteCount',
    'sha256',
    'forbiddenMatches',
    'chunkMatches',
    'adminDenial',
    'statusReason',
    'error',
  ];
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...records.map((record) => `| ${headers.map((header) => escapeCell(record[header])).join(' | ')} |`),
  ].join('\n');
}

const startedAt = new Date().toISOString();
const sourceManifest = await discoverSourceManifest();
const results = [];
for (const domain of domains) {
  results.push({ domain, ...(await scanDomain(domain, sourceManifest)) });
}
const allRecords = results.flatMap((result) => [
  ...result.pageRecords,
  ...result.rscRecords,
  ...result.apiRecords,
  ...result.chunkRecords,
]);

const forbiddenFailures = allRecords.filter((record) => record.forbiddenMatches.length > 0);
const statusFailures = allRecords.filter((record) => !record.statusExpected);
const adminRecords = allRecords.filter((record) => record.route === '/admin' && (record.kind === 'page' || record.kind === 'rsc'));
const adminFailures = adminRecords.filter((record) => !record.adminDenial.startsWith('PASS'));
const inaccessibleDomainNotes = results.map((result) => {
  const protectedDomain = protectedDomains.has(normalizeOrigin(result.domain));
  const records = [...result.pageRecords, ...result.rscRecords, ...result.apiRecords];
  const protectedDenials = records.filter((record) => record.statusClass === 'EXPECTED_PROTECTED_DOMAIN_401_403').length;
  return {
    domain: result.domain,
    protectedDomain,
    protectedDenials,
    totalNonChunkRecords: records.length,
    note: protectedDomain && protectedDenials > 0
      ? 'protected secondary deployment domain returned allowed 401/403 records'
      : 'domain scanned without protected-domain allowance',
  };
});
const verdict = forbiddenFailures.length === 0 && statusFailures.length === 0 && adminFailures.length === 0 ? 'GO' : 'HOLD';

const summary = {
  scanName: 'Harbourview production artifact scan',
  scannerVersion: '1.2-source-rendered-status-classification',
  deploymentId,
  expectedCommit,
  startedAt,
  completedAt: new Date().toISOString(),
  domains,
  protectedDomains: Array.from(protectedDomains),
  maxDiscoveredRoutes,
  fetchTimeoutMs,
  forbiddenList: FORBIDDEN,
  sourceManifest,
  counts: {
    totalRecords: allRecords.length,
    pages: allRecords.filter((r) => r.kind === 'page').length,
    rsc: allRecords.filter((r) => r.kind === 'rsc').length,
    apiGet: allRecords.filter((r) => r.kind === 'api-get').length,
    jsChunks: allRecords.filter((r) => r.kind === 'js-chunk').length,
    forbiddenFailures: forbiddenFailures.length,
    statusFailures: statusFailures.length,
    adminFailures: adminFailures.length,
  },
  inaccessibleDomainNotes,
  verdict,
};

const markdown = [
  '# Harbourview Production Artifact Scan',
  '',
  `Deployment: \`${deploymentId}\``,
  `Expected commit: \`${expectedCommit}\``,
  `Started: \`${startedAt}\``,
  `Completed: \`${summary.completedAt}\``,
  `Verdict: **${verdict}**`,
  '',
  '## Summary',
  '',
  '```json',
  JSON.stringify(summary, null, 2),
  '```',
  '',
  '## Evidence Table',
  '',
  table(allRecords),
  '',
  '## Forbidden Match Failures',
  '',
  forbiddenFailures.length ? table(forbiddenFailures) : 'None.',
  '',
  '## Status/Admin Failures',
  '',
  [...statusFailures, ...adminFailures].length ? table([...statusFailures, ...adminFailures]) : 'None.',
].join('\n');

await mkdir(outDir, { recursive: true });
await writeFile(`${outDir}/summary.json`, JSON.stringify(summary, null, 2));
await writeFile(`${outDir}/evidence.json`, JSON.stringify({ summary, results, records: allRecords }, null, 2));
await writeFile(`${outDir}/evidence.md`, markdown);

console.log(markdown);
if (verdict !== 'GO') process.exitCode = 1;
