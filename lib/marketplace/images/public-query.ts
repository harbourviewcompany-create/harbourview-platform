import 'server-only';

import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';
import type { PublicMarketplaceImageDTO } from './dto';
import { PUBLIC_MARKETPLACE_IMAGE_COLUMNS, toPublicMarketplaceImageDTO } from './dto';
import { galleryMarketplaceImageRoleRank, publicMarketplaceImageRoleRank } from './rules';
import type { MarketplaceItemImageRow } from './types';

const TARGET_TABLE = 'marketplace_item_images';

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
}

async function queryPublicImages(params: URLSearchParams): Promise<PublicMarketplaceImageDTO[]> {
  const anonKey = getAnonKey();
  if (!anonKey) return [];

  try {
    const res = await fetch(`${resolveLockedSupabaseUrl()}/rest/v1/${TARGET_TABLE}?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];
    const rows = (await res.json()) as MarketplaceItemImageRow[];
    return rows.map(toPublicMarketplaceImageDTO).filter((image): image is PublicMarketplaceImageDTO => Boolean(image));
  } catch {
    return [];
  }
}

export async function getPublicMarketplaceImagesForItems(itemIds: string[]): Promise<Record<string, PublicMarketplaceImageDTO[]>> {
  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  if (!ids.length) return {};

  const params = new URLSearchParams({
    select: PUBLIC_MARKETPLACE_IMAGE_COLUMNS,
    item_id: `in.(${ids.join(',')})`,
    review_status: 'eq.APPROVED_PUBLIC',
    rights_status: 'neq.UNKNOWN',
    order: 'image_role.asc,created_at.asc',
    limit: String(Math.min(ids.length * 12, 500)),
  });

  const rows = await queryPublicImages(params);
  return rows.reduce<Record<string, PublicMarketplaceImageDTO[]>>((acc, image) => {
    acc[image.itemId] = [...(acc[image.itemId] || []), image];
    return acc;
  }, {});
}

export async function getPublicMarketplaceImagesForItem(itemId: string): Promise<PublicMarketplaceImageDTO[]> {
  return (await getPublicMarketplaceImagesForItems([itemId]))[itemId] || [];
}

export function pickMarketplaceCardImage(images: PublicMarketplaceImageDTO[]) {
  return [...images].sort((a, b) => publicMarketplaceImageRoleRank(a.role) - publicMarketplaceImageRoleRank(b.role))[0] || null;
}

export function sortMarketplaceGalleryImages(images: PublicMarketplaceImageDTO[]) {
  return [...images].sort((a, b) => galleryMarketplaceImageRoleRank(a.role) - galleryMarketplaceImageRoleRank(b.role));
}
