import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MarketplaceMediaStatus from '@/components/dashboard/MarketplaceMediaStatus'
import CommandCentreDataBoundary from '@/components/dashboard/CommandCentreDataBoundary'
import { MARKETPLACE_MEDIA_COPY } from '@/lib/dashboard/marketplaceMediaProjection'

describe('authenticated dashboard marketplace media disclosure', () => {
  it('renders the canonical visible, polite media notice while global health stays live', () => {
    const html = renderToStaticMarkup(
      <CommandCentreDataBoundary state="live" sources={{}} loadedAt="2026-08-30T00:00:00Z">
        <MarketplaceMediaStatus mediaStatus="degraded" />
      </CommandCentreDataBoundary>,
    )
    expect(html).toContain('data-command-centre-state="live"')
    expect(html).toContain('data-marketplace-media-status="degraded"')
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain(MARKETPLACE_MEDIA_COPY.degradedNotice)
    expect(html).not.toContain('sr-only')
    expect(html).not.toContain('<aside')
  })

  it('does not disclose degradation for successful retrieval with representative images', () => {
    expect(renderToStaticMarkup(<MarketplaceMediaStatus mediaStatus="live" />)).toBe('')
  })

  it('wires the authenticated route to the projection status only for successful requested sources', () => {
    const route = readFileSync('app/dashboard/page.tsx', 'utf8')
    expect(route).toContain("import MarketplaceMediaStatus from '@/components/dashboard/MarketplaceMediaStatus'")
    expect(route).toContain('commandData.sources.marketplaceRows.requested && commandData.sources.marketplaceRows.errorCode === null')
    expect(route).toContain('<MarketplaceMediaStatus mediaStatus={marketplaceProjection.mediaStatus} />')
  })
})
