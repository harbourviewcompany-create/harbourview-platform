import 'server-only';

import { resolveLockedSupabaseUrl, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env';
import type { PublicMarketplaceImageDTO } from './dto';
import { PUBLIC_MARKETPLACE_IMAGE_COLUMNS, toPublicMarketplaceImageDTO } from './dto';
import { galleryMarketplaceImageRoleRank, publicMarketplaceImageRoleRank } from './rules';
import type { MarketplaceItemImageRow } from './types';

const TARGET_TABLE = 'marketplace_item_images';
const ITEM_ID_BATCH_SIZE = 80;
const PAGE_SIZE = 500;

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
}

async function queryPublicImagePage(
  params: URLSearchParams,
  rangeStart: number,
  signal?: AbortSignal,
): Promise<PublicMarketplaceImageDTO[] | null> {
  const anonKey = getAnonKey();
  if (!anonKey) return [];

  try {
    const res = await fetch(`${resolveLockedSupabaseUrl()}/rest/v1/${TARGET_TABLE}?${params.toString()}`, {
      // Align with public listings cache — image rows change only on admin publish.
      next: { revalidate: 300 },
      signal,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
        'Accept-Profile': SUPABASE_DB_SCHEMA,
        Range: `${rangeStart}-${rangeStart + PAGE_SIZE - 1}`,
      },
    });

    if (!res.ok) return null;
    const rows = (await res.json()) as MarketplaceItemImageRow[];
    return rows.map(toPublicMarketplaceImageDTO).filter((image): image is PublicMarketplaceImageDTO => Boolean(image));
  } catch {
    return null;
  }
}

function chunks<T>(values: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

async function queryPublicImageBatch(itemIds: string[], signal?: AbortSignal): Promise<PublicMarketplaceImageDTO[]> {
  const params = new URLSearchParams({
    select: PUBLIC_MARKETPLACE_IMAGE_COLUMNS,
    item_id: `in.(${itemIds.join(',')})`,
    review_status: 'eq.APPROVED_PUBLIC',
    rights_status: 'neq.UNKNOWN',
    order: 'image_role.asc,id.asc',
  });

  const rows: PublicMarketplaceImageDTO[] = [];
  for (let rangeStart = 0; ; rangeStart += PAGE_SIZE) {
    const page = await queryPublicImagePage(params, rangeStart, signal);
    if (page === null) throw new Error('MARKETPLACE_MEDIA_QUERY_FAILED');
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export async function getPublicMarketplaceImagesForItems(itemIds: string[], signal?: AbortSignal): Promise<Record<string, PublicMarketplaceImageDTO[]>> {
  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  if (!ids.length) return {};

  const batches = chunks(ids, ITEM_ID_BATCH_SIZE);
  const batchRows = await Promise.all(batches.map(batch => queryPublicImageBatch(batch, signal)));

  return batchRows.flat().reduce<Record<string, PublicMarketplaceImageDTO[]>>((acc, image) => {
    acc[image.itemId] = [...(acc[image.itemId] || []), image];
    return acc;
  }, {});
}

export async function getPublicMarketplaceImagesForItem(itemId: string): Promise<PublicMarketplaceImageDTO[]> {
  return (await getPublicMarketplaceImagesForItems([itemId]))[itemId] || [];
}

function marketplaceImageTrustRank(image: PublicMarketplaceImageDTO) {
  if (image.imageClass === 'REAL_ITEM_EVIDENCE') return 0;
  if (image.imageClass === 'MANUFACTURER_CATALOGUE') return 1;
  if (image.imageClass === 'HARBOURVIEW_ILLUSTRATIVE') return 2;
  return 3;
}

/** Prefer real-item evidence, then catalogue, then illustrative. */
export function pickMarketplaceCardImage(images: PublicMarketplaceImageDTO[]) {
  return (
    [...images].sort((a, b) => {
      const trustRank = marketplaceImageTrustRank(a) - marketplaceImageTrustRank(b);
      if (trustRank !== 0) return trustRank;
      const roleRank = publicMarketplaceImageRoleRank(a.role) - publicMarketplaceImageRoleRank(b.role);
      if (roleRank !== 0) return roleRank;
      return a.id.localeCompare(b.id);
    })[0] || null
  );
}

export function sortMarketplaceGalleryImages(images: PublicMarketplaceImageDTO[]) {
  return [...images].sort((a, b) => {
    const roleRank = galleryMarketplaceImageRoleRank(a.role) - galleryMarketplaceImageRoleRank(b.role);
    return roleRank !== 0 ? roleRank : a.id.localeCompare(b.id);
  });
}
