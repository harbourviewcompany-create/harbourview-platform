#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE_URL = (process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'https://harbourview.vercel.app').replace(/\/$/, '')
const OUT_DIR = process.env.HARBOURVIEW_PRODUCTION_VERIFY_OUT || 'artifacts/production-runtime-verification'
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || ''

const routes = [
  { path: '/', expected: 'ok' },
  { path: '/signals', expected: 'auth-denied' },      // protected: redirects to /login
  { path: '/intelligence', expected: 'auth-denied' }, // protected: redirects to /login
  { path: '/marketplace', expected: 'ok' },
  { path: '/marketplace/listings', expected: 'ok' },
  {
    path: '/marketplace/wanted',
    expected: 'redirect',
    expectedStatus: 307,
    expectedLocation: '/dashboard?page=marketplace&section=marketplace&marketView=wanted&tool=wanted-intake',
  },
  { path: '/marketplace/sell', expected: 'auth-denied' }, // gated in middleware.ts PROTECTED_PREFIXES
  { path: '/markets', expected: 'ok' },
  { path: '/contact', expected: 'ok' },
  { path: '/intake', expected: 'auth-denied' },       // protected: redirects to /login
  { path: '/admin', expected: 'auth-denied' },
]

const forbiddenStrings = [
  'sourceUrl',
  'sourceName',
  'sourceEvidence',
  'provenanceSummary',
  'verificationStatus',
  'sellerAuthorizationStatus',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  'contactEmail',
]

const runtimeErrorMarkers = [
  'Hydration failed',
  'Application error',
  'ChunkLoadError',
  'Minified React error',
  'Unhandled Runtime Error',
  'Text content does not match',
  'ReferenceError',
  'TypeError',
]

const adminDeniedMarkers = [
  'Admin sign-in required',
  'Admin access restricted',
  'This account does not have the admin or operator role required for this route.',
  'Sign in with an authorized Harbourview admin or operator account to continue.',
]

function titleFromHtml(html) {
  const match = html.match(/<title>(.*?)<\/title>/is)
  return match ? match[1].replace(/\s+/g, ' ').trim() : ''
}

function safeName(pathname) {
  if (pathname === '/') return 'home'
  return pathname.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
}

async function fetchRoute(route) {
  const url = `${BASE_URL}${route.path}`
  const startedAt = new Date().toISOString()
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        'user-agent': 'Harbourview-Production-Runtime-Verification/1.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        ...(BYPASS_TOKEN ? { 'x-vercel-protection-bypass': BYPASS_TOKEN } : {}),
      },
    })

    const html = await response.text()
    const title = titleFromHtml(html)
    const forbiddenHits = forbiddenStrings.filter((needle) => html.includes(needle))
    const runtimeHits = runtimeErrorMarkers.filter((needle) => html.includes(needle))
    const adminDenied = adminDeniedMarkers.some((needle) => html.includes(needle))
    const redirected = response.status >= 300 && response.status < 400
    const location = response.headers.get('location') || ''

    let statusPass = false
    if (route.expected === 'auth-denied') {
      statusPass = response.status === 401 || response.status === 403 || redirected || adminDenied
    } else if (route.expected === 'redirect') {
      statusPass = response.status === route.expectedStatus && location === route.expectedLocation
    } else {
      statusPass = response.status === 200
    }

    const authPass = route.expected === 'auth-denied'
      ? (adminDenied || response.status === 401 || response.status === 403 || redirected)
      : true
    const noForbidden = forbiddenHits.length === 0
    const noRuntimeErrors = runtimeHits.length === 0
    const pass = Boolean(statusPass && authPass && noForbidden && noRuntimeErrors)

    return {
      route: route.path,
      url,
      expected: route.expected,
      expectedStatus: route.expectedStatus ?? null,
      expectedLocation: route.expectedLocation ?? '',
      startedAt,
      status: response.status,
      redirected,
      location,
      title,
      bytes: html.length,
      adminDenied,
      forbiddenHits,
      runtimeHits,
      pass,
      html,
    }
  } catch (error) {
    return {
      route: route.path,
      url,
      expected: route.expected,
      expectedStatus: route.expectedStatus ?? null,
      expectedLocation: route.expectedLocation ?? '',
      startedAt,
      status: null,
      redirected: false,
      location: '',
      title: '',
      bytes: 0,
      adminDenied: false,
      forbiddenHits: [],
      runtimeHits: [error instanceof Error ? error.message : String(error)],
      pass: false,
      html: '',
    }
  }
}

function toPublicResult(result) {
  const { html, ...publicResult } = result
  return publicResult
}

function markdownReport(report) {
  const rows = report.results.map((result) => {
    const status = result.status === null ? 'ERROR' : String(result.status)
    const title = result.title || '(no title)'
    const location = result.location || '(none)'
    const forbidden = result.forbiddenHits.length ? result.forbiddenHits.join(', ') : 'none'
    const runtime = result.runtimeHits.length ? result.runtimeHits.join(', ') : 'none'
    return `| \`${result.route}\` | ${result.pass ? 'PASS' : 'FAIL'} | ${status} | ${location.replace(/\|/g, '\\|')} | ${title.replace(/\|/g, '\\|')} | ${forbidden} | ${runtime} |`
  })

  return [
    '# Harbourview Production Runtime Verification',
    '',
    `- Base URL: ${report.baseUrl}`,
    `- Started: ${report.startedAt}`,
    `- Finished: ${report.finishedAt}`,
    `- Overall: ${report.pass ? 'PASS' : 'FAIL'}`,
    '',
    '| Route | Result | HTTP | Location | Title | Forbidden hits | Runtime markers |',
    '|---|---:|---:|---|---|---|---|',
    ...rows,
    '',
    '## Gate rules',
    '',
    '- Public `ok` routes must return HTTP 200.',
    '- Explicit redirect-contract routes must return the configured HTTP status and exact `Location` value.',
    '- Protected routes must return 401, 403, redirect or recognized denial content.',
    '- `/admin` must return 401, 403, redirect or recognized admin-denial content.',
    '- Forbidden leakage strings must be absent from rendered HTML.',
    '- Runtime-error markers must be absent from rendered HTML.',
    '',
  ].join('\n')
}

await mkdir(OUT_DIR, { recursive: true })
await mkdir(join(OUT_DIR, 'html'), { recursive: true })
await mkdir(join(OUT_DIR, 'screenshots'), { recursive: true })

const startedAt = new Date().toISOString()
const rawResults = []

for (const route of routes) {
  const result = await fetchRoute(route)
  rawResults.push(result)
  await writeFile(join(OUT_DIR, 'html', `${safeName(route.path)}.html`), result.html || '', 'utf8')
  console.log(`${result.pass ? 'PASS' : 'FAIL'} ${route.path} ${result.status ?? 'ERROR'} ${result.location || result.title || ''}`)
}

const report = {
  baseUrl: BASE_URL,
  startedAt,
  finishedAt: new Date().toISOString(),
  pass: rawResults.every((result) => result.pass),
  forbiddenStrings,
  runtimeErrorMarkers,
  routes: routes.map((route) => route.path),
  results: rawResults.map(toPublicResult),
}

await writeFile(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
await writeFile(join(OUT_DIR, 'report.md'), markdownReport(report), 'utf8')
await writeFile(join(OUT_DIR, 'screenshots', 'README.md'), 'Screenshots are reserved for Playwright/browser capture expansion. This runtime verification captures HTML snapshots in ../html.\n', 'utf8')

if (!report.pass) {
  console.error('Harbourview production runtime verification failed.')
  console.error(markdownReport(report))
  process.exit(1)
}

console.log('Harbourview production runtime verification passed.')
