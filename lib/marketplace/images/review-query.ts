import 'server-only';

import { fetchAdminSupabaseJson, type AdminDataResult } from '@/lib/supabase/adminDataClient';
import { ADMIN_MARKETPLACE_IMAGE_COLUMNS, toAdminMarketplaceImageDTO, type AdminMarketplaceImageDTO } from './dto';
import type { MarketplaceItemImageRow } from './types';

const TARGET_TABLE = 'marketplace_item_images';

export type MarketplaceImageQueueFilters = {
  reviewStatus?: string;
  imageClass?: string;
  rightsStatus?: string;
  sourceType?: string;
  itemId?: string;
};

function appendFilter(parts: string[], key: string, value?: string) {
  if (value?.trim()) parts.push(`${key}=eq.${encodeURIComponent(value.trim())}`);
}

export async function listAdminMarketplaceImages(
  filters: MarketplaceImageQueueFilters = {},
): Promise<AdminDataResult<AdminMarketplaceImageDTO[]>> {
  const parts = [
    `select=${ADMIN_MARKETPLACE_IMAGE_COLUMNS}`,
    'order=created_at.desc',
    'limit=200',
  ];
  appendFilter(parts, 'review_status', filters.reviewStatus);
  appendFilter(parts, 'image_class', filters.imageClass);
  appendFilter(parts, 'rights_status', filters.rightsStatus);
  appendFilter(parts, 'source_type', filters.sourceType);
  appendFilter(parts, 'item_id', filters.itemId);

  const result = await fetchAdminSupabaseJson<MarketplaceItemImageRow[]>(`/rest/v1/${TARGET_TABLE}?${parts.join('&')}`);
  if (!result.ok) return result as AdminDataResult<AdminMarketplaceImageDTO[]>;
  return { ok: true, data: result.data.map(toAdminMarketplaceImageDTO), source: result.source };
}

export async function getAdminMarketplaceImage(imageId: string): Promise<AdminDataResult<AdminMarketplaceImageDTO | null>> {
  const result = await fetchAdminSupabaseJson<MarketplaceItemImageRow[]>(
    `/rest/v1/${TARGET_TABLE}?select=${ADMIN_MARKETPLACE_IMAGE_COLUMNS}&id=eq.${encodeURIComponent(imageId)}&limit=1`,
  );
  if (!result.ok) return result as AdminDataResult<AdminMarketplaceImageDTO | null>;
  return { ok: true, data: result.data[0] ? toAdminMarketplaceImageDTO(result.data[0]) : null, source: result.source };
}

export function summarizeMarketplaceImageQueue(images: AdminMarketplaceImageDTO[]) {
  return images.reduce<Record<string, number>>((acc, image) => {
    acc[image.reviewStatus] = (acc[image.reviewStatus] ?? 0) + 1;
    return acc;
  }, {});
}
