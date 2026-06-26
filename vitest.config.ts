import { defineConfig, defaultExclude } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    exclude: [...defaultExclude, '.claude/**'],
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
