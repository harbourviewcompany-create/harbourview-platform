export const MARKETPLACE_IMAGE_STORAGE_BUCKETS = {
  originals: 'marketplace-item-originals',
  working: 'marketplace-item-working',
  public: 'marketplace-item-public',
} as const;

export type MarketplaceImageStorageVariant = 'original' | 'edited' | 'card' | 'hero' | 'gallery' | 'social';

export function getMarketplaceImageStoragePath({
  itemId,
  imageId,
  variant,
  extension = variant === 'original' || variant === 'edited' ? 'jpg' : 'webp',
}: {
  itemId: string;
  imageId: string;
  variant: MarketplaceImageStorageVariant;
  extension?: string;
}) {
  if (variant === 'original') return `items/${itemId}/original/${imageId}.${extension}`;
  if (variant === 'edited') return `items/${itemId}/edited/${imageId}.${extension}`;
  return `items/${itemId}/${variant}/${imageId}.${extension}`;
}

export function isPrivateMarketplaceImageBucket(bucket: string | null | undefined) {
  return bucket === MARKETPLACE_IMAGE_STORAGE_BUCKETS.originals || bucket === MARKETPLACE_IMAGE_STORAGE_BUCKETS.working;
}

export function isPublicMarketplaceImageBucket(bucket: string | null | undefined) {
  return bucket === MARKETPLACE_IMAGE_STORAGE_BUCKETS.public;
}
