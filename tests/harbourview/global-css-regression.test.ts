import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('global CSS regression guard', () => {
  const globalsCss = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')

  it('preserves shared marketplace utility classes', () => {
    expect(globalsCss).toContain('.btn-primary')
    expect(globalsCss).toContain('.btn-secondary')
    expect(globalsCss).toContain('.btn-outline')
    expect(globalsCss).toContain('.card')
    expect(globalsCss).toContain('.section-heading')
    expect(globalsCss).toContain('.page-container')
  })

  it('preserves Harbourview homepage utility classes', () => {
    expect(globalsCss).toContain('.hv-btn-primary')
    expect(globalsCss).toContain('.hv-btn-secondary')
  })
})
