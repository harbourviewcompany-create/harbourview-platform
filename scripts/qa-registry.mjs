#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const qaRegistry = [
  {
    id: 'test:visibility',
    purpose: 'Verify public provenance visibility and business opportunities leakage protections.',
    category: 'public-surface',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:services-public-leakage',
    purpose: 'Ensure service listings do not leak non-public fields.',
    category: 'public-surface',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:used-surplus-public-leakage',
    purpose: 'Verify used/surplus pages only expose allowlisted public fields.',
    category: 'public-surface',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:intelligence-globe-leakage',
    purpose: 'Prevent intelligence globe data leaks to public routes.',
    category: 'public-surface',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:compliance-visibility',
    purpose: 'Check compliance pages show expected public content labels and guards.',
    category: 'compliance',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:regulatory-signals-contract',
    purpose: 'Validate regulatory signals contract shape and stability.',
    category: 'compliance',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:regulatory-signals-public-leakage',
    purpose: 'Verify regulatory signals public responses do not leak sensitive fields.',
    category: 'compliance',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:admin-guard',
    purpose: 'Confirm admin route and role guards enforce access control boundaries.',
    category: 'security',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:intake-workflow-safety',
    purpose: 'Validate intake workflow safety and non-public workflow protections.',
    category: 'security',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:full-scope-launch-readiness',
    purpose: 'Run consolidated marketplace/full-scope readiness checks.',
    category: 'marketplace',
    requiredEnvContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'smoke:marketplace',
    purpose: 'Run marketplace smoke tests for inquiry entry points.',
    category: 'marketplace',
    requiredEnvContext: 'Requires marketplace smoke environment variables and Supabase connectivity.',
  },
  {
    id: 'smoke:marketplace:rls',
    purpose: 'Verify marketplace RLS constraints under smoke conditions.',
    category: 'marketplace',
    requiredEnvContext: 'Requires marketplace smoke environment variables and Supabase connectivity.',
  },
]

const bundleDefinitions = {
  all: () => qaRegistry,
  'public-surface': () => qaRegistry.filter((entry) => entry.category === 'public-surface'),
  compliance: () => qaRegistry.filter((entry) => entry.category === 'compliance'),
  smoke: () => qaRegistry.filter((entry) => ['marketplace', 'security'].includes(entry.category)),
}

function parseSelection(argv) {
  const bundleFlag = argv.find((arg) => arg.startsWith('--bundle='))
  const idsFlag = argv.find((arg) => arg.startsWith('--ids='))

  if (bundleFlag && idsFlag) {
    console.error('Use either --bundle or --ids, not both.')
    process.exit(2)
  }

  if (bundleFlag) {
    const bundle = bundleFlag.split('=')[1]
    const selector = bundleDefinitions[bundle]
    if (!selector) {
      console.error(`Unknown bundle: ${bundle}`)
      process.exit(2)
    }
    return selector().slice().sort((a, b) => a.id.localeCompare(b.id))
  }

  if (idsFlag) {
    const ids = idsFlag
      .split('=')[1]
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    const selected = ids.map((id) => qaRegistry.find((entry) => entry.id === id)).filter(Boolean)
    if (selected.length !== ids.length) {
      const knownIds = qaRegistry.map((entry) => entry.id).sort().join(', ')
      console.error(`Unknown id in --ids list. Known ids: ${knownIds}`)
      process.exit(2)
    }
    return selected.slice().sort((a, b) => a.id.localeCompare(b.id))
  }

  return qaRegistry.slice().sort((a, b) => a.id.localeCompare(b.id))
}

function runEntries(entries) {
  const results = []
  for (const entry of entries) {
    console.log(`\n=== RUN ${entry.id} [${entry.category}] ===`)
    const result = spawnSync('npm', ['run', entry.id], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    results.push({ id: entry.id, category: entry.category, status: result.status === 0 ? 'PASS' : 'FAIL' })
  }

  console.log('\nQA SUMMARY')
  for (const result of results) {
    console.log(`${result.status} ${result.id} [${result.category}]`)
  }

  const failureCount = results.filter((result) => result.status === 'FAIL').length
  console.log(`TOTAL ${results.length} | PASS ${results.length - failureCount} | FAIL ${failureCount}`)

  if (failureCount > 0) {
    process.exit(1)
  }
}

if (process.argv.includes('--list')) {
  console.log(JSON.stringify(qaRegistry.slice().sort((a, b) => a.id.localeCompare(b.id)), null, 2))
  process.exit(0)
}

const selectedEntries = parseSelection(process.argv.slice(2))
runEntries(selectedEntries)
