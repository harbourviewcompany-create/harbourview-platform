import { describe, expect, it } from 'vitest'
import type { PublicMarketplaceImageDTO } from '@/lib/marketplace/images/dto'
import { pickMarketplaceCardImage } from '@/lib/marketplace/images/public-query'
import { isPublicRenderableMarketplaceImage } from '@/lib/marketplace/images/rules'
import { resolveListingMedia } from '@/lib/dashboard/buildDashboardCommandSources'

function image(overrides: Partial<PublicMarketplaceImageDTO> = {}): PublicMarketplaceImageDTO {
  return {
    id: 'image-1',
    itemId: 'listing-1',
    role: 'GALLERY',
    imageClass: 'REAL_ITEM_EVIDENCE',
    publicUrl: 'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/listing-1.webp',
    thumbnailUrl: null,
    heroUrl: null,
    galleryUrl: null,
    socialUrl: null,
    altText: 'Approved listing-specific marketplace photograph',
    caption: 'Approved listing photograph.',
    isIllustrative: false,
    sourceDisplayLabel: 'Seller-provided image',
    ...overrides,
  }
}

describe('marketplace media selection', () => {
  it('selects CARD ahead of HERO, GALLERY and DETAIL within the same trust class regardless of input order', () => {
    const selected = pickMarketplaceCardImage([
      image({ id: 'gallery', role: 'GALLERY' }),
      image({ id: 'detail', role: 'DETAIL' }),
      image({ id: 'hero', role: 'HERO' }),
      image({ id: 'card', role: 'CARD' }),
    ])

    expect(selected?.id).toBe('card')
  })

  it('uses id as the deterministic tie-breaker for equal trust and role', () => {
    const selected = pickMarketplaceCardImage([
      image({ id: 'z-image', role: 'CARD' }),
      image({ id: 'a-image', role: 'CARD' }),
    ])

    expect(selected?.id).toBe('a-image')
  })

  it('falls back to HERO when no CARD image exists within the same trust class', () => {
    const selected = pickMarketplaceCardImage([
      image({ id: 'gallery', role: 'GALLERY' }),
      image({ id: 'hero', role: 'HERO' }),
    ])

    expect(selected?.id).toBe('hero')
  })

  it('prefers genuine real-item evidence over illustrative fallback even when the illustrative image has CARD role', () => {
    const selected = pickMarketplaceCardImage([
      image({
        id: 'representative-card',
        role: 'CARD',
        imageClass: 'HARBOURVIEW_ILLUSTRATIVE',
        isIllustrative: true,
        publicUrl: '/marketplace/images/grow-lighting.svg',
      }),
      image({ id: 'real-gallery', role: 'GALLERY', imageClass: 'REAL_ITEM_EVIDENCE' }),
    ])

    expect(selected?.id).toBe('real-gallery')
  })

  it('prefers manufacturer catalogue imagery over Harbourview illustrative imagery when no real-item evidence exists', () => {
    const selected = pickMarketplaceCardImage([
      image({
        id: 'representative-card',
        role: 'CARD',
        imageClass: 'HARBOURVIEW_ILLUSTRATIVE',
        isIllustrative: true,
        publicUrl: '/marketplace/images/product-inventory.svg',
      }),
      image({
        id: 'manufacturer-gallery',
        role: 'GALLERY',
        imageClass: 'MANUFACTURER_CATALOGUE',
        sourceDisplayLabel: 'Manufacturer image',
      }),
    ])

    expect(selected?.id).toBe('manufacturer-gallery')
  })

  it('projects real item evidence as actual media without a provenance badge', () => {
    const media = resolveListingMedia('cannabis', [image({ role: 'CARD' })])

    expect(media.kind).toBe('actual')
    expect(media.badgeLabel).toBeNull()
    expect(media.altText).toBe('Approved listing-specific marketplace photograph')
    expect(media.src).toContain('/storage/v1/object/public/marketplace-item-public/')
  })

  it('preserves manufacturer catalogue provenance instead of presenting it as listing evidence', () => {
    const media = resolveListingMedia('cannabis', [image({
      role: 'CARD',
      imageClass: 'MANUFACTURER_CATALOGUE',
      sourceDisplayLabel: 'Manufacturer catalogue',
    })])

    expect(media.kind).toBe('catalogue')
    expect(media.badgeLabel).toBe('Manufacturer catalogue')
  })

  it('tries each approved URL in priority order until it finds a renderable public source', () => {
    const media = resolveListingMedia('cannabis', [image({
      role: 'CARD',
      thumbnailUrl: 'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/sign/marketplace-item-private/expired.webp?token=secret',
      publicUrl: 'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/listing-1.webp',
    })])

    expect(media.kind).toBe('actual')
    expect(media.src).toContain('/storage/v1/object/public/marketplace-item-public/listing-1.webp')
    expect(media.src).not.toContain('token=secret')
  })

  it('preserves illustrative classification as representative media', () => {
    const media = resolveListingMedia('equipment', [image({
      role: 'CARD',
      imageClass: 'HARBOURVIEW_ILLUSTRATIVE',
      isIllustrative: true,
      publicUrl: 'https://harbourview.vercel.app/marketplace/images/extraction-equipment.webp',
      altText: 'Illustrative extraction equipment',
      caption: 'Illustrative catalogue image — not item evidence',
      sourceDisplayLabel: 'Harbourview illustrative image',
    })])

    expect(media.kind).toBe('representative')
    expect(media.badgeLabel).toBe('Harbourview illustrative image')
    expect(media.src).toBe('/marketplace/images/extraction-equipment.webp')
    expect(media.caption).toContain('not item evidence')
  })

  it('rejects unapproved, unknown-rights, private-evidence and URL-less rows at the trust rule', () => {
    const base = {
      review_status: 'APPROVED_PUBLIC' as const,
      rights_status: 'SELLER_PROVIDED' as const,
      image_class: 'REAL_ITEM_EVIDENCE' as const,
      public_url: 'https://example.invalid/image.webp',
    }

    expect(isPublicRenderableMarketplaceImage(base)).toBe(true)
    expect(isPublicRenderableMarketplaceImage({ ...base, review_status: 'NEEDS_REVIEW' })).toBe(false)
    expect(isPublicRenderableMarketplaceImage({ ...base, rights_status: 'UNKNOWN' })).toBe(false)
    expect(isPublicRenderableMarketplaceImage({ ...base, image_class: 'ADMIN_PRIVATE_EVIDENCE' })).toBe(false)
    expect(isPublicRenderableMarketplaceImage({ ...base, public_url: null })).toBe(false)
  })
})
