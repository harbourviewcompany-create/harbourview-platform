import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveListingMedia } from '@/lib/dashboard/buildDashboardCommandSources'
import type { PublicMarketplaceImageDTO } from '@/lib/marketplace/images/dto'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('marketplace media post-merge corrective contracts', () => {
  it('consumes the projection by view plus canonical listing id', () => {
    const model = [
      read('components/dashboard/mobile-command/useMobileCommandModel.ts'),
      read('components/dashboard/mobile-command/useMobileCommandModel.base.ts'),
    ].join('\n')
    expect(model).toContain("import { marketplaceMediaKey } from '@/lib/dashboard/marketplaceMediaProjection'")
    expect(model).toContain('props.marketplaceMediaById?.[marketplaceMediaKey(tab.id, listingId)]')
    expect(model).toContain('row.id === selectedListingId && row.view === activeMarketView')
  })

  it('supplies the same media projection to country-role marketplace cards', () => {
    const route = read('app/country/[country]/role/[role]/page.tsx')
    expect(route).toContain("import { getDashboardMarketplaceProjection } from '@/lib/dashboard/buildDashboardCommandSources'")
    expect(route).toContain('getDashboardMarketplaceProjection(countryIso2)')
    expect(route).toContain('marketplaceRows={marketplaceProjection.rows}')
    expect(route).toContain('marketplaceMediaById={marketplaceProjection.mediaById}')
    expect(route).toContain("mediaStatus === 'degraded'")
    expect(route).toContain('MARKETPLACE_MEDIA_COPY.degradedNotice')
  })

  it('triggers and executes the authenticated visual gate for marketplace trust contracts', () => {
    const workflow = read('.github/workflows/mobile-command-centre-v2-visual.yml')
    for (const requiredPath of [
      'lib/dashboard/buildDashboardCommandSources.ts',
      'lib/dashboard/marketplaceMediaProjection.ts',
      'lib/marketplace/images/**',
      'tests/marketplace/marketplaceImageTrustReconciliation.test.ts',
      'tests/dashboard/marketplaceMediaMergeReadiness.test.ts',
    ]) {
      expect(workflow).toContain(requiredPath)
    }
    expect(workflow.split('tests/marketplace/marketplaceImageTrustReconciliation.test.ts')).toHaveLength(3)
    expect(workflow.split('tests/dashboard/marketplaceMediaMergeReadiness.test.ts')).toHaveLength(3)
  })

  it('skips an unusable higher-ranked image and selects the best renderable approved image', () => {
    const images: PublicMarketplaceImageDTO[] = [
      { id: '00000000-0000-4000-8000-000000000001', itemId: 'item-1', imageClass: 'REAL_ITEM_EVIDENCE', role: 'CARD', sourceDisplayLabel: 'Seller supplied', publicUrl: 'https://example.invalid/private.jpg', thumbnailUrl: null, heroUrl: null, galleryUrl: null, socialUrl: null, altText: 'Unusable evidence', caption: null, isIllustrative: false },
      { id: '00000000-0000-4000-8000-000000000002', itemId: 'item-1', imageClass: 'MANUFACTURER_CATALOGUE', role: 'CARD', sourceDisplayLabel: 'Manufacturer catalogue', publicUrl: '/marketplace/images/product-inventory.webp', thumbnailUrl: null, heroUrl: null, galleryUrl: null, socialUrl: null, altText: 'Renderable catalogue image', caption: null, isIllustrative: false },
    ]
    const media = resolveListingMedia('cannabis', images)
    expect(media.kind).toBe('catalogue')
    expect(media.src).toBe('/marketplace/images/product-inventory.webp')
  })

  it('records degradation separately from legitimate no-image fallback', () => {
    const source = read('lib/dashboard/buildDashboardCommandSources.ts')
    expect(source).toContain("mediaStatus: degraded ? 'degraded' : 'live'")
    expect(source).toContain("projection.mediaStatus === 'degraded' ? 'fallback' : 'live'")
    expect(source).toContain('controller.abort()')
    expect(source).toContain('() => {\n        controller.abort()\n        finish({}, true)')
  })

  it('sources trust-facing fallback copy from the controlled media copy contract', () => {
    const projection = read('lib/dashboard/marketplaceMediaProjection.ts')
    const component = read('components/dashboard/mobile-command/sections/MarketplaceSections.tsx')
    expect(projection).toContain('export const MARKETPLACE_MEDIA_COPY')
    expect(projection).toContain('Canonical source: docs/control/MARKETPLACE_MEDIA_COPY.md')
    expect(component).toContain('MARKETPLACE_MEDIA_COPY.representativeBadge')
    expect(read('docs/control/MARKETPLACE_MEDIA_COPY.md')).toContain('Marketplace Media Copy Control')
  })
})
