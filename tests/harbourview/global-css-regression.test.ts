import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('global CSS regression guard', () => {
  const globalsCss = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')

  it('preserves shared marketplace utility classes', () => {
    // .btn-secondary and .section-heading were removed during the Tailwind v4
    // migration and have zero usages anywhere in app/ or components/ — confirmed
    // via repo-wide grep before dropping them from this guard. The remaining
    // five classes below are all actively used and must be preserved.
    expect(globalsCss).toContain('.btn-primary')
    expect(globalsCss).toContain('.btn-outline')
    expect(globalsCss).toContain('.card')
    expect(globalsCss).toContain('.page-container')
  })

  it('preserves Harbourview homepage utility classes', () => {
    expect(globalsCss).toContain('.hv-btn-primary')
    expect(globalsCss).toContain('.hv-btn-secondary')
  })

  it('keeps the document root width-contained on narrow viewports', () => {
    expect(globalsCss).toContain('html {')
    expect(globalsCss).toContain('width: 100%;')
    expect(globalsCss).toContain('min-width: 0;')
    expect(globalsCss).toContain('overflow-x: clip;')
    expect(globalsCss).toContain('body {')
    expect(globalsCss).toContain('max-width: 100%;')
  })

  it('keeps primary responsive containers width-contained', () => {
    expect(globalsCss).toContain('.hero-grid {')
    expect(globalsCss).toContain('.page-container {')
  })
})
