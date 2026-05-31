// lib/scrapers/mock-used-surplus-feed.ts
// Returns mock ScrapeRunResult entries for the used-surplus-preview dev endpoint.
// Uses ScrapeRunResult from types — no synthetic candidate array (counts only).

import { usedSurplusSources } from './used-surplus-sources'
import type { ScrapeRunResult } from './types'

export async function getMockUsedSurplusFeed(): Promise<ScrapeRunResult[]> {
  return usedSurplusSources.map((source, index) => {
    const isEnabled = source.status === 'enabled'
    return {
      source,
      status: isEnabled ? 'ok' : 'skipped',
      candidatesFound: isEnabled ? index + 1 : 0,
      candidatesInserted: isEnabled ? index + 1 : 0,
      candidatesSkipped: 0,
      durationMs: isEnabled ? 320 + index * 40 : 0,
      error: !isEnabled ? 'Source pending parser validation before automated intake.' : undefined,
    } satisfies ScrapeRunResult
  })
}
