import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import MarketplaceMediaStatus from '@/components/dashboard/MarketplaceMediaStatus'
import CommandCentreDataBoundary from '@/components/dashboard/CommandCentreDataBoundary'
import { MARKETPLACE_MEDIA_COPY } from '@/lib/dashboard/marketplaceMediaProjection'
import CommandCentre from '@/components/dashboard/CommandCentre'
import MobileCommandCentreRebuild from '@/components/dashboard/MobileCommandCentreRebuild'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams('page=marketplace&section=marketplace'),
  usePathname: () => '/dashboard',
}))

vi.mock('@/components/dashboard/useDashboardSignalsRealtime', () => ({
  useDashboardSignalsRealtime: () => ({ signals: [], status: 'live' }),
}))

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
    expect(route).not.toContain('<MarketplaceMediaStatus')
    expect(route).toContain('commandData.sources.marketplaceRows.requested && commandData.sources.marketplaceRows.errorCode === null')
    expect(route).toContain('marketplaceMediaStatus={commandData.sources.marketplaceRows.requested')
    expect(route).toContain('? marketplaceProjection.mediaStatus\n          : undefined}')
  })

  it.each([
    ['desktop', CommandCentre, 'cc-main'],
    ['mobile', MobileCommandCentreRebuild, 'hvm2-main hvm-op-main'],
  ] as const)('renders the notice inside the %s content shell, not behind it', (_name, Shell, mainClass) => {
    const props = { signals: [], eduCategories: [], initialPage: 'marketplace' as const }
    const html = renderToStaticMarkup(<Shell {...props} marketplaceMediaStatus="degraded" />)
    const main = html.slice(html.indexOf(`<main class="${mainClass}">`), html.indexOf('</main>'))
    expect(main).toContain('data-marketplace-media-status="degraded"')
    expect(main).toContain(MARKETPLACE_MEDIA_COPY.degradedNotice)
    expect(html.match(/data-marketplace-media-status=/g)).toHaveLength(1)
    expect(renderToStaticMarkup(<Shell {...props} marketplaceMediaStatus="live" />)).not.toContain('data-marketplace-media-status=')
    expect(renderToStaticMarkup(<Shell {...props} />)).not.toContain('data-marketplace-media-status=')
  })
})
