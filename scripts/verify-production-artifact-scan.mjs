import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

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

const SEED_API_GET_ROUTES = [
  '/api/health/supabase',
  '/api/marketplace/quote',
  '/api/marketplace/listing-submission',
  '/api/marketplace/capture',
  '/api/used-surplus-preview',
  '/api/chat',
  '/api/genetics-routing/requests',
  '/api/genetics-routing/actions',
  '/api/genetics-routing/dealflow',
  '/api/genetics-routing/operations',
  '/api/smoke/marketplace',
];

const DEFAULT_DOMAINS = [
  'https://harbourview-nu.vercel.app',
  'https://harbourview-14bdr4iuk-harbourviewnetwork.vercel.app',
];

const domains = (process.env.HARBOURVIEW_SCAN_DOMAINS || DEFAULT_DOMAINS.join(','))
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

const expectedCommit = process.env.HARBOURVIEW_EXPECTED_COMMIT || '2ee3105e236122083d3fb86a16ca3c8811cce440';
const deploymentId = process.env.HARBOURVIEW_DEPLOYMENT_ID || 'FRHiKm5k7';
const maxDiscoveredRoutes = Number(process.env.HARBOURVIEW_SCAN_MAX_DISCOVERED_ROUTES || 80);
const outDir = process.env.HARBOURVIEW_SCAN_OUT_DIR || 'artifacts/production-artifact-scan';

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function findForbidden(text) {
  return FORBIDDEN.filter((needle) => text.includes(needle));
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
        links.add(url.pathname === '' ? '/' : url.pathname);
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
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'harbourview-production-artifact-scan/1.0 verification-only',
        'accept': 'text/html,application/json,text/plain,application/javascript,*/*;q=0.8',
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
  }
}

function classifyAdminDenial(route, text, status) {
  if (route !== '/admin') return '';
  const hasUnauthorized = text.includes('Admin sign-in required');
  const hasForbidden = text.includes('Admin access restricted');
  const hasDashboard = text.includes('Admin dashboard') || text.includes('Internal review') || text.includes('Operator console');
  if ((hasUnauthorized || hasForbidden) && !hasDashboard) return 'PASS_DENIED';
  if (status === 401 || status === 403) return 'PASS_HTTP_DENIED';
  if (hasDashboard) return 'FAIL_ADMIN_CONTENT_VISIBLE';
  return 'UNKNOWN_NO_DENIAL_COPY';
}

function recordFor({ kind, domain, route, result, forbiddenMatches, chunkMatches = [], adminDenial = '' }) {
  return {
    kind,
    domain,
    route,
    requestedUrl: result.requestedUrl,
    finalUrl: result.finalUrl,
    status: result.status,
    contentType: result.contentType,
    byteCount: result.byteCount,
    sha256: result.sha256,
    forbiddenMatches,
    chunkMatches,
    adminDenial,
    error: result.error || '',
  };
}

async function scanDomain(domain) {
  const pageRoutes = new Set(SEED_PAGE_ROUTES);
  const apiRoutes = new Set(SEED_API_GET_ROUTES);
  const pageRecords = [];
  const rscRecords = [];
  const apiRecords = [];
  const chunkRecords = [];
  const chunkUrls = new Set();

  for (const route of Array.from(pageRoutes)) {
    const result = await fetchText(`${domain}${route}`);
    const forbiddenMatches = findForbidden(result.text);
    for (const link of extractInternalLinks(`${domain}${route}`, result.text)) {
      if (pageRoutes.size < maxDiscoveredRoutes) pageRoutes.add(link);
    }
    for (const chunk of extractScriptChunks(`${domain}${route}`, result.text)) chunkUrls.add(chunk);
    pageRecords.push(recordFor({
      kind: 'page',
      domain,
      route,
      result,
      forbiddenMatches,
      adminDenial: classifyAdminDenial(route, result.text, result.status),
    }));

    const rscUrl = `${domain}${route}${route.includes('?') ? '&' : '?'}_rsc=1`;
    const rscResult = await fetchText(rscUrl);
    const rscForbiddenMatches = findForbidden(rscResult.text);
    for (const chunk of extractScriptChunks(`${domain}${route}`, rscResult.text)) chunkUrls.add(chunk);
    rscRecords.push(recordFor({
      kind: 'rsc',
      domain,
      route,
      result: rscResult,
      forbiddenMatches: rscForbiddenMatches,
    }));
  }

  for (const route of apiRoutes) {
    const result = await fetchText(`${domain}${route}`);
    apiRecords.push(recordFor({
      kind: 'api-get',
      domain,
      route,
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
      result,
      forbiddenMatches: findForbidden(result.text),
    }));
  }

  return { pageRoutes: Array.from(pageRoutes).sort(), apiRoutes: Array.from(apiRoutes).sort(), pageRecords, rscRecords, apiRecords, chunkRecords };
}

function escapeCell(value) {
  const text = Array.isArray(value) ? value.join(', ') : String(value ?? '');
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ').slice(0, 500);
}

function table(records) {
  const headers = ['kind', 'domain', 'route', 'status', 'byteCount', 'sha256', 'forbiddenMatches', 'chunkMatches', 'adminDenial', 'error'];
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...records.map((record) => `| ${headers.map((header) => escapeCell(record[header])).join(' | ')} |`),
  ].join('\n');
}

const startedAt = new Date().toISOString();
const results = [];
for (const domain of domains) {
  results.push({ domain, ...(await scanDomain(domain)) });
}
const allRecords = results.flatMap((result) => [
  ...result.pageRecords,
  ...result.rscRecords,
  ...result.apiRecords,
  ...result.chunkRecords,
]);

const forbiddenFailures = allRecords.filter((record) => record.forbiddenMatches.length > 0);
const fetchFailures = allRecords.filter((record) => record.status === 0 || record.status >= 500);
const adminRecords = allRecords.filter((record) => record.route === '/admin' && record.kind === 'page');
const adminFailures = adminRecords.filter((record) => !record.adminDenial.startsWith('PASS'));
const inaccessibleDomains = results
  .filter((result) => result.pageRecords.every((record) => record.status === 401 || record.status === 403 || record.status === 0))
  .map((result) => result.domain);
const verdict = forbiddenFailures.length === 0 && fetchFailures.length === 0 && adminFailures.length === 0 ? 'GO' : 'HOLD';

const summary = {
  scanName: 'Harbourview production artifact scan',
  deploymentId,
  expectedCommit,
  startedAt,
  completedAt: new Date().toISOString(),
  domains,
  forbiddenList: FORBIDDEN,
  counts: {
    totalRecords: allRecords.length,
    pages: allRecords.filter((r) => r.kind === 'page').length,
    rsc: allRecords.filter((r) => r.kind === 'rsc').length,
    apiGet: allRecords.filter((r) => r.kind === 'api-get').length,
    jsChunks: allRecords.filter((r) => r.kind === 'js-chunk').length,
    forbiddenFailures: forbiddenFailures.length,
    fetchFailures: fetchFailures.length,
    adminFailures: adminFailures.length,
  },
  inaccessibleDomains,
  verdict,
};

const markdown = [
  `# Harbourview Production Artifact Scan`,
  '',
  `Deployment: \`${deploymentId}\``,
  `Expected commit: \`${expectedCommit}\``,
  `Started: \`${startedAt}\``,
  `Completed: \`${summary.completedAt}\``,
  `Verdict: **${verdict}**`,
  '',
  `## Summary`,
  '',
  '```json',
  JSON.stringify(summary, null, 2),
  '```',
  '',
  `## Evidence Table`,
  '',
  table(allRecords),
  '',
  `## Forbidden Match Failures`,
  '',
  forbiddenFailures.length ? table(forbiddenFailures) : 'None.',
  '',
  `## Fetch/Admin Failures`,
  '',
  [...fetchFailures, ...adminFailures].length ? table([...fetchFailures, ...adminFailures]) : 'None.',
].join('\n');

await mkdir(outDir, { recursive: true });
await writeFile(`${outDir}/summary.json`, JSON.stringify(summary, null, 2));
await writeFile(`${outDir}/evidence.json`, JSON.stringify({ summary, results, records: allRecords }, null, 2));
await writeFile(`${outDir}/evidence.md`, markdown);

console.log(markdown);
if (verdict !== 'GO') process.exitCode = 1;
