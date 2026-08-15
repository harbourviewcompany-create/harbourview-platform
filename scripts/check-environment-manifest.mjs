#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const manifestPath = path.join(root, 'config', 'environment-manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

const declared = new Set(manifest.variables.map((entry) => entry.name))
const forbiddenPublicPrefixes = manifest.forbiddenPublicPrefixes ?? []

const scanRoots = ['app', 'components', 'lib']
const rootFiles = [
  'next.config.mjs',
  'instrumentation.ts',
  'sentry.client.config.ts',
  'sentry.server.config.ts',
  'sentry.edge.config.ts',
  'playwright.config.js',
  'wrangler.toml',
]
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.open-next') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (extensions.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

const files = [
  ...scanRoots.flatMap((dir) => walk(path.join(root, dir))),
  ...rootFiles.map((file) => path.join(root, file)).filter(fs.existsSync),
]

const patterns = [
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
  /(?:getEnvFlag|requireEnv|readEnv|env)\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g,
]

const references = new Map()
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) {
      const name = match[1]
      if (!references.has(name)) references.set(name, new Set())
      references.get(name).add(path.relative(root, file).replaceAll(path.sep, '/'))
    }
  }
}

const missing = [...references.keys()].filter((name) => !declared.has(name)).sort()
const duplicates = manifest.variables
  .map((entry) => entry.name)
  .filter((name, index, all) => all.indexOf(name) !== index)
const forbidden = manifest.variables
  .filter((entry) => entry.status === 'live')
  .map((entry) => entry.name)
  .filter((name) => forbiddenPublicPrefixes.some((prefix) => name.startsWith(prefix)))

const healthRequired = new Map([
  ['NEXT_PUBLIC_SUPABASE_URL', 'Settings → Variables and Secrets → Variable'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Settings → Variables and Secrets → Secret'],
])
const healthProblems = []
for (const [name, expectedPlacement] of healthRequired) {
  const entry = manifest.variables.find((candidate) => candidate.name === name)
  if (!entry) healthProblems.push(`${name}: missing from manifest`)
  else if (entry.cloudflare?.intelligenceHealthWorker !== expectedPlacement) {
    healthProblems.push(`${name}: expected Cloudflare health-worker placement ${JSON.stringify(expectedPlacement)}`)
  }
}

if (missing.length) {
  console.error('Environment manifest is missing static application/config references:')
  for (const name of missing) {
    console.error(`  - ${name}: ${[...references.get(name)].join(', ')}`)
  }
}
if (duplicates.length) console.error(`Environment manifest contains duplicate names: ${[...new Set(duplicates)].join(', ')}`)
if (forbidden.length) console.error(`Forbidden browser-exposed Hugging Face variables are marked live: ${forbidden.join(', ')}`)
if (healthProblems.length) {
  console.error('Cloudflare intelligence-health Worker placement errors:')
  for (const problem of healthProblems) console.error(`  - ${problem}`)
}

const failed = missing.length || duplicates.length || forbidden.length || healthProblems.length
if (failed) process.exit(1)

console.log(`Environment manifest GO: ${manifest.variables.length} variables classified; ${references.size} static application/config references covered.`)
console.log(`Dynamic contracts declared: ${(manifest.dynamicContracts ?? []).length}.`)
