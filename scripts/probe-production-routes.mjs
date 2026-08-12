#!/usr/bin/env node

const BASE_URL = (process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'https://harbourview.vercel.app').replace(/\/$/, '')
const MAX_ATTEMPTS = Number(process.env.HARBOURVIEW_PRODUCTION_PROBE_ATTEMPTS || '30')
const WAIT_MS = Number(process.env.HARBOURVIEW_PRODUCTION_PROBE_WAIT_MS || '10000')
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || ''

const forbiddenStrings = [
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
]

const removedPageStrings = [
  '/marketplace/listings',
  'Network opportunities',
  'supplier leads',
  'surplus supply',
]

const legacyStrings = [
  'The Cannabis Industry\'s Professional Marketplace',
  'B2B cannabis industry marketplace',
  '/marketplace/submit-listing',
  '/marketplace/wanted-requests',
  '/commercial-intelligence',
]

const routes = [
  {
    path: '/',
    okStatuses: [200],
    titleIncludes: 'Harbourview',
    mustInclude: ['Harbourview'],
    mustNotInclude: ['The Cannabis Industry\'s Professional Marketplace', 'view all listings'],
  },
  {
    path: '/marketplace',
    okStatuses: [200],
    titleIncludes: 'Exchange | Harbourview',
    mustInclude: ['Harbourview Exchange', 'Harbourview reviews'],
    mustNotInclude: ['B2B listings for the regulated cannabis industry'],
  },
  {
    path: '/marketplace/sell',
    okStatuses: [200],
    titleIncludes: 'Submit Listing | Harbourview',
    mustInclude: ['Submit Listing | Harbourview'],
    mustNotInclude: [],
  },
  {
    path: '/marketplace/wanted',
    okStatuses: [200],
    titleIncludes: 'Sign In | Harbourview',
    mustInclude: ['Sign in to your account'],
    mustNotInclude: ['Active buy-side requests from licensed operators', '/marketplace/wanted-requests'],
    finalUrlIncludes: '/login?next=%2Fdashboard',
  },
  {
    path: '/signals',
    okStatuses: [200],
    titleIncludes: 'Signals',
    mustInclude: ['Harbourview Signals'],
    mustNotInclude: ['/commercial-intelligence'],
  },
  {
    path: '/intelligence',
    okStatuses: [200],
    titleIncludes: 'Intelligence',
    mustInclude: ['Harbourview Intelligence'],
    mustNotInclude: ['/commercial-intelligence'],
  },
  {
    path: '/contact',
    okStatuses: [200],
    titleIncludes: 'Contact Harbourview',
    mustInclude: ['Contact Harbourview'],
    mustNotInclude: ['/marketplace/submit-listing', '/marketplace/wanted-requests', '/commercial-intelligence'],
  },
  {
    path: '/intake',
    okStatuses: [200],
    titleIncludes: 'Confidential',
    mustInclude: ['Confidential'],
    mustNotInclude: ['Submit a Listing', 'Listing Type'],
  },
  {
    path: '/admin',
    okStatuses: [401, 403],
    titleIncludes: null,
    mustInclude: [],
    mustNotInclude: forbiddenStrings,
  },
  {
    path: '/marketplace/listings',
    okStatuses: [200],
    titleIncludes: null,
    mustInclude: [],
    mustNotInclude: [],
  },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function titleOf(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? match[1].replace(/\s+/g, ' ').trim() : ''
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0
  return haystack.split(needle).length - 1
}

async function fetchRoute(path, attempt) {
  const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}cb=hv-prod-audit-${Date.now()}-${attempt}`
  const response = await fetch(url, {
    redirect: 'follow',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'User-Agent': 'HarbourviewProductionRouteAudit/1.0',
      ...(BYPASS_TOKEN ? { 'x-vercel-protection-bypass': BYPASS_TOKEN } : {}),
    },
  })
  const body = await response.text()
  return {
    path,
    requestedUrl: url,
    finalUrl: response.url,
    status: response.status,
    title: titleOf(body),
    body,
  }
}

function evaluateRoute(route, result) {
  const body = result.body
  const allForbidden = [...forbiddenStrings, ...removedPageStrings, ...legacyStrings]
  const countMap = Object.fromEntries(allForbidden.map((s) => [s, countOccurrences(body, s)]))
  const failures = []

  if (!route.okStatuses.includes(result.status)) {
    failures.push(`status ${result.status} not in ${route.okStatuses.join('/')}`)
  }

  if (route.titleIncludes && !result.title.includes(route.titleIncludes)) {
    failures.push(`title missing ${JSON.stringify(route.titleIncludes)}; actual=${JSON.stringify(result.title)}`)
  }

  if (route.finalUrlIncludes && !result.finalUrl.includes(route.finalUrlIncludes)) {
    failures.push(`final URL missing ${JSON.stringify(route.finalUrlIncludes)}; actual=${JSON.stringify(result.finalUrl)}`)
  }

  for (const expected of route.mustInclude) {
    if (!body.includes(expected)) failures.push(`body missing ${JSON.stringify(expected)}`)
  }

  const routeForbidden = [...new Set([...(route.mustNotInclude || []), ...forbiddenStrings])]
  for (const forbidden of routeForbidden) {
    if (body.includes(forbidden)) failures.push(`body contains forbidden ${JSON.stringify(forbidden)} count=${countOccurrences(body, forbidden)}`)
  }

  return {
    path: route.path,
    status: result.status,
    title: result.title,
    finalUrl: result.finalUrl,
    counts: countMap,
    failures,
    ok: failures.length === 0,
  }
}

function evaluateResults(results) {
  return routes.map((route) => evaluateRoute(route, results.get(route.path)))
}

async function runAttempt(attempt) {
  const results = new Map()
  for (const route of routes) {
    results.set(route.path, await fetchRoute(route.path, attempt))
  }
  return evaluateResults(results)
}

function printAttempt(attempt, evaluated) {
  console.log(`\n## Attempt ${attempt}`)
  console.log('| route | status | title | result | blockers |')
  console.log('|---|---:|---|---|---|')
  for (const row of evaluated) {
    console.log(`| ${row.path} | ${row.status} | ${row.title.replace(/\|/g, '\\|')} | ${row.ok ? 'PASS' : 'FAIL'} | ${row.failures.join('; ').replace(/\|/g, '\\|')} |`)
  }
}

let finalEvaluated = null
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  try {
    const evaluated = await runAttempt(attempt)
    finalEvaluated = evaluated
    printAttempt(attempt, evaluated)

    if (evaluated.every((row) => row.ok)) {
      console.log('\nFINAL VERDICT: GO')
      process.exit(0)
    }
  } catch (error) {
    console.error(`Attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (attempt < MAX_ATTEMPTS) await sleep(WAIT_MS)
}

console.log('\nFINAL VERDICT: HOLD')
if (finalEvaluated) {
  const blockers = finalEvaluated.filter((row) => !row.ok)
  console.log('\nExact blockers:')
  for (const row of blockers) {
    console.log(`- ${row.path}: ${row.failures.join('; ')}`)
  }
  console.log('\nString counts from final attempt:')
  for (const row of finalEvaluated) {
    const relevantCounts = [...removedPageStrings, ...forbiddenStrings].map((s) => `${s}=${row.counts[s]}`).join(', ')
    console.log(`- ${row.path}: ${relevantCounts}`)
  }
}
process.exit(1)
