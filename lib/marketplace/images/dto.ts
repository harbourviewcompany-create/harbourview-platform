import type { MarketplaceImageClass, MarketplaceImageRole, MarketplaceItemImageRow } from './types';
import { getMarketplaceImageSourceDisplayLabel, isPublicRenderableMarketplaceImage } from './rules';

export type PublicMarketplaceImageDTO = {
  id: string;
  itemId: string;
  role: MarketplaceImageRole;
  imageClass: Exclude<MarketplaceImageClass, 'ADMIN_PRIVATE_EVIDENCE'>;
  publicUrl: string;
  thumbnailUrl: string | null;
  heroUrl: string | null;
  galleryUrl: string | null;
  socialUrl: string | null;
  altText: string;
  caption: string | null;
  isIllustrative: boolean;
  sourceDisplayLabel: string | null;
};

export type AdminMarketplaceImageDTO = {
  id: string;
  itemId: string;
  imageClass: MarketplaceImageClass;
  imageRole: MarketplaceImageRole;
  reviewStatus: string;
  rightsStatus: string;
  sourceType: string;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceReference: string | null;
  originalStorageBucket: string | null;
  originalStoragePath: string | null;
  editedStorageBucket: string | null;
  editedStoragePath: string | null;
  publicStorageBucket: string | null;
  publicStoragePath: string | null;
  publicUrl: string | null;
  thumbnailUrl: string | null;
  heroUrl: string | null;
  galleryUrl: string | null;
  socialUrl: string | null;
  altText: string | null;
  caption: string | null;
  isEvidenceImage: boolean;
  isIllustrative: boolean;
  adobeEditSummary: string | null;
  contentCredentialsStatus: string | null;
  contentCredentialsReference: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const PUBLIC_MARKETPLACE_IMAGE_COLUMNS = [
  'id',
  'item_id',
  'image_class',
  'image_role',
  'source_type',
  'public_url',
  'thumbnail_url',
  'hero_url',
  'gallery_url',
  'social_url',
  'alt_text',
  'caption',
  'is_illustrative',
  'review_status',
  'rights_status',
].join(',');

export const ADMIN_MARKETPLACE_IMAGE_COLUMNS = [
  'id',
  'item_id',
  'image_class',
  'image_role',
  'review_status',
  'rights_status',
  'source_type',
  'source_name',
  'source_url',
  'source_reference',
  'original_storage_bucket',
  'original_storage_path',
  'edited_storage_bucket',
  'edited_storage_path',
  'public_storage_bucket',
  'public_storage_path',
  'public_url',
  'thumbnail_url',
  'hero_url',
  'gallery_url',
  'social_url',
  'alt_text',
  'caption',
  'is_evidence_image',
  'is_illustrative',
  'adobe_edit_summary',
  'content_credentials_status',
  'content_credentials_reference',
  'rejection_reason',
  'reviewed_at',
  'created_at',
  'updated_at',
].join(',');

export function toPublicMarketplaceImageDTO(row: MarketplaceItemImageRow): PublicMarketplaceImageDTO | null {
  if (!isPublicRenderableMarketplaceImage(row)) return null;
  if (row.image_class === 'ADMIN_PRIVATE_EVIDENCE') return null;

  return {
    id: row.id,
    itemId: row.item_id,
    role: row.image_role,
    imageClass: row.image_class,
    publicUrl: row.public_url,
    thumbnailUrl: row.thumbnail_url,
    heroUrl: row.hero_url,
    galleryUrl: row.gallery_url,
    socialUrl: row.social_url,
    altText: row.alt_text || 'Harbourview marketplace image',
    caption: row.caption,
    isIllustrative: row.is_illustrative,
    sourceDisplayLabel: getMarketplaceImageSourceDisplayLabel(row),
  };
}

export function toAdminMarketplaceImageDTO(row: MarketplaceItemImageRow): AdminMarketplaceImageDTO {
  return {
    id: row.id,
    itemId: row.item_id,
    imageClass: row.image_class,
    imageRole: row.image_role,
    reviewStatus: row.review_status,
    rightsStatus: row.rights_status,
    sourceType: row.source_type,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceReference: row.source_reference,
    originalStorageBucket: row.original_storage_bucket,
    originalStoragePath: row.original_storage_path,
    editedStorageBucket: row.edited_storage_bucket,
    editedStoragePath: row.edited_storage_path,
    publicStorageBucket: row.public_storage_bucket,
    publicStoragePath: row.public_storage_path,
    publicUrl: row.public_url,
    thumbnailUrl: row.thumbnail_url,
    heroUrl: row.hero_url,
    galleryUrl: row.gallery_url,
    socialUrl: row.social_url,
    altText: row.alt_text,
    caption: row.caption,
    isEvidenceImage: row.is_evidence_image,
    isIllustrative: row.is_illustrative,
    adobeEditSummary: row.adobe_edit_summary,
    contentCredentialsStatus: row.content_credentials_status,
    contentCredentialsReference: row.content_credentials_reference,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
