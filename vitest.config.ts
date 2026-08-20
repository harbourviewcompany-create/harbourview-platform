import { defineConfig, defaultExclude } from 'vitest/config'
import { transformWithEsbuild } from 'vite'
import path from 'path'

/**
 * Known-failing suites, quarantined so that the other 126 test files can run
 * as the default gate instead of the 10 that `npm test` used to cover.
 *
 * Every entry below fails on `origin/main` as of 2026-08-20 — they are
 * pre-existing failures, not newly broken tests, and each needs its own
 * diagnosis (several look like genuine product defects rather than stale
 * assertions). This list is a work queue, not a resting place: run them with
 * `npm run test:quarantined`, and delete each line as it goes green.
 *
 * `npm run test:full` ignores this list entirely and runs everything.
 */
const QUARANTINED_SUITES = [
  'tests/clinical/clinicalInteractionQuerySource.test.ts',
  'tests/clinical/corpusDepthRelease.test.ts',
  'tests/clinical/evidenceOperatingSystem.test.ts',
  'tests/clinical/evidenceV11Operations.test.ts',
  'tests/dashboard/dashboardMarketplaceRows.test.ts',
  'tests/dashboard/marketplaceMediaMergeReadiness.test.ts',
  'tests/dashboard/mobileCommandCentreV2.test.ts',
  'tests/dashboard/mobileIntelInstitutional.test.tsx',
  'tests/globe-russia-radial-clearance.test.ts',
  'tests/harbourview/p0-identity-org-context.test.ts',
  'tests/intel/decisionIntelFirstSlice.test.ts',
]

const runQuarantined = process.env.HARBOURVIEW_RUN_QUARANTINED === '1'

export default defineConfig({
  plugins: [
    {
      name: 'vitest-pre-tsx-transform',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) return
        if (id.includes('/node_modules/')) return
        return transformWithEsbuild(code, id, {
          loader: 'tsx',
          jsx: 'automatic',
          jsxImportSource: 'react',
        })
      },
    },
  ],
  test: {
    environment: 'node',
    globals: false,
    exclude: [
      ...defaultExclude,
      '.claude/**',
      'tests/e2e/**',
      'tests/scripts/*.test.mjs',
      'supabase/functions/**/*.test.ts',
      ...(runQuarantined ? [] : QUARANTINED_SUITES),
    ],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, '__mocks__/server-only.ts'),
    },
  },
})
