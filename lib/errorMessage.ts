/**
 * Read a human-readable message off an unknown caught value.
 *
 * A catch binding genuinely *is* `unknown` — it is the one place TypeScript
 * cannot know the type. Annotating it `any` to write `err?.message || err`
 * silences `@typescript-eslint/no-explicit-any` at the cost of correctness:
 * that is how a non-Error throw turns into `undefined` in a log line, or into
 * a blank string in a UI error banner. This narrows instead.
 *
 * `fallback` exists so the two call shapes already in the codebase both keep
 * their exact previous behaviour:
 *   - `err?.message || err`            -> errorMessage(err)
 *   - `e?.message ?? 'Unable to apply'` -> errorMessage(e, 'Unable to apply')
 * Without a fallback an unrecognised throw is stringified, which is what the
 * logging call sites want. With one, it is preferred over stringifying — which
 * is what the UI call sites want, since `String({})` renders as
 * "[object Object]" in an error banner.
 *
 * Originally written for the clinical source-currentness probes; promoted here
 * when the talent job-board routes and components needed the same thing.
 * `lib/clinical/errorMessage.ts` re-exports it so existing imports still work.
 */
export function errorMessage(err: unknown, fallback?: string): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return fallback ?? String(err)
}
