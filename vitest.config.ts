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
    exclude: [...defaultExclude, '.claude/**'],
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
