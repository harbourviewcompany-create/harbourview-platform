import type {
  MarketplaceImageApprovalType,
  MarketplaceImageClass,
  MarketplaceImageReviewStatus,
  MarketplaceImageRightsStatus,
  MarketplaceItemImageRow,
} from './types';

export const PRIVATE_MARKETPLACE_IMAGE_BUCKETS = [
  'marketplace-item-originals',
  'marketplace-item-working',
] as const;

export const PUBLIC_MARKETPLACE_IMAGE_BUCKET = 'marketplace-item-public' as const;

export const ADOBE_IMAGE_EDIT_STANDARD = {
  allowed: [
    'crop',
    'straighten',
    'background cleanup',
    'object isolation',
    'exposure correction',
    'white balance correction',
    'contrast correction',
    'marketplace card/hero/gallery framing',
    'format conversion',
    'Content Credentials export where available',
  ],
  forbiddenForRealItemEvidence: [
    'removing damage, scratches, dents, rust, wear, stains, broken parts, warning labels, serial numbers, batch numbers, expiry dates, packaging defects, or condition indicators',
    'adding fake branding, fake compliance marks, fake certifications, fake labels, fake product quantity, fake scale, fake facility background, or fake regulatory/medical implication',
    'making used or distressed items appear newer than they are',
  ],
} as const;

export function isPublicRenderableMarketplaceImage(row: Pick<MarketplaceItemImageRow, 'review_status' | 'rights_status' | 'image_class' | 'public_url'>) {
  return (
    row.review_status === 'APPROVED_PUBLIC' &&
    row.rights_status !== 'UNKNOWN' &&
    row.image_class !== 'ADMIN_PRIVATE_EVIDENCE' &&
    Boolean(row.public_url)
  );
}

export function getMarketplaceImageApprovalBlockers(
  row: Pick<
    MarketplaceItemImageRow,
    | 'rights_status'
    | 'image_class'
    | 'public_url'
    | 'is_illustrative'
    | 'is_evidence_image'
    | 'edited_storage_path'
    | 'adobe_edit_summary'
  >,
  approvalType: MarketplaceImageApprovalType,
) {
  const blockers: string[] = [];

  if (approvalType === 'APPROVED_PUBLIC') {
    if (row.rights_status === 'UNKNOWN') blockers.push('Cannot approve public image with UNKNOWN rights_status.');
    if (row.image_class === 'ADMIN_PRIVATE_EVIDENCE') blockers.push('ADMIN_PRIVATE_EVIDENCE cannot be approved publicly.');
    if (!row.public_url) blockers.push('Cannot approve public image without public_url.');
  }

  if (row.image_class === 'HARBOURVIEW_ILLUSTRATIVE' && !row.is_illustrative) {
    blockers.push('HARBOURVIEW_ILLUSTRATIVE requires is_illustrative=true.');
  }

  if (row.image_class === 'REAL_ITEM_EVIDENCE' && !row.is_evidence_image) {
    blockers.push('REAL_ITEM_EVIDENCE requires is_evidence_image=true.');
  }

  if (row.edited_storage_path && !row.adobe_edit_summary?.trim()) {
    blockers.push('Adobe edit summary is required when edited_storage_path is present.');
  }

  return blockers;
}

export function canApproveMarketplaceImage(row: Parameters<typeof getMarketplaceImageApprovalBlockers>[0], approvalType: MarketplaceImageApprovalType) {
  return getMarketplaceImageApprovalBlockers(row, approvalType).length === 0;
}

export function canRejectMarketplaceImage(rejectionReason: string | null | undefined) {
  return Boolean(rejectionReason?.trim());
}

export function getMarketplaceImageSourceDisplayLabel(row: Pick<MarketplaceItemImageRow, 'image_class' | 'source_type' | 'is_illustrative'>) {
  if (row.image_class === 'HARBOURVIEW_ILLUSTRATIVE' || row.is_illustrative) return 'Illustrative image';
  if (row.source_type === 'SELLER_UPLOAD') return 'Seller-provided image';
  if (row.source_type === 'SUPPLIER_UPLOAD') return 'Supplier-provided image';
  if (row.source_type === 'MANUFACTURER_CATALOGUE') return 'Manufacturer image';
  if (row.source_type === 'HARBOURVIEW_CREATED') return 'Harbourview-created image';
  if (row.source_type === 'PUBLIC_SOURCE') return 'Reviewed public-source image';
  return null;
}

export function isPrivateMarketplaceImageField(fieldName: string) {
  return [
    'original_storage_bucket',
    'original_storage_path',
    'edited_storage_bucket',
    'edited_storage_path',
    'source_reference',
    'rights_status',
    'review_status',
    'rejection_reason',
    'uploaded_by',
    'reviewed_by',
    'checksum_sha256',
    'content_credentials_reference',
  ].includes(fieldName);
}

export function publicMarketplaceImageRoleRank(role: string | null | undefined) {
  if (role === 'CARD') return 0;
  if (role === 'HERO') return 1;
  if (role === 'GALLERY') return 2;
  if (role === 'DETAIL') return 3;
  if (role === 'SOCIAL_PREVIEW') return 4;
  return 5;
}

export function galleryMarketplaceImageRoleRank(role: string | null | undefined) {
  if (role === 'HERO') return 0;
  if (role === 'GALLERY') return 1;
  if (role === 'DETAIL') return 2;
  if (role === 'CARD') return 3;
  return 4;
}

export function normalizeMarketplaceImageClass(value: string): MarketplaceImageClass | null {
  return ['REAL_ITEM_EVIDENCE', 'MANUFACTURER_CATALOGUE', 'HARBOURVIEW_ILLUSTRATIVE', 'ADMIN_PRIVATE_EVIDENCE'].includes(value)
    ? (value as MarketplaceImageClass)
    : null;
}

export function normalizeMarketplaceImageReviewStatus(value: string): MarketplaceImageReviewStatus | null {
  return ['UPLOADED', 'PROCESSING', 'NEEDS_REVIEW', 'APPROVED_PUBLIC', 'APPROVED_PRIVATE_ONLY', 'REJECTED', 'REPLACED'].includes(value)
    ? (value as MarketplaceImageReviewStatus)
    : null;
}

export function normalizeMarketplaceImageRightsStatus(value: string): MarketplaceImageRightsStatus | null {
  return ['SELLER_PROVIDED', 'MANUFACTURER_PERMITTED', 'HARBOURVIEW_CREATED', 'PUBLIC_SOURCE_REVIEWED', 'UNKNOWN'].includes(value)
    ? (value as MarketplaceImageRightsStatus)
    : null;
}
