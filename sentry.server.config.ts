// Sentry server-side (Node.js runtime) initialization.
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Redact anything that looks like a secret/credential/service-role token
  // before it ever leaves the process, on top of Sentry's own default PII
  // scrubbing. Defense in depth given this codebase's service-role clients.
  beforeSend(event) {
    const scrub = (value: string) =>
      value
        .replace(/service_role[^\s"']*/gi, 'service_role:[redacted]')
        .replace(/sb-[a-z0-9-]+-auth-token[^\s"']*/gi, '[redacted-auth-cookie]')
        .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[redacted-jwt]')

    if (event.message) event.message = scrub(event.message)
    if (event.exception?.values) {
      for (const exc of event.exception.values) {
        if (exc.value) exc.value = scrub(exc.value)
      }
    }
    return event
  },

  enabled: Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
})
