import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const activeYamlLines = (raw: string) =>
  raw
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n')

describe('CI infrastructure hygiene', () => {
  it('keeps PR runs cancellable while allowing running main pushes to finish', () => {
    const ci = read('.github/workflows/ci.yml')

    expect(ci).toContain('group: ci-${{ github.ref }}')
    expect(ci).toContain("cancel-in-progress: ${{ github.event_name == 'pull_request' }}")
    expect(ci).not.toContain('cancel-in-progress: true')
  })

  it('keeps E2E main-push-only, optional-credential-aware, and diagnoses readiness before Playwright', () => {
    const ci = read('.github/workflows/ci.yml')
    const e2eStart = ci.indexOf('  e2e:')
    const e2e = ci.slice(e2eStart)

    expect(e2eStart).toBeGreaterThan(-1)
    expect(e2e).toContain('needs: build')
    expect(e2e).toContain("if: github.event_name == 'push' && github.ref == 'refs/heads/main'")
    expect(e2e).toContain('name: Check optional E2E credentials')
    expect(e2e).toContain("if: steps.e2e-creds.outputs.configured == 'true'")
    expect(e2e).toContain("if: steps.e2e-creds.outputs.configured != 'true'")

    const credentialGateIndex = e2e.indexOf('name: Check optional E2E credentials')
    const readinessIndex = e2e.indexOf('name: Supabase E2E readiness')
    const playwrightInstallIndex = e2e.indexOf('npx playwright install --with-deps chromium')
    const e2eRunIndex = e2e.indexOf('npm run test:e2e')

    expect(readinessIndex).toBeGreaterThan(credentialGateIndex)
    expect(playwrightInstallIndex).toBeGreaterThan(readinessIndex)
    expect(e2eRunIndex).toBeGreaterThan(playwrightInstallIndex)
    expect(e2e).toContain('node scripts/check-supabase-e2e-readiness.mjs')
  })
})

describe('Figma token workflow hygiene', () => {
  it('remains valid, manual-only, and has an executable sync job', () => {
    const raw = read('.github/workflows/sync-figma-tokens.yml')
    const active = activeYamlLines(raw)

    expect(active).toMatch(/^\s*workflow_dispatch:\s*$/m)
    expect(active).not.toMatch(/^\s*push:\s*$/m)
    expect(active).not.toMatch(/^\s*pull_request:\s*$/m)
    expect(active).not.toMatch(/^\s*schedule:\s*$/m)
    expect(active).toMatch(/^\s*sync-tokens:\s*$/m)
    expect(active).toContain('runs-on: ubuntu-latest')
    expect(active).toContain(
      'commit-message: "${{ github.event.inputs.commit_message || \'chore: Sync design tokens from Figma\' }}"',
    )
  })

  it('does not require active Figma API credentials in the current execution path', () => {
    const raw = read('.github/workflows/sync-figma-tokens.yml')
    const active = activeYamlLines(raw)

    expect(active).not.toContain('FIGMA_TOKEN:')
    expect(active).not.toContain('FIGMA_FILE_KEY:')
    expect(active).not.toContain('scripts/fetch-figma-tokens.js')
    expect(active).toContain('npm run tokens:generate || npx style-dictionary build --config ./style-dictionary.config.js')
  })
})
