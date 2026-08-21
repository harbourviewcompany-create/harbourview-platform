/**
 * Read a human-readable message off an unknown caught value.
 *
 * The clinical source-currentness probes all used `catch (err: any)` so they
 * could write `err?.message || err`. That silences
 * `@typescript-eslint/no-explicit-any` at the cost of the one place TypeScript
 * genuinely cannot know the type — a catch binding really is `unknown`, and
 * asserting otherwise is how a non-Error throw turns into `undefined` in a log
 * line. This narrows instead, and preserves the previous fallback of
 * stringifying whatever was thrown.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return String(err)
}
