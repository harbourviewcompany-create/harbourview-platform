#!/usr/bin/env node

// Netlify build ignore command contract:
//   exit 0 = ignore/cancel build
//   exit 1 = continue build
//
// Policy:
//   - Build only main, preview/* and deploy/*.
//   - Ignore ordinary feature/*, fix/*, cloudflare/*, vercel/* and bot/generated branches.
//   - Ignore all other unrecognized branches by default.
//
// Site overrides (checked before context/branch logic):
//   - harbourview-platform: never build — this app deploys via Vercel and Cloudflare Workers.

const siteName = process.env.SITE_NAME || process.env.NETLIFY_SITE_NAME || ''

// This repo's canonical deployments are Vercel (production) and Cloudflare Workers/Pages.
// The harbourview-platform Netlify project is a stale integration — cancel all its builds.
if (siteName === 'harbourview-platform') {
  console.log(`Netlify ignore: site '${siteName}' deploys via Vercel/Cloudflare; cancel build.`)
  process.exit(0)
}

const branch =
  process.env.BRANCH ||
  process.env.HEAD ||
  process.env.GITHUB_HEAD_REF ||
  process.env.GITHUB_REF_NAME ||
  ''

const context = process.env.CONTEXT || ''

if (context === 'production' || branch === 'main') {
  console.log('Netlify ignore: production/main build allowed.')
  process.exit(1)
}

if (!branch) {
  console.log('Netlify ignore: branch unknown outside production; cancel build.')
  process.exit(0)
}

const allowedPrefixes = ['preview/', 'deploy/']
const skippedPrefixes = [
  'feature/',
  'fix/',
  'cloudflare/',
  'vercel/',
  'dependabot/',
  'renovate/',
  'github-actions/',
  'bot/',
  'claude/',
  'codex/',
]

if (allowedPrefixes.some((prefix) => branch.startsWith(prefix))) {
  console.log(`Netlify ignore: deploy-intent branch '${branch}' allowed.`)
  process.exit(1)
}

if (skippedPrefixes.some((prefix) => branch.startsWith(prefix))) {
  console.log(`Netlify ignore: branch '${branch}' canceled.`)
  process.exit(0)
}

console.log(`Netlify ignore: branch '${branch}' is not allowlisted; cancel build.`)
process.exit(0)
