#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const manifestPath = path.join(root, 'config', 'environment-manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

function flattenManifestEntries(value) {
  if (Array.isArray(value.variables)) return value.variables
  if (!Array.isArray(value.groups)) return []
  return value.groups.flatMap((group) =>
    (group.names ?? []).map((name) => ({
      ...group,
      name,
    })),
  )
}

const entries = flattenManifestEntries(manifest)
const declaredNames = entries.map((entry) => entry.name)
const declared = new Set(declaredNames)
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

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.open-next') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full, predicate))
    else if (predicate(full)) out.push(full)
  }
  return out
}

const files = [
  ...scanRoots.flatMap((dir) => walk(path.join(root, dir), (file) => extensions.has(path.extname(file)))),
  ...rootFiles.map((file) => path.join(root, file)).filter(fs.existsSync),
]

const patterns = [
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
  /(?:getEnvFlag|requireEnv|readEnv|env)\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g,
]

const references = new Map()
function addReference(name, source) {
  if (!references.has(name)) references.set(name, new Set())
  references.get(name).add(source)
}

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) {
      addReference(match[1], path.relative(root, file).replaceAll(path.sep, '/'))
    }
  }
}

// Deployment workflows are part of the environment contract. Capture:
// 1. keys declared under any YAML `env:` block;
// 2. `${{ secrets.NAME }}` references even when passed directly to an action;
// 3. `${{ env.NAME }}` references.
const workflowDir = path.join(root, '.github', 'workflows')
const workflowFiles = walk(workflowDir, (file) => /\.ya?ml$/i.test(file))
for (const file of workflowFiles) {
  const source = path.relative(root, file).replaceAll(path.sep, '/')
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  let envIndent = null

  for (const line of lines) {
    const indent = line.match(/^\s*/)?.[0].length ?? 0
    const trimmed = line.trim()

    if (/^env:\s*(?:#.*)?$/.test(trimmed)) {
      envIndent = indent
      continue
    }

    if (envIndent !== null) {
      if (trimmed && indent <= envIndent) {
        envIndent = null
      } else {
        const keyMatch = line.match(/^\s*([A-Z][A-Z0-9_]*):(?:\s|$)/)
        if (keyMatch) addReference(keyMatch[1], source)
      }
    }
  }

  for (const pattern of [
    /\bsecrets\.([A-Z][A-Z0-9_]*)\b/g,
    /\benv\.([A-Z][A-Z0-9_]*)\b/g,
  ]) {
    for (const match of text.matchAll(pattern)) addReference(match[1], source)
  }
}

const missing = [...references.keys()].filter((name) => !declared.has(name)).sort()
const duplicates = declaredNames.filter((name, index, all) => all.indexOf(name) !== index)
const forbidden = entries
  .filter((entry) => entry.status === 'live')
  .map((entry) => entry.name)
  .filter((name) => forbiddenPublicPrefixes.some((prefix) => name.startsWith(prefix)))

const allowedStages = new Set(['Build only', 'Runtime only', 'Build + Runtime', 'CI/Deploy only'])
const allowedSensitivities = new Set(['Plain variable', 'Secret'])
const malformed = entries.filter((entry) =>
  !entry.name ||
  !allowedStages.has(entry.stage) ||
  !allowedSensitivities.has(entry.sensitivity) ||
  !entry.provider ||
  !entry.requirement ||
  !entry.status
)

const healthRequired = new Map([
  ['NEXT_PUBLIC_SUPABASE_URL', 'Settings → Variables and Secrets → Variable'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Settings → Variables and Secrets → Secret'],
])
const healthProblems = []
for (const [name, expectedPlacement] of healthRequired) {
  const entry = entries.find((candidate) => candidate.name === name)
  if (!entry) healthProblems.push(`${name}: missing from manifest`)
  else if (entry.cloudflare?.intelligenceHealthWorker !== expectedPlacement) {
    healthProblems.push(`${name}: expected Cloudflare health-worker placement ${JSON.stringify(expectedPlacement)}`)
  }
}

if (missing.length) {
  console.error('Environment manifest is missing static application/config/workflow references:')
  for (const name of missing) {
    console.error(`  - ${name}: ${[...references.get(name)].join(', ')}`)
  }
}
if (duplicates.length) console.error(`Environment manifest contains duplicate names: ${[...new Set(duplicates)].join(', ')}`)
if (forbidden.length) console.error(`Forbidden browser-exposed Hugging Face variables are marked live: ${forbidden.join(', ')}`)
if (malformed.length) console.error(`Environment manifest contains malformed entries: ${malformed.map((entry) => entry.name || '<unnamed>').join(', ')}`)
if (healthProblems.length) {
  console.error('Cloudflare intelligence-health Worker placement errors:')
  for (const problem of healthProblems) console.error(`  - ${problem}`)
}

const failed = missing.length || duplicates.length || forbidden.length || malformed.length || healthProblems.length
if (failed) process.exit(1)

console.log(`Environment manifest GO: ${entries.length} variables classified; ${references.size} static application/config/workflow references covered.`)
console.log(`Workflow files scanned: ${workflowFiles.length}. Dynamic contracts declared: ${(manifest.dynamicContracts ?? []).length}.`)
