#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const qaRegistry = [
  {
    id: 'test:visibility',
    purpose: 'Verify public provenance visibility and business opportunities leakage protections.',
    category: 'public-surface',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:services-public-leakage',
    purpose: 'Ensure service listings do not leak non-public fields.',
    category: 'public-surface',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:used-surplus-public-leakage',
    purpose: 'Verify used/surplus pages only expose allowlisted public fields.',
    category: 'public-surface',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:intelligence-globe-leakage',
    purpose: 'Prevent intelligence globe data leaks to public routes.',
    category: 'public-surface',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:compliance-visibility',
    purpose: 'Check compliance pages show expected public content labels and guards.',
    category: 'compliance',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:regulatory-signals-contract',
    purpose: 'Validate regulatory signals contract shape and stability.',
    category: 'compliance',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:regulatory-signals-public-leakage',
    purpose: 'Verify regulatory signals public responses do not leak sensitive fields.',
    category: 'compliance',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:admin-guard',
    purpose: 'Confirm admin route and role guards enforce access control boundaries.',
    category: 'security',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:intake-workflow-safety',
    purpose: 'Validate intake workflow safety and non-public workflow protections.',
    category: 'security',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'test:full-scope-launch-readiness',
    purpose: 'Run consolidated marketplace/full-scope readiness checks.',
    category: 'marketplace',
    requiredContext: 'Node.js runtime and local repository checkout.',
  },
  {
    id: 'smoke:marketplace',
    purpose: 'Run marketplace smoke tests for inquiry entry points.',
    category: 'marketplace',
    requiredContext: 'Requires marketplace smoke environment variables and Supabase connectivity.',
  },
  {
    id: 'smoke:marketplace:rls',
    purpose: 'Verify marketplace RLS constraints under smoke conditions.',
    category: 'marketplace',
    requiredContext: 'Requires marketplace smoke environment variables and Supabase connectivity.',
  },
]

const bundleDefinitions = {
  all: () => qaRegistry,
  'public-surface': () => qaRegistry.filter((entry) => entry.category === 'public-surface'),
  compliance: () => qaRegistry.filter((entry) => entry.category === 'compliance'),
  smoke: () => qaRegistry.filter((entry) => ['marketplace', 'security'].includes(entry.category)),
}

function selectEntries(argv) {
  const bundleFlag = argv.find((arg) => arg.startsWith('--bundle='))
  const idsFlag = argv.find((arg) => arg.startsWith('--ids='))

  if (bundleFlag) {
    const bundle = bundleFlag.split('=')[1]
    const selector = bundleDefinitions[bundle]
    if (!selector) {
      console.error(`Unknown bundle: ${bundle}`)
      process.exit(2)
    }
    return selector()
  }

  if (idsFlag) {
    const ids = idsFlag
      .split('=')[1]
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    const selected = ids.map((id) => qaRegistry.find((entry) => entry.id === id)).filter(Boolean)
    if (selected.length !== ids.length) {
      const knownIds = qaRegistry.map((entry) => entry.id).join(', ')
      console.error(`Unknown id in --ids list. Known ids: ${knownIds}`)
      process.exit(2)
    }
    return selected
  }

  return qaRegistry
}

function runEntries(entries) {
  const results = []
  for (const entry of entries) {
    const result = spawnSync('npm', ['run', entry.id], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    results.push({ id: entry.id, category: entry.category, status: result.status === 0 ? 'PASS' : 'FAIL' })
  }

  const summary = results
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((result) => `${result.status} ${result.id} [${result.category}]`)

  console.log('\nQA SUMMARY')
  for (const line of summary) {
    console.log(line)
  }

  const failureCount = results.filter((result) => result.status === 'FAIL').length
  console.log(`TOTAL ${results.length} | PASS ${results.length - failureCount} | FAIL ${failureCount}`)

  if (failureCount > 0) {
    process.exit(1)
  }
}

if (process.argv.includes('--list')) {
  console.log(JSON.stringify(qaRegistry, null, 2))
  process.exit(0)
}

const selectedEntries = selectEntries(process.argv.slice(2))
runEntries(selectedEntries)
