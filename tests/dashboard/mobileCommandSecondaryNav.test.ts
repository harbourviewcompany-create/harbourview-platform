import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { SECTION_GROUPS } from '@/components/dashboard/mobile-command/contracts'

/**
 * Guards the Command Centre section strip against the clipping defect reported
 * 2026-08-12, where the Overview group's tabs rendered as a half-cut row.
 *
 * `.hvm2-root` is a fixed `100dvh` flex column with `overflow: hidden`. When the
 * strip wrapped to multiple rows and was allowed to flex-shrink, the parent
 * squeezed it below its content height and `overflow-y` sliced a row in half —
 * with no affordance showing more tabs existed.
 */
describe('mobile command secondary nav layout', () => {
  const operatorFirstCss = readFileSync(
    join(process.cwd(), 'components/dashboard/mobile-command/MobileCommandOperatorFirst.css'),
    'utf8',
  )
  const institutionalCss = readFileSync(
    join(process.cwd(), 'components/dashboard/mobile-command/MobileIntelInstitutional.css'),
    'utf8',
  )
  const rebuildTsx = readFileSync(
    join(process.cwd(), 'components/dashboard/MobileCommandCentreRebuild.tsx'),
    'utf8',
  )

  function secondaryNavBlock(css: string) {
    const match = css.match(/\.hvm-op-secondary-nav\s*\{([^}]*)\}/)
    expect(match, 'expected a .hvm-op-secondary-nav rule').not.toBeNull()
    return match![1]
  }

  it('keeps the section strip on a single non-shrinkable row', () => {
    const block = secondaryNavBlock(operatorFirstCss)

    // Must not wrap: wrapping is what produced multiple rows to clip.
    expect(block).toMatch(/flex-wrap:\s*nowrap/)
    expect(block).not.toMatch(/flex-wrap:\s*wrap/)

    // Must not be shrinkable by the fixed-height flex parent.
    expect(block).toMatch(/flex:\s*0\s+0\s+auto/)
    expect(block).not.toMatch(/flex:\s*0\s+1\s+auto/)
  })

  it('does not cap the strip height or scroll it vertically', () => {
    const block = secondaryNavBlock(operatorFirstCss)

    expect(block).not.toMatch(/max-height/)
    expect(block).not.toMatch(/overflow-y:\s*auto/)
    expect(block).toMatch(/overflow-x:\s*auto/)
    expect(block).toMatch(/overflow-y:\s*hidden/)
  })

  it('scrolls on the same axis its affordances and reveal logic assume', () => {
    // The edge-fade mask is horizontal (90deg), so the scroll axis must be too,
    // otherwise the "there is more" cue points the wrong way — the root cause of
    // the strip reading as "cut off" rather than scrollable.
    expect(institutionalCss).toMatch(/mask-image:\s*linear-gradient\(90deg/)
    expect(institutionalCss).toMatch(/overscroll-behavior-x/)
    expect(institutionalCss).toMatch(/scroll-padding-inline/)

    // The active-tab reveal centres on the inline (horizontal) axis.
    expect(rebuildTsx).toMatch(/scrollIntoView\(\{[^}]*inline:\s*'center'/)
  })

  it('covers the largest group, which is what overflowed', () => {
    // Overview is the group shown in the report; it is also the largest, so it
    // is the case that must survive on one scrollable row.
    const largest = Math.max(...Object.values(SECTION_GROUPS).map(sections => sections.length))
    expect(SECTION_GROUPS.overview.length).toBe(largest)
    expect(SECTION_GROUPS.overview.length).toBeGreaterThanOrEqual(10)
  })
})
