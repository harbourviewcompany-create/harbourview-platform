import { describe, expect, it } from 'vitest'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import {
  expandSelectedGlobeSet,
  getRenderableEntryKind,
  isSubdivisionEntry,
  renderableGlobeEntries,
} from '@/lib/globe/renderable-globe-entries'
import { getViewportClass, resolveBorderStyle } from '@/lib/globe/globe-visual-state'

describe('Harbourview globe visual state helpers', () => {
  it('centralizes renderable globe entries with Canada replaced by province entries', () => {
    expect(renderableGlobeEntries.some((entry) => entry.iso2 === 'CA')).toBe(false)

    for (const province of canadaProvinces) {
      expect(renderableGlobeEntries.some((entry) => entry.iso2 === province.iso2)).toBe(true)
    }
  })

  it('classifies Canada province entries as admin1 subdivisions', () => {
    const provinceEntry = renderableGlobeEntries.find((entry) => entry.iso2 === canadaProvinces[0]?.iso2)

    expect(provinceEntry).toBeTruthy()
    expect(isSubdivisionEntry(provinceEntry!)).toBe(true)
    expect(getRenderableEntryKind(provinceEntry!)).toBe('admin1')
  })

  it('expands selected CA into all Canada province iso2 values', () => {
    const selectedSet = expandSelectedGlobeSet('CA', [])

    for (const province of canadaProvinces) {
      expect(selectedSet.has(province.iso2)).toBe(true)
    }
  })

  it('expands multi-market CA into all Canada province iso2 values', () => {
    const selectedSet = expandSelectedGlobeSet(undefined, ['DE', 'CA'])

    expect(selectedSet.has('DE')).toBe(true)

    for (const province of canadaProvinces) {
      expect(selectedSet.has(province.iso2)).toBe(true)
    }
  })

  it('resolves viewport classes deterministically', () => {
    expect(getViewportClass(390)).toBe('mobile')
    expect(getViewportClass(768)).toBe('tablet')
    expect(getViewportClass(1440)).toBe('desktop')
  })

  it('makes selected country borders stronger than idle country borders', () => {
    const idle = resolveBorderStyle({
      viewportClass: 'desktop',
      renderableKind: 'country',
      ringKind: 'outer',
      isFocused: false,
      isSelected: false,
    })

    const selected = resolveBorderStyle({
      viewportClass: 'desktop',
      renderableKind: 'country',
      ringKind: 'outer',
      isFocused: false,
      isSelected: true,
    })

    expect(selected.opacity).toBeGreaterThan(idle.opacity)
    expect(selected.lineWidth).toBeGreaterThan(idle.lineWidth)
  })

  it('makes focused country borders stronger than idle country borders', () => {
    const idle = resolveBorderStyle({
      viewportClass: 'desktop',
      renderableKind: 'country',
      ringKind: 'outer',
      isFocused: false,
      isSelected: false,
    })

    const focused = resolveBorderStyle({
      viewportClass: 'desktop',
      renderableKind: 'country',
      ringKind: 'outer',
      isFocused: true,
      isSelected: false,
    })

    expect(focused.opacity).toBeGreaterThanOrEqual(idle.opacity)
    expect(focused.lineWidth).toBeGreaterThan(idle.lineWidth)
  })

  it('keeps mobile admin1 borders at least as visible as desktop admin1 borders', () => {
    const desktop = resolveBorderStyle({
      viewportClass: 'desktop',
      renderableKind: 'admin1',
      ringKind: 'outer',
      isFocused: false,
      isSelected: false,
    })

    const mobile = resolveBorderStyle({
      viewportClass: 'mobile',
      renderableKind: 'admin1',
      ringKind: 'outer',
      isFocused: false,
      isSelected: false,
    })

    expect(mobile.opacity).toBeGreaterThanOrEqual(desktop.opacity)
    expect(mobile.lineWidth).toBeGreaterThanOrEqual(desktop.lineWidth)
  })

  it('does not require fake market or opportunity fields to resolve visual state', () => {
    const style = resolveBorderStyle({
      viewportClass: 'mobile',
      renderableKind: 'country',
      ringKind: 'outer',
      isFocused: false,
      isSelected: true,
    })

    expect(style.color).toBeTruthy()
    expect(style.opacity).toBeGreaterThan(0)
    expect(style.lineWidth).toBeGreaterThan(0)
  })
})
