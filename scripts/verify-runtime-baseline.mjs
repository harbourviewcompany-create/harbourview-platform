import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function parse(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) throw new Error(`Cannot parse version: ${version}`)
  return match.slice(1).map(Number)
}

function gte(actual, minimum) {
  const a = parse(actual)
  const b = parse(minimum)
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true
    if (a[i] < b[i]) return false
  }
  return true
}

const versions = {
  node: process.versions.node,
  next: require('next/package.json').version,
  supabase: require('@supabase/supabase-js/package.json').version,
  playwright: require('@playwright/test/package.json').version,
  typescript: require('typescript/package.json').version,
}

const failures = []
const nodeMajor = parse(versions.node)[0]
if (nodeMajor !== 22) failures.push(`Node.js must be 22.x; resolved ${versions.node}`)
if (!gte(versions.next, '16.2.11')) failures.push(`Next.js security floor is 16.2.11; resolved ${versions.next}`)
if (!gte(versions.playwright, '1.62.0')) failures.push(`Playwright baseline is 1.62.0; resolved ${versions.playwright}`)
if (!gte(versions.typescript, '5.0.0')) failures.push(`TypeScript floor is 5.0.0; resolved ${versions.typescript}`)

console.log(JSON.stringify({ status: failures.length ? 'HOLD' : 'GO', versions }, null, 2))

if (failures.length) {
  for (const failure of failures) console.error(`HOLD: ${failure}`)
  process.exit(1)
}
