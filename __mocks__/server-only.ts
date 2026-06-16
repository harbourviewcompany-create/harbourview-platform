// __mocks__/server-only.ts
//
// 'server-only' throws at import time when bundled into a client/browser
// context — that's its entire job in Next.js. Under Vitest (Node env, no
// Next.js bundler), importing the real package is unnecessary and some
// versions throw outside of webpack/turbopack entirely, which breaks any
// test importing a module that starts with `import 'server-only'`
// (e.g. lib/hf/env.ts, lib/hf/client.ts).
//
// This file is aliased in vitest.config.ts so 'server-only' resolves to a
// no-op in tests, while production builds still use the real package and
// get its real client-bundle protection.

export {};
