#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const envHas = (name) => Object.prototype.hasOwnProperty.call(process.env, name);
const rawBaseUrl = process.env.PROBE_BASE_URL;
if (!rawBaseUrl) throw new Error('PROBE_BASE_URL is required');
if (/[\u0000-\u001f\u007f]/.test(rawBaseUrl)) throw new Error('PROBE_BASE_URL contains control characters');

const base = new URL(rawBaseUrl);
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
  throw new Error('PROBE_BASE_URL must be a root HTTP(S) URL without credentials, query, or fragment');
}
base.pathname = '/';

function parseRoutes(name, fallback) {
  const raw = envHas(name) ? process.env[name] ?? '' : fallback;
  return raw.split(',').map((value) => value.trim()).filter(Boolean).map((route) => {
    if (!route.startsWith('/')) throw new Error(`${name} routes must be absolute paths`);
    const url = new URL(route, base);
    if (url.origin !== base.origin) throw new Error(`${name} routes must remain same-origin`);
    return `${url.pathname}${url.search}`;
  });
}

const pageRoutes = parseRoutes('PROBE_ROUTES', '/,/marketplace,/marketplace/listings,/marketplace/new-products,/supply,/signals,/intelligence');
const apiRoutes = parseRoutes('PROBE_API_ROUTES', '/api/globe');
const outputPath = process.env.PROBE_OUTPUT || 'release-evidence/public-leakage-report.json';
const rawMaxAssets = envHas('PROBE_MAX_ASSETS') ? process.env.PROBE_MAX_ASSETS : '500';
const maxAssets = Number(rawMaxAssets);
if (!Number.isInteger(maxAssets) || maxAssets < 0 || maxAssets > 5000) {
  throw new Error('PROBE_MAX_ASSETS must be an integer between 0 and 5000');
}

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';
const commonHeaders = {
  'user-agent': 'Harbourview-Release-Verification/3.0',
  ...(bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {}),
};

const forbidden = [
  'sourceUrl','source_url','sourceName','source_name','sourceEvidence','source_evidence',
  'provenanceSummary','provenance_summary','internalReviewNotes','internal_review_notes',
  'reviewedBy','reviewed_by','lastReviewedAt','last_reviewed_at','nextReviewDueAt',
  'next_review_due_at','verificationStatus','verification_status','availabilityStatus',
  'availability_status','sellerAuthorizationStatus','seller_authorization_status',
  'contactEmail','contact_email','View source listing','Evidence captured'
];

const queue = [];
for (const route of pageRoutes) {
  const url = new URL(route, base).href;
  queue.push({ url, kind: 'html', headers: { accept: 'text/html' } });
  queue.push({
    url,
    kind: 'rsc',
    headers: {
      accept: 'text/x-component',
      RSC: '1',
      'Next-Router-Prefetch': '1',
      'Next-Router-State-Tree': encodeURIComponent(JSON.stringify(['', { children: ['', {}] }, null, null, true])),
    },
  });
}
for (const route of apiRoutes) queue.push({ url: new URL(route, base).href, kind: 'api', headers: { accept: 'application/json' } });

const seen = new Set();
const findings = [];
const responses = [];
let queuedStaticAssets = 0;

function contextDigest(text, index, length = 160) {
  const value = text.slice(Math.max(0, index - length), Math.min(text.length, index + length));
  return createHash('sha256').update(value).digest('hex');
}

function enqueueAsset(raw, currentUrl, source) {
  if (queuedStaticAssets >= maxAssets) return;
  try {
    const url = new URL(raw, currentUrl);
    if (url.origin !== base.origin || !url.pathname.startsWith('/_next/static/')) return;
    const key = `static:${url.href}`;
    if (seen.has(key) || queue.some((item) => `${item.kind}:${item.url}` === key)) return;
    queue.push({ url: url.href, kind: 'static', headers: {}, source });
    queuedStaticAssets += 1;
  } catch {
    // Ignore malformed asset references discovered in response text.
  }
}

function discoverAssets(text, currentUrl) {
  for (const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) enqueueAsset(match[1], currentUrl, 'html-attribute');
  for (const match of text.matchAll(/["'`](\/_next\/static\/[^"'`\s)]+)/g)) enqueueAsset(match[1], currentUrl, 'static-reference');
  const buildIdMatch = text.match(/"buildId"\s*:\s*"([^"]+)"/);
  if (buildIdMatch) {
    const id = buildIdMatch[1];
    enqueueAsset(`/_next/static/${id}/_buildManifest.js`, currentUrl, 'build-manifest');
    enqueueAsset(`/_next/static/${id}/_ssgManifest.js`, currentUrl, 'ssg-manifest');
  }
}

function assertResponse(item, response) {
  const finalUrl = new URL(response.url || item.url);
  if (finalUrl.origin !== base.origin) throw new Error(`Cross-origin redirect rejected for ${item.url}`);
  if (response.status !== 200) throw new Error(`Unexpected HTTP ${response.status} for ${item.kind} ${item.url}`);
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const expected = item.kind === 'api'
    ? ['application/json']
    : item.kind === 'rsc'
      ? ['text/x-component', 'text/plain', 'application/octet-stream']
      : item.kind === 'html'
        ? ['text/html']
        : ['javascript', 'text/plain', 'application/json'];
  if (!expected.some((value) => contentType.includes(value))) {
    throw new Error(`Unexpected content-type ${contentType || '<missing>'} for ${item.kind} ${item.url}`);
  }
  return { finalUrl, contentType };
}

while (queue.length) {
  const item = queue.shift();
  const key = `${item.kind}:${item.url}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const response = await fetch(item.url, {
    method: 'GET',
    redirect: 'follow',
    headers: { ...commonHeaders, ...item.headers },
  });
  const { finalUrl, contentType } = assertResponse(item, response);
  const text = await response.text();
  responses.push({
    requestedUrl: item.url,
    finalUrl: finalUrl.href,
    status: response.status,
    contentType,
    bytes: Buffer.byteLength(text),
    kind: item.kind,
    source: item.source || null,
  });

  const lower = text.toLowerCase();
  for (const token of forbidden) {
    const needle = token.toLowerCase();
    let index = lower.indexOf(needle);
    while (index !== -1) {
      findings.push({
        requestedUrl: item.url,
        finalUrl: finalUrl.href,
        kind: item.kind,
        token,
        index,
        contextSha256: contextDigest(text, index),
      });
      index = lower.indexOf(needle, index + needle.length);
    }
  }

  if (item.kind === 'html' || item.kind === 'static') discoverAssets(text, finalUrl.href);
}

if (responses.length === 0) throw new Error('No responses were scanned');
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: base.href,
  pageRoutes,
  apiRoutes,
  maxAssets,
  responseCount: responses.length,
  responses,
  findings,
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2));

if (findings.length) {
  for (const finding of findings) {
    console.error(`FORBIDDEN ${finding.token} [${finding.kind}] ${finding.finalUrl} offset=${finding.index} contextSha256=${finding.contextSha256}`);
  }
  process.exitCode = 1;
} else {
  console.log(`PASS: scanned ${responses.length} validated HTML, RSC, API and static responses with no exact forbidden fields`);
}
