// Sentry client-side (browser) initialization.
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// Requires NEXT_PUBLIC_SENTRY_DSN to be set (safe to expose — DSNs are not
// secret, they only accept writes). If unset, Sentry.init() no-ops safely.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  // Trace a sample of transactions for performance monitoring. Keep low in
  // production to control event volume/cost; raise temporarily when
  // investigating a specific regression.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay — only capture replays on error, never sample healthy
  // sessions by default (cost + PII surface control for a B2B intel product).
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text/media by default — this app renders confidential
      // counterparty and marketplace data; err toward over-redaction.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Don't send events when no DSN is configured (local dev without Sentry set up).
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
})
