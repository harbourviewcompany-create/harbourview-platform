import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hvBrand, hvCssVariableMap } from '@/lib/harbourview/design-tokens'

describe('design token authority', () => {
  const designSystem = readFileSync(join(process.cwd(), 'docs/control/DESIGN_SYSTEM.md'), 'utf8')
  const tokenCss = readFileSync(join(process.cwd(), 'styles/design-tokens.css'), 'utf8')
  const globalsCss = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')

  it('matches DESIGN_SYSTEM core palette', () => {
    expect(hvBrand.black.toUpperCase()).toBe('#030508')
    expect(hvBrand.navy.toUpperCase()).toBe('#0B1A2F')
    expect(hvBrand.navyDeep.toUpperCase()).toBe('#081423')
    expect(hvBrand.gold.toUpperCase()).toBe('#C6A55A')
    expect(hvBrand.goldDeep.toUpperCase()).toBe('#A8842D')
    expect(hvBrand.ivory.toUpperCase()).toBe('#F5F1E8')
    expect(hvBrand.muted.toUpperCase()).toBe('#9CA3AF')

    expect(designSystem).toContain('#0B1A2F')
    expect(designSystem).toContain('#C6A55A')
    expect(designSystem).toContain('#F5F1E8')
  })

  it('CSS token file declares every mapped variable', () => {
    for (const [name, value] of Object.entries(hvCssVariableMap)) {
      expect(tokenCss.toLowerCase()).toContain(name.toLowerCase())
      // Hex may be lowercased in CSS; check without # case
      const hex = value.replace('#', '').toLowerCase()
      expect(tokenCss.toLowerCase()).toContain(hex)
    }
  })

  it('globals.css imports the shared token stylesheet', () => {
    expect(globalsCss).toMatch(/@import\s+["'].*design-tokens\.css["']/
    )
  })

  it('command aliases resolve through --hv-* (not a second palette)', () => {
    expect(tokenCss).toContain('--hvm2-gold: var(--hv-gold)')
    expect(tokenCss).toContain('--hvm2-text: var(--hv-ivory)')
  })
})
