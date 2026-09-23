import { describe, expect, it } from 'vitest'
import { humanizeLocalPart } from '@/components/dashboard/mobile-command/SellerContactForm'

describe('humanizeLocalPart', () => {
  it('turns dotted email local-parts into display names', () => {
    expect(humanizeLocalPart('tyler.campbell.ott')).toBe('Tyler Campbell Ott')
    expect(humanizeLocalPart('jane_doe')).toBe('Jane Doe')
  })

  it('handles single tokens', () => {
    expect(humanizeLocalPart('alex')).toBe('Alex')
  })
})

describe('portal layer contract', () => {
  it('documents the shared portal z-index token in Market production CSS', async () => {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const css = await fs.readFile(
      path.join(process.cwd(), 'components/dashboard/market/MarketProduction.css'),
      'utf8',
    )
    expect(css).toContain('--hv-portal-z')
    expect(css).toMatch(/z-index:\s*var\(--hv-portal-z/)
  })

  it('keeps a dedicated portal root in the root layout', async () => {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const layout = await fs.readFile(path.join(process.cwd(), 'app/layout.tsx'), 'utf8')
    expect(layout).toContain('id="hvm-portal-root"')
  })

  it('exports resolvePortalTarget from AppPortal', async () => {
    const mod = await import('@/components/dashboard/AppPortal')
    expect(typeof mod.resolvePortalTarget).toBe('function')
    expect(typeof mod.AppPortal).toBe('function')
  })
})
