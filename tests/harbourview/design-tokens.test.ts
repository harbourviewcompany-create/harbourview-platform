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

  it('CSS token file declares every mapped variable name', () => {
    for (const name of Object.keys(hvCssVariableMap)) {
      expect(tokenCss.toLowerCase()).toContain(name.toLowerCase())
    }
    expect(tokenCss.toLowerCase()).toContain('c6a55a')
    expect(tokenCss.toLowerCase()).toContain('0b1a2f')
    expect(tokenCss.toLowerCase()).toContain('f5f1e8')
  })

  it('globals.css imports the shared token stylesheet', () => {
    expect(globalsCss).toMatch(/@import\s+["'].*design-tokens\.css["']/)
  })

  it('command aliases resolve through --hv-* (not a second palette)', () => {
    expect(tokenCss).toContain('--hvm2-gold: var(--hv-gold)')
    expect(tokenCss).toContain('--hvm2-text: var(--hv-ivory)')
  })

  it('compat aliases preserve bg-background / text-foreground consumers', () => {
    expect(tokenCss).toContain('--background: var(--hv-black)')
    expect(tokenCss).toContain('--foreground: var(--hv-ivory)')
    expect(tokenCss).toContain('--primary: var(--hv-gold)')
  })

  it('shared panel primitive exists for sheets and cards', () => {
    const panel = readFileSync(join(process.cwd(), 'components/ui/HarbourviewPanel.tsx'), 'utf8')
    expect(panel).toContain('HarbourviewBottomSheet')
    expect(panel).toContain('HarbourviewCard')
    expect(panel).toContain('HarbourviewSectionHeader')
    expect(panel).toContain('tone')
    expect(panel).toContain('var(--hv-gold)')
  })

  it('Role Select, Country Selection, PublicUi use token-backed surfaces', () => {
    const role = readFileSync(join(process.cwd(), 'components/globe/RoleSelectSheet.tsx'), 'utf8')
    const country = readFileSync(join(process.cwd(), 'components/harbourview/CountrySelectionSheet.tsx'), 'utf8')
    const core = readFileSync(join(process.cwd(), 'components/dashboard/mobile-command/sections/CoreSections.tsx'), 'utf8')
    const publicUi = readFileSync(join(process.cwd(), 'components/PublicUi.tsx'), 'utf8')
    const uiIndex = readFileSync(join(process.cwd(), 'components/ui/index.ts'), 'utf8')
    const sectionDoc = readFileSync(join(process.cwd(), 'docs/control/SECTION_SURFACE.md'), 'utf8')

    expect(role).toContain('var(--hv-gold)')
    expect(role).not.toContain('#c6a55a')
    expect(country).toContain('HarbourviewBottomSheet')
    expect(core).toContain('CommandCard')
    expect(publicUi).toContain('HarbourviewCard')
    expect(publicUi).toContain('var(--hv-')
    expect(uiIndex).toContain('HarbourviewCard')
    expect(sectionDoc).toContain('SectionShell')
  })
})
