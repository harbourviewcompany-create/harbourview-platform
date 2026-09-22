import { describe, expect, it } from 'vitest'
import {
  contentBandFromAgeHours,
  contentFeedBandMessage,
  hoursFromTimeAgoLabel,
  inferContentFeedBand,
  PIPELINE_SLO,
  evaluateFeedSlo,
} from '@/lib/dashboard/pipelineSlo'

describe('pipeline SLO content freshness', () => {
  it('parses timeAgo labels used by the SignalStrip', () => {
    expect(hoursFromTimeAgoLabel('Just now')).toBe(0)
    expect(hoursFromTimeAgoLabel('3h ago')).toBe(3)
    expect(hoursFromTimeAgoLabel('2d ago')).toBe(48)
    expect(hoursFromTimeAgoLabel('1w ago')).toBe(168)
    expect(hoursFromTimeAgoLabel('Recently')).toBe(PIPELINE_SLO.feedWarningMaxHours)
    expect(hoursFromTimeAgoLabel('unknown format')).toBeNull()
  })

  it('maps age hours onto the same thresholds as evaluateFeedSlo', () => {
    expect(contentBandFromAgeHours(3)).toBe('live')
    expect(evaluateFeedSlo(3)).toBe('healthy')

    expect(contentBandFromAgeHours(12)).toBe('recent')
    expect(evaluateFeedSlo(12)).toBe('warning')

    expect(contentBandFromAgeHours(36)).toBe('stale')
    expect(evaluateFeedSlo(36)).toBe('critical')

    expect(contentBandFromAgeHours(null)).toBe('unknown')
  })

  it('infers band from the newest label in a strip', () => {
    expect(inferContentFeedBand(['2d ago', '4h ago', '1w ago'])).toBe('live')
    expect(inferContentFeedBand(['2d ago', '12h ago'])).toBe('recent')
    expect(inferContentFeedBand(['3d ago', '2d ago'])).toBe('stale')
    expect(inferContentFeedBand([])).toBe('unknown')
    expect(inferContentFeedBand(['Forthcoming'])).toBe('unknown')
  })

  it('explains stale and aging bands with product SLO numbers', () => {
    const stale = contentFeedBandMessage('stale')
    expect(stale).toContain(String(PIPELINE_SLO.feedWarningMaxHours))
    const aging = contentFeedBandMessage('recent')
    expect(aging).toContain(String(PIPELINE_SLO.feedHealthyMaxHours))
    expect(contentFeedBandMessage('live')).toBeNull()
  })
})
