#!/usr/bin/env node

const baseUrl = (process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://harbourview.vercel.app')
  .replace(/^([^h])/, 'https://$1')
  .replace(/\/$/, '')

const routes = [
  '/',
  '/marketplace',
  '/marketplace/listings',
  '/marketplace/wanted',
  '/marketplace/sell',
  '/intelligence',
  '/signals',
  '/intake'
]

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
  'SUPABASE_SERVICE_ROLE_KEY',
  'service_role'
]

const scriptSrcPattern = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi
const failures = []
const results = []
const assets = new Set()
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || ''

async function fetchText(url, accept) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      Accept: accept,
      'User-Agent': 'HarbourviewClientBundleProbe/1.0',
      ...(BYPASS_TOKEN ? { 'x-vercel-protection-bypass': BYPASS_TOKEN } : {})
    }
  })
  return { response, text: await response.text() }
}

function toAbsolute(src) {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) return `${baseUrl}${src}`
  return `${baseUrl}/${src}`
}

for (const route of routes) {
  const url = `${baseUrl}${route}`
  try {
    const { response, text } = await fetchText(url, 'text/html')
    results.push({ route, status: response.status, bytes: text.length, assetCountBefore: assets.size })
    if (!response.ok) failures.push(`${route} returned HTTP ${response.status}`)
    for (const match of text.matchAll(scriptSrcPattern)) {
      const src = match[1]
      if (src && src.includes('.js')) assets.add(toAbsolute(src))
    }
  } catch (error) {
    failures.push(`${route} fetch error: ${error.message}`)
  }
}

for (const assetUrl of assets) {
  try {
    const { response, text } = await fetchText(assetUrl, 'application/javascript,text/javascript,*/*')
    const matches = forbiddenStrings.filter((value) => value && text.includes(value))
    results.push({ route: assetUrl.replace(baseUrl, ''), status: response.status, bytes: text.length, matches, asset: true })
    if (!response.ok) failures.push(`${assetUrl} returned HTTP ${response.status}`)
    for (const match of matches) failures.push(`${assetUrl} leaked forbidden string in client bundle: ${match}`)
  } catch (error) {
    failures.push(`${assetUrl} fetch error: ${error.message}`)
  }
}

console.log(JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), assetCount: assets.size, results }, null, 2))

if (failures.length) {
  console.error('Production client bundle leakage probe failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok production client JS bundles contain no forbidden source/provenance strings')
