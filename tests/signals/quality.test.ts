import { describe, expect, it } from 'vitest'
import {
  EXCLUDED_QUALITY_LABELS,
  SIGNAL_QUALITY_SELECT,
  buildCorroborationIndex,
  corroborationCount,
  displayHeadline,
  displaySummary,
  feedAgeHours,
  freshnessBand,
  isSurfaceable,
  isTranslated,
  originalLanguage,
  originalLanguageLabel,
  resolveConfidence,
  resolveConfidenceBand,
  resolveContentType,
  resolveCountry,
  resolveImpact,
  routeContentType,
  belongsOnSignalsFeed,
  SIGNALS_FEED_CONTENT_TYPE_NOT_IN,
  SIGNALS_FEED_CONTENT_TYPE_OR_FILTER,
} from '@/lib/signals/quality'

describe('quality columns', () => {
  it('is a literal string supabase-js can parse (not runtime-joined)', () => {
    expect(SIGNAL_QUALITY_SELECT).toContain('quality_confidence')
    expect(SIGNAL_QUALITY_SELECT).toContain('cluster_rep_id')
    expect(SIGNAL_QUALITY_SELECT).not.toContain(' ')
  })

  it('never requests the inverted legacy score', () => {
    expect(SIGNAL_QUALITY_SELECT.split(',')).not.toContain('score')
  })
})

describe('resolveConfidence', () => {
  it('scales quality_confidence 0-1 to 0-100', () => {
    expect(resolveConfidence({ quality_confidence: 0.92 })).toBe(92)
    expect(resolveConfidence({ quality_confidence: 0.655 })).toBe(66)
  })

  it('parses numeric strings from PostgREST', () => {
    expect(resolveConfidence({ quality_confidence: '0.80' })).toBe(80)
  })

  it('ignores signals.score entirely — the inverted scorer must never leak', () => {
    // A row the legacy scorer rated 99 (nav chrome) with no classifier verdict
    // and no human review must come back unrated, not 99.
    expect(resolveConfidence({ score: 99 } as never)).toBeNull()
  })

  it('falls back to 90 only for human-reviewed rows with no classifier verdict', () => {
    expect(resolveConfidence({ reviewed: true })).toBe(90)
    expect(resolveConfidence({ reviewed: false })).toBeNull()
  })

  it('clamps out-of-range values', () => {
    expect(resolveConfidence({ quality_confidence: 1.4 })).toBe(100)
    expect(resolveConfidence({ quality_confidence: -0.2 })).toBe(0)
  })
})

describe('resolveConfidenceBand', () => {
  it('bands by the validated score', () => {
    expect(resolveConfidenceBand({ quality_confidence: 0.95 })).toBe('verified')
    expect(resolveConfidenceBand({ quality_confidence: 0.80 })).toBe('high')
    expect(resolveConfidenceBand({ quality_confidence: 0.60 })).toBe('medium')
    expect(resolveConfidenceBand({ quality_confidence: 0.20 })).toBe('low')
    expect(resolveConfidenceBand({})).toBeNull()
  })
})

describe('resolveImpact', () => {
  it('reserves critical for high impact the classifier is confident about', () => {
    expect(resolveImpact({ impact: 'high', quality_confidence: 0.9 })).toBe('critical')
    expect(resolveImpact({ impact: 'high', quality_confidence: 0.7 })).toBe('high')
  })

  it('maps medium to moderate and low to low', () => {
    expect(resolveImpact({ impact: 'medium', quality_confidence: 0.9 })).toBe('moderate')
    expect(resolveImpact({ impact: 'low', quality_confidence: 0.9 })).toBe('low')
  })

  it('returns null when the classifier gave no impact verdict', () => {
    expect(resolveImpact({ quality_confidence: 0.9 })).toBeNull()
  })
})

describe('isSurfaceable', () => {
  it.each(EXCLUDED_QUALITY_LABELS)('excludes %s', (label) => {
    expect(isSurfaceable({ quality_label: label })).toBe(false)
  })

  it('admits genuine signals', () => {
    expect(isSurfaceable({ quality_label: 'signal' })).toBe(true)
  })

  it('admits legacy rows classified before Pipeline B existed', () => {
    // These must not be silently dropped — 40 reviewed rows have a NULL label.
    expect(isSurfaceable({ quality_label: null })).toBe(true)
    expect(isSurfaceable({})).toBe(true)
  })
})

describe('translation surfacing', () => {
  const pt = {
    headline: 'ANVISA aprova nova resolução sobre cannabis medicinal',
    title_en: 'ANVISA approves new medical cannabis resolution',
    summary: 'Resumo em português.',
    summary_en: 'Summary in English.',
    lang_detected: 'pt',
  }

  it('prefers the translated headline and summary', () => {
    expect(displayHeadline(pt)).toBe('ANVISA approves new medical cannabis resolution')
    expect(displaySummary(pt)).toBe('Summary in English.')
  })

  it('falls back to the original when untranslated', () => {
    expect(displayHeadline({ headline: 'Original only', lang_detected: 'pt' })).toBe('Original only')
  })

  it('reports the source language for attribution', () => {
    expect(originalLanguage(pt)).toBe('pt')
    expect(originalLanguageLabel(pt)).toBe('Portuguese')
    expect(isTranslated(pt)).toBe(true)
  })

  it('does not mark English content as translated', () => {
    expect(originalLanguage({ lang_detected: 'en', title_en: 'x' })).toBeNull()
    expect(isTranslated({ lang_detected: 'en', title_en: 'x' })).toBe(false)
  })

  it('is not "translated" when only the language is known', () => {
    expect(isTranslated({ lang_detected: 'de', headline: 'Nur Deutsch' })).toBe(false)
  })
})

describe('corroboration', () => {
  const rows = [
    { id: 'a', cluster_rep_id: 'c1' },
    { id: 'b', cluster_rep_id: 'c1' },
    { id: 'c', cluster_rep_id: 'c1' },
    { id: 'd', cluster_rep_id: 'c2' },
    { id: 'e', cluster_rep_id: null },
  ]

  it('counts cluster members', () => {
    const index = buildCorroborationIndex(rows)
    expect(corroborationCount(rows[0], index)).toBe(3)
    expect(corroborationCount(rows[3], index)).toBe(1)
  })

  it('reports 1 for unclustered rows rather than 0', () => {
    const index = buildCorroborationIndex(rows)
    expect(corroborationCount(rows[4], index)).toBe(1)
  })
})

describe('resolveCountry', () => {
  it('resolves canonical names', () => {
    expect(resolveCountry('Jamaica')?.slug).toBe('jamaica')
    expect(resolveCountry('Lesotho')?.region).toBe('Africa')
  })

  it('resolves the short forms that actually appear in scraped data', () => {
    expect(resolveCountry('United States')?.slug).toBe('united-states-of-america')
    expect(resolveCountry('UK')?.slug).toBe('united-kingdom-of-great-britain-and-northern-ireland')
    expect(resolveCountry('South Korea')?.slug).toBe('republic-of-korea')
    expect(resolveCountry('Czech Republic')?.slug).toBe('czechia')
  })

  it('is case- and punctuation-insensitive', () => {
    expect(resolveCountry('  puerto rico ')?.slug).toBe('puerto-rico')
    expect(resolveCountry("Côte d’Ivoire")?.slug).toBe('cote-divoire')
  })

  it('returns null for non-countries so callers do not fabricate geography', () => {
    expect(resolveCountry('Global')).toBeNull()
    expect(resolveCountry('')).toBeNull()
    expect(resolveCountry(null)).toBeNull()
  })
})

describe('content routing', () => {
  it('routes per spec section 4.3', () => {
    expect(routeContentType({ content_type: 'regulatory' })).toEqual(['signals'])
    expect(routeContentType({ content_type: 'story' })).toEqual(['digest'])
    expect(routeContentType({ content_type: 'research' })).toEqual(['digest'])
    expect(routeContentType({ content_type: 'market' })).toEqual(['signals', 'digest'])
  })

  it('normalises unknown content types to null', () => {
    expect(resolveContentType({ content_type: 'wat' })).toBeNull()
  })
})

describe('feed freshness', () => {
  it('measures age from the newest item', () => {
    const recent = new Date(Date.now() - 2 * 36e5).toISOString()
    const old = new Date(Date.now() - 300 * 36e5).toISOString()
    expect(feedAgeHours([old, recent])).toBeCloseTo(2, 0)
  })

  it('bands staleness so a dark feed is never silently dark', () => {
    expect(freshnessBand(4)).toBe('live')
    expect(freshnessBand(72)).toBe('recent')
    expect(freshnessBand(24 * 9)).toBe('stale')
    expect(freshnessBand(null)).toBe('unknown')
  })

  it('ignores unparseable dates', () => {
    expect(feedAgeHours([null, undefined, 'not-a-date'])).toBeNull()
  })
})

describe('Stage D signals-feed routing', () => {
  it('keeps regulatory and market on the Signals feed', () => {
    expect(belongsOnSignalsFeed({ content_type: 'regulatory' })).toBe(true)
    expect(belongsOnSignalsFeed({ content_type: 'market' })).toBe(true)
  })

  it('routes story and research off the Signals feed', () => {
    // 395 promoted rows of these types were presenting as regulatory intelligence.
    expect(belongsOnSignalsFeed({ content_type: 'story' })).toBe(false)
    expect(belongsOnSignalsFeed({ content_type: 'research' })).toBe(false)
  })

  it('excludes noise', () => {
    expect(belongsOnSignalsFeed({ content_type: 'noise' })).toBe(false)
  })

  it('keeps NULL content_type — pre-Pipeline-B rows predate the taxonomy', () => {
    // Dropping these would silently shrink the feed.
    expect(belongsOnSignalsFeed({})).toBe(true)
    expect(belongsOnSignalsFeed({ content_type: null })).toBe(true)
  })

  it('the PostgREST filter excludes exactly the digest-bound types', () => {
    expect(SIGNALS_FEED_CONTENT_TYPE_NOT_IN).toContain('story')
    expect(SIGNALS_FEED_CONTENT_TYPE_NOT_IN).toContain('research')
    expect(SIGNALS_FEED_CONTENT_TYPE_NOT_IN).toContain('noise')
    expect(SIGNALS_FEED_CONTENT_TYPE_NOT_IN).not.toContain('regulatory')
    expect(SIGNALS_FEED_CONTENT_TYPE_NOT_IN).not.toContain('market')
  })

  it('the server-side filter keeps NULL content_type, matching belongsOnSignalsFeed', () => {
    // A bare `content_type=not.in.(...)` passes the assertion above while still
    // dropping every NULL row, because SQL evaluates `NULL NOT IN (...)` to NULL
    // rather than TRUE. That silently shrank the feed by 40 legacy rows and made
    // the query disagree with the mapper. The filter must test for null explicitly.
    expect(SIGNALS_FEED_CONTENT_TYPE_OR_FILTER).toContain('content_type.is.null')
    expect(SIGNALS_FEED_CONTENT_TYPE_OR_FILTER).toContain(
      `content_type.not.in.${SIGNALS_FEED_CONTENT_TYPE_NOT_IN}`,
    )
    // and it must be an or-group, or PostgREST reads it as a single conjunct
    expect(SIGNALS_FEED_CONTENT_TYPE_OR_FILTER.startsWith('(')).toBe(true)
    expect(SIGNALS_FEED_CONTENT_TYPE_OR_FILTER.endsWith(')')).toBe(true)
  })
})
