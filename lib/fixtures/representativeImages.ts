import type { Listing, ListingImage } from './types'

const representativeCaption =
  'Representative category image. Specifications, supplier fit and commercial terms are available upon inquiry.'

const PUBLIC_MEDIA_BASE =
  'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/'

const images: Record<string, ListingImage> = {
  packagingPouches: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/packaging-pouches.png`,
    alt: 'Unbranded packaging pouches shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  labQa: {
    src: `${PUBLIC_MEDIA_BASE}representative/v6/lab-testing-instrumentation.png`,
    alt: 'Unbranded lab and QA supplies shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  cultivation: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/cultivation-inputs.png`,
    alt: 'Unbranded cultivation inputs shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  facility: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/packaging-equipment.png`,
    alt: 'Unbranded commercial facility supplies shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  warehouse: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/warehouse-logistics.png`,
    alt: 'Unbranded warehouse and logistics supplies shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  extraction: {
    src: `${PUBLIC_MEDIA_BASE}representative/v5/co2-extraction-system.png`,
    alt: 'Unbranded extraction equipment shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  growLighting: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/grow-lighting.png`,
    alt: 'Unbranded grow lighting shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  packagingLine: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/packaging-equipment.png`,
    alt: 'Unbranded packaging equipment shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  productInventory: {
    src: `${PUBLIC_MEDIA_BASE}representative/v6/dried-flower.png`,
    alt: 'Unbranded product inventory shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  hempBiomass: {
    src: `${PUBLIC_MEDIA_BASE}representative/v6/biomass.png`,
    alt: 'Unbranded hemp biomass shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  advisory: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/advisory-services.png`,
    alt: 'Unbranded advisory services workspace shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
  retailFacility: {
    src: `${PUBLIC_MEDIA_BASE}representative/v5/retail-facility.png`,
    alt: 'Unbranded retail or commercial facility shown as a representative category image',
    status: 'representative',
    caption: representativeCaption,
    assetSource: 'generated',
  },
}

export const representativeListingImages: Record<string, ListingImage> = {
  'cons-001': images.packagingPouches,
  'cons-002': images.labQa,
  'cons-003': images.cultivation,
  'cons-004': images.extraction,
  'cons-005': images.facility,
  'cons-006': images.warehouse,
  'cons-007': images.packagingPouches,
  'cons-008': images.facility,
  'np-001': images.extraction,
  'np-002': images.growLighting,
  'np-003': images.packagingLine,
  'np-004': images.facility,
  'np-005': images.extraction,
  'us-001': images.extraction,
  'us-002': images.facility,
  'us-003': images.extraction,
  'us-004': images.warehouse,
  'us-005': images.labQa,
  'ci-001': images.productInventory,
  'ci-002': images.hempBiomass,
  'ci-003': images.productInventory,
  'ci-004': images.hempBiomass,
  'ci-005': images.productInventory,
  'ci-006': images.productInventory,
  'wr-001': images.extraction,
  'wr-002': images.packagingPouches,
  'wr-003': images.advisory,
  'wr-004': images.retailFacility,
  'sv-001': images.advisory,
  'sv-002': images.extraction,
  'sv-003': images.advisory,
  'sv-004': images.facility,
  'sv-005': images.advisory,
  'bo-001': images.retailFacility,
  'bo-002': images.retailFacility,
  'bo-003': images.extraction,
  'bo-004': images.warehouse,
}

export function withRepresentativeImage<T extends Listing>(listing: T): T {
  const image = representativeListingImages[listing.id]

  if (!image) return listing

  return { ...listing, image }
}
