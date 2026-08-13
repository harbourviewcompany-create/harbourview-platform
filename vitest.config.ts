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
      'tests/e2e/**',
      'tests/scripts/*.test.mjs',
      'supabase/functions/**/*.test.ts',
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
