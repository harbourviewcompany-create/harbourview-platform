import type { HvDailyDigestPublicDto } from '@/lib/harbourview/dto'

// Fallback content when daily_digest has no published row yet (or the query
// fails) — keeps the signals tab / /daily page from rendering an empty
// shell before the first digest publishes.
export const DAILY_DIGEST_FIXTURE: HvDailyDigestPublicDto = {
  digest_date: '2026-01-01',
  generated_at: '2026-01-01T07:00:00Z',
  markets: ['Global'],
  headlines: [
    {
      headline: 'Harbourview Daily is preparing today’s edition.',
      why_it_matters:
        'Qualified regulatory, licensing and market signals are reviewed each morning before publication. Check back shortly for today’s briefing.',
      market: 'Global',
      whats_next: null,
      signal_id: null,
      event_key: null,
      prior_event_key: null,
      delta_status: null,
      advancement_reason: null,
      jurisdiction: 'Global',
      entities: [],
      priority_domain: 'other',
      verified_facts: [],
      inferences: [],
      competitive_position_change: false,
      competitive_position_detail: null,
    },
  ],
  editorial_headlines: [],
}
