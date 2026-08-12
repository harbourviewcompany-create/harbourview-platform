import { defineConfig, defaultExclude } from 'vitest/config'
import { transformWithEsbuild } from 'vite'
import path from 'path'

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
      // Playwright specs: run only via `npx playwright test tests/e2e/`
      // (see package.json `test:e2e`). Vitest's default glob matches
      // `*.spec.ts`/`*.spec.js` too, which picks these up and fails them
      // with "Playwright Test did not expect test.describe() to be called
      // here" since they're written against @playwright/test, not vitest.
      'tests/e2e/**',
      // Plain Node test-runner suites (`import test from 'node:test'`), each
      // with its own dedicated CI workflow that runs `node --test <file>`
      // directly (migration-drift-check.yml, pending-migration-decision-
      // verification.yml). Vitest doesn't recognize node:test's registration
      // API, so it reports "No test suite found" rather than running them.
      'tests/scripts/*.test.mjs',
      // Supabase Edge Function tests run under the Deno runtime
      // (`deno test ...`, see source-expansion-wave1.yml) and use
      // `Deno.test(...)`, which doesn't exist in Vitest's Node environment.
      'supabase/functions/**/*.test.ts',
    ],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // 'server-only' throws at runtime outside Next.js — alias to a no-op shim
      // so lib/hf/** and other server-only modules can be tested in Vitest.
      'server-only': path.resolve(__dirname, '__mocks__/server-only.ts'),
    },
  },
})
