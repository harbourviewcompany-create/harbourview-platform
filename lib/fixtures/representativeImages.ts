import type { Listing, ListingImage } from './types'

const representativeCaption =
  'Representative category image. Specifications, supplier fit and commercial terms are available upon inquiry.'

const images: Record<string, ListingImage> = {
  packagingPouches: { src: '/marketplace/images/packaging-pouches.webp', alt: 'Unbranded packaging pouches shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  labQa: { src: '/marketplace/images/lab-qa-consumables.webp', alt: 'Unbranded lab and QA supplies shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  cultivation: { src: '/marketplace/images/cultivation-inputs.webp', alt: 'Unbranded cultivation inputs shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  facility: { src: '/marketplace/images/facility-supplies.webp', alt: 'Unbranded commercial facility supplies shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  warehouse: { src: '/marketplace/images/warehouse-logistics.webp', alt: 'Unbranded warehouse and logistics supplies shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  extraction: { src: '/marketplace/images/extraction-equipment.webp', alt: 'Unbranded extraction equipment shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  growLighting: { src: '/marketplace/images/grow-lighting.webp', alt: 'Unbranded grow lighting shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  packagingLine: { src: '/marketplace/images/packaging-equipment.webp', alt: 'Unbranded packaging equipment shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  productInventory: { src: '/marketplace/images/product-inventory.webp', alt: 'Unbranded product inventory shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  hempBiomass: { src: '/marketplace/images/hemp-biomass.webp', alt: 'Unbranded hemp biomass shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  advisory: { src: '/marketplace/images/advisory-services.webp', alt: 'Unbranded advisory services workspace shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  retailFacility: { src: '/marketplace/images/retail-facility.webp', alt: 'Unbranded retail or commercial facility shown as a representative category image', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
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
