import 'server-only'

import { createPublicAnonClient } from '@/lib/supabase/server'
import { toHvDailyDigestPublicDto, type HvDailyDigestPublicDto, type HvDigestHeadlineDto, type HvEditorialHeadlineDto } from '@/lib/harbourview/dto'
import { DAILY_DIGEST_FIXTURE } from '@/lib/fixtures/dailyDigest'

export type DailyDigestResult = {
  digest: HvDailyDigestPublicDto
  source: 'live' | 'fixture'
}

/**
 * Latest published daily_digest, projected through the public DTO so no raw
 * ia_signals/daily_digest columns (source_id, notes, confidence, etc.) reach
 * the client. Falls back to a fixture when no digest has published yet or
 * the query fails.
 */
export async function getLatestDailyDigest(): Promise<DailyDigestResult> {
  try {
    // Anonymous client: /daily is identical for every visitor, and the
    // daily_digest RLS policy already grants anon SELECT on status='published'.
    // Using the cookie-bound client here would force the page to render
    // dynamically on every request.
    const supabase = createPublicAnonClient()
    const { data, error } = await supabase
      .from('daily_digest')
      .select('digest_date, generated_at, markets, headlines, editorial_headlines')
      .eq('status', 'published')
      .order('digest_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return { digest: DAILY_DIGEST_FIXTURE, source: 'fixture' }

    const digest = toHvDailyDigestPublicDto(data)
    // A digest can be editorial-only (no qualified trade signals that day)
    // or signal-only — only fall back to the fixture if genuinely empty.
    if (digest.headlines.length === 0 && digest.editorial_headlines.length === 0) {
      return { digest: DAILY_DIGEST_FIXTURE, source: 'fixture' }
    }
    return { digest, source: 'live' }
  } catch {
    return { digest: DAILY_DIGEST_FIXTURE, source: 'fixture' }
  }
}

/** Headlines for one market, falling back to Global-tagged headlines if the market has none. */
export function headlinesForMarket(digest: HvDailyDigestPublicDto, market: string): HvDigestHeadlineDto[] {
  const needle = market.trim().toLowerCase()
  const matched = digest.headlines.filter((h) => h.market.trim().toLowerCase() === needle)
  if (matched.length > 0) return matched
  return digest.headlines.filter((h) => h.market.trim().toLowerCase() === 'global')
}

/** Editorial headlines for one market, falling back to Global-tagged items if the market has none. */
export function editorialHeadlinesForMarket(digest: HvDailyDigestPublicDto, market: string): HvEditorialHeadlineDto[] {
  const needle = market.trim().toLowerCase()
  const matched = digest.editorial_headlines.filter((h) => h.market.trim().toLowerCase() === needle)
  if (matched.length > 0) return matched
  return digest.editorial_headlines.filter((h) => h.market.trim().toLowerCase() === 'global')
}

/** Human-readable digest edition date, falling back to the raw value if it doesn't parse. */
export function formatDigestDateLabel(digestDate: string): string {
  const parsed = new Date(`${digestDate}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return digestDate
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}
