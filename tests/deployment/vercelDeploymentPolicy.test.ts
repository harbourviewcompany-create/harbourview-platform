import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

type DeploymentRules = boolean | Record<string, boolean>

type VercelConfig = {
  git?: {
    deploymentEnabled?: DeploymentRules
  }
  ignoreCommand?: string
}

const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8')) as VercelConfig
const manualPreviewWorkflow = fs.readFileSync('.github/workflows/deploy-preview.yml', 'utf8')

const expectedRules: Record<string, boolean> = {
  '**': false,
  main: true,
  'preview/*': true,
}

function matchesKnownRule(pattern: string, branch: string): boolean {
  if (pattern === '**') return true
  if (pattern === 'main') return branch === 'main'
  if (pattern === 'preview/*') return /^preview\/[^/]+$/.test(branch)
  throw new Error(`Unexpected deploymentEnabled pattern in contract test: ${pattern}`)
}

function deploymentEnabledFor(branch: string): boolean {
  const rules = config.git?.deploymentEnabled
  if (typeof rules === 'boolean') return rules
  if (!rules) return true

  const matches = Object.entries(rules).filter(([pattern]) => matchesKnownRule(pattern, branch))

  // Current Vercel semantics: an unmatched branch defaults to enabled, and if
  // multiple patterns match, any matching true rule enables the deployment.
  if (matches.length === 0) return true
  return matches.some(([, enabled]) => enabled)
}

describe('Vercel deployment admission policy', () => {
  it('is fail-closed and allows only main plus one-level preview/* branches', () => {
    expect(config.git?.deploymentEnabled).toEqual(expectedRules)
  })

  it.each([
    ['main', true],
    ['preview/manual-release-candidate', true],
    ['sync/intel-main-3', false],
    ['dependabot/npm_and_yarn/next-16.3.3', false],
    ['feat/new-surface', false],
    ['fix/runtime-repair', false],
    ['agent/autonomous-change', false],
    ['future-prefix/something-new', false],
    ['release-candidate', false],
    ['preview/team/nested-branch', false],
  ])('resolves %s to deploymentEnabled=%s', (branch, expected) => {
    expect(deploymentEnabledFor(branch)).toBe(expected)
  })

  it('preserves the explicit manual preview workflow contract', () => {
    expect(manualPreviewWorkflow).toContain('workflow_dispatch:')
    expect(manualPreviewWorkflow).toContain("SAFE_BRANCH=$(echo \"$SOURCE_BRANCH\" | tr '/' '-')")
    expect(manualPreviewWorkflow).toContain('PREVIEW_BRANCH="preview/${SAFE_BRANCH}"')
  })

  it('keeps ignoreCommand only as a second-layer build control', () => {
    expect(config.ignoreCommand).toBe('bash scripts/vercel-ignore-wbcc-only.sh')
  })
})
