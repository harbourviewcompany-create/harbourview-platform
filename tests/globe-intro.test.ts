import { describe, expect, it } from 'vitest'
import {
  GLOBE_INTRO,
  shouldCompleteIntro,
  shouldForceGoldPlates,
} from '@/lib/globe/globe-intro'

describe('globe intro', () => {
  it('forces gold while spinning and not reduced-motion', () => {
    expect(
      shouldForceGoldPlates({ introPhase: 'spinning', prefersReducedMotion: false }),
    ).toBe(true)
    expect(
      shouldForceGoldPlates({ introPhase: 'ready', prefersReducedMotion: false }),
    ).toBe(false)
  })

  it('never forces gold under reduced motion', () => {
    expect(
      shouldForceGoldPlates({ introPhase: 'spinning', prefersReducedMotion: true }),
    ).toBe(false)
  })

  it('does not complete while loading even after spin window', () => {
    expect(
      shouldCompleteIntro({
        spinElapsedMs: GLOBE_INTRO.spinDurationMs + 500,
        loading: true,
        prefersReducedMotion: false,
      }),
    ).toBe(false)
  })

  it('completes after spin window when data is ready', () => {
    expect(
      shouldCompleteIntro({
        spinElapsedMs: GLOBE_INTRO.spinDurationMs,
        loading: false,
        prefersReducedMotion: false,
      }),
    ).toBe(true)
  })

  it('completes immediately under reduced motion once data is ready', () => {
    expect(
      shouldCompleteIntro({
        spinElapsedMs: 0,
        loading: false,
        prefersReducedMotion: true,
      }),
    ).toBe(true)
  })
})
