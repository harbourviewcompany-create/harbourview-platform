import 'server-only'

/**
 * Guard for Supabase queries on ISR-rendered public pages.
 *
 * Next.js keeps the last successfully generated page only when regeneration
 * THROWS. A page that catches a query failure and renders an empty state looks
 * like a successful render, so the good page is replaced by the empty one for
 * the whole revalidate window — a transient PostgREST blip becomes a 15-60
 * minute outage of published content.
 *
 * Before ISR this did not matter: `force-dynamic` pages re-queried on every
 * request, so a failed render affected exactly one response. It matters now.
 *
 * Build time is the one case where throwing is wrong: these pages prerender
 * during `next build`, and an unconfigured or unreachable Supabase would fail
 * the entire build — a failure mode `force-dynamic` never had. So errors are
 * swallowed during the production build only.
 *
 * Note this guards *query errors*, not empty results. A successful query that
 * returns no rows is a genuinely empty page and must stay cacheable.
 *
 * Usage — capture `error`, which most of these call sites used to discard:
 *
 *     const { data, error } = await client.from('x').select('...')
 *     guardIsrQuery(error, 'markets: jurisdiction_briefings')
 *     if (!data) return []
 */
export function guardIsrQuery(
  error: { message?: string } | null | undefined,
  context: string,
): void {
  if (!error) return

  const message = error.message ?? String(error)

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.error(`[isr] ${context} failed during build, rendering empty: ${message}`)
    return
  }

  throw new Error(`[isr] ${context} failed: ${message}`)
}
