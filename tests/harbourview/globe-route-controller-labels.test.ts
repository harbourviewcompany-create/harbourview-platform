import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const sourcePath = join(process.cwd(), 'components/harbourview/globe/HarbourviewGlobeRouteController.tsx')
const source = readFileSync(sourcePath, 'utf8')

describe('Harbourview globe route controller production copy', () => {
  it('removes prototype fallback trigger controls from public labels', () => {
    expect(source).not.toContain('Test fallback route')
    expect(source).not.toContain("pushState({ route: 'fallback' })")
  })

  it('removes internal diagnostic copy from rendered public strings', () => {
    expect(source).not.toContain('Invalid parameter fallback')
    expect(source).not.toContain('State:')
  })

  it('keeps an internal environment gate around controller rendering', () => {
    expect(source).toContain("process.env.HARBOURVIEW_INTERNAL_GLOBE_CONTROLLER === 'true'")
    expect(source).toContain('if (!internalControllerEnabled)')
    expect(source).toContain('return null')
  })
})
