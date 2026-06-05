export const MARKETPLACE_IMAGE_CLASSES = [
  'REAL_ITEM_EVIDENCE',
  'MANUFACTURER_CATALOGUE',
  'HARBOURVIEW_ILLUSTRATIVE',
  'ADMIN_PRIVATE_EVIDENCE',
] as const;

export const MARKETPLACE_IMAGE_ROLES = [
  'CARD',
  'HERO',
  'GALLERY',
  'DETAIL',
  'CATEGORY_TILE',
  'SELLER_PROFILE',
  'ADMIN_REVIEW',
  'SOCIAL_PREVIEW',
  'PLACEHOLDER',
] as const;

export const MARKETPLACE_IMAGE_REVIEW_STATUSES = [
  'UPLOADED',
  'PROCESSING',
  'NEEDS_REVIEW',
  'APPROVED_PUBLIC',
  'APPROVED_PRIVATE_ONLY',
  'REJECTED',
  'REPLACED',
] as const;

export const MARKETPLACE_IMAGE_RIGHTS_STATUSES = [
  'SELLER_PROVIDED',
  'MANUFACTURER_PERMITTED',
  'HARBOURVIEW_CREATED',
  'PUBLIC_SOURCE_REVIEWED',
  'UNKNOWN',
] as const;

export const MARKETPLACE_IMAGE_SOURCE_TYPES = [
  'SELLER_UPLOAD',
  'SUPPLIER_UPLOAD',
  'MANUFACTURER_CATALOGUE',
  'HARBOURVIEW_CREATED',
  'PUBLIC_SOURCE',
  'ADMIN_UPLOAD',
  'UNKNOWN',
] as const;

export type MarketplaceImageClass = (typeof MARKETPLACE_IMAGE_CLASSES)[number];
export type MarketplaceImageRole = (typeof MARKETPLACE_IMAGE_ROLES)[number];
export type MarketplaceImageReviewStatus = (typeof MARKETPLACE_IMAGE_REVIEW_STATUSES)[number];
export type MarketplaceImageRightsStatus = (typeof MARKETPLACE_IMAGE_RIGHTS_STATUSES)[number];
export type MarketplaceImageSourceType = (typeof MARKETPLACE_IMAGE_SOURCE_TYPES)[number];

export type MarketplaceItemImageRow = {
  id: string;
  item_id: string;
  image_class: MarketplaceImageClass;
  image_role: MarketplaceImageRole;
  review_status: MarketplaceImageReviewStatus;
  rights_status: MarketplaceImageRightsStatus;
  source_type: MarketplaceImageSourceType;
  source_name: string | null;
  source_url: string | null;
  source_reference: string | null;
  original_storage_bucket: string | null;
  original_storage_path: string | null;
  edited_storage_bucket: string | null;
  edited_storage_path: string | null;
  public_storage_bucket: string | null;
  public_storage_path: string | null;
  public_url: string | null;
  thumbnail_url: string | null;
  hero_url: string | null;
  gallery_url: string | null;
  social_url: string | null;
  alt_text: string | null;
  caption: string | null;
  is_evidence_image: boolean;
  is_illustrative: boolean;
  adobe_edit_summary: string | null;
  content_credentials_status: string | null;
  content_credentials_reference: string | null;
  width: number | null;
  height: number | null;
  file_mime_type: string | null;
  file_size_bytes: number | null;
  checksum_sha256: string | null;
  rejection_reason: string | null;
  replaced_by_image_id: string | null;
  uploaded_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketplaceImageApprovalType = 'APPROVED_PUBLIC' | 'APPROVED_PRIVATE_ONLY';
