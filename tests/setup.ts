// tests/setup.ts
// Global vitest setup, loaded before every test file (see vitest.config.ts
// `test.setupFiles`).

// next.config.mjs sets experimental.authInterrupts: true, which is required
// for unauthorized()/forbidden() (from 'next/navigation', used throughout
// lib/auth/adminGuard.ts and lib/auth/require-auth.ts -- 19 route handlers
// as of 2026-07-06) to work at all. In the real app this is read from
// next.config.mjs by Next's dev/build/start server, which sets
// process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS internally before any
// route code runs.
//
// Vitest never boots that server -- a test that imports and calls a route
// handler directly skips Next's config-loading step entirely, so this env
// var is never set and unauthorized()/forbidden() throw
// "`unauthorized()` is experimental and only allowed to be used when
// `experimental.authInterrupts` is enabled" even though the real app has it
// correctly enabled. Set it here so tests see the same runtime behavior the
// actual deployed app has, rather than a config-loading artifact of the test
// environment.
process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS = '1'
