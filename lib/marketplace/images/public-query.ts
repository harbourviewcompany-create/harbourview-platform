import 'server-only';

import { resolveLockedSupabaseUrl, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env';
import type { PublicMarketplaceImageDTO } from './dto';
import { PUBLIC_MARKETPLACE_IMAGE_COLUMNS, toPublicMarketplaceImageDTO } from './dto';
import { galleryMarketplaceImageRoleRank, publicMarketplaceImageRoleRank } from './rules';
import type { MarketplaceItemImageRow } from './types';

const TARGET_TABLE = 'marketplace_item_images';
const CARD_MEDIA_VIEW = 'marketplace_item_card_media_v1';
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

/**
 * Fast path: one pre-ranked card row per item from marketplace_item_card_media_v1.
 * Falls back to full image rows if the view is unavailable.
 */
async function queryCardMediaBatch(itemIds: string[], signal?: AbortSignal): Promise<Record<string, PublicMarketplaceImageDTO[]> | null> {
  const anonKey = getAnonKey();
  if (!anonKey || itemIds.length === 0) return {};

  try {
    const params = new URLSearchParams({
      select: 'item_id,image_id,image_class,image_role,public_url,thumbnail_url,hero_url,gallery_url,alt_text,caption,is_illustrative,source_name',
      item_id: `in.(${itemIds.join(',')})`,
    });
    const res = await fetch(`${resolveLockedSupabaseUrl()}/rest/v1/${CARD_MEDIA_VIEW}?${params.toString()}`, {
      next: { revalidate: 300 },
      signal,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
        'Accept-Profile': SUPABASE_DB_SCHEMA,
      },
    });
    if (!res.ok) return null;

    const rows = (await res.json()) as Array<{
      item_id: string
      image_id: string
      image_class: PublicMarketplaceImageDTO['imageClass']
      image_role: PublicMarketplaceImageDTO['role']
      public_url: string | null
      thumbnail_url: string | null
      hero_url: string | null
      gallery_url: string | null
      alt_text: string | null
      caption: string | null
      is_illustrative: boolean
      source_name: string | null
    }>;

    return rows.reduce<Record<string, PublicMarketplaceImageDTO[]>>((acc, row) => {
      const dto: PublicMarketplaceImageDTO = {
        id: row.image_id,
        itemId: row.item_id,
        imageClass: row.image_class,
        role: row.image_role,
        publicUrl: row.public_url,
        thumbnailUrl: row.thumbnail_url,
        heroUrl: row.hero_url,
        galleryUrl: row.gallery_url,
        altText: row.alt_text,
        caption: row.caption,
        isIllustrative: row.is_illustrative,
        sourceDisplayLabel: row.source_name,
      };
      acc[row.item_id] = [dto];
      return acc;
    }, {});
  } catch {
    return null;
  }
}

export async function getPublicMarketplaceImagesForItems(itemIds: string[], signal?: AbortSignal): Promise<Record<string, PublicMarketplaceImageDTO[]>> {
  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  if (!ids.length) return {};

  // Prefer the card-media view (one ranked row per item).
  const cardBatches = chunks(ids, ITEM_ID_BATCH_SIZE);
  const cardResults = await Promise.all(cardBatches.map(batch => queryCardMediaBatch(batch, signal)));
  if (cardResults.every(result => result !== null)) {
    return cardResults.reduce<Record<string, PublicMarketplaceImageDTO[]>>((acc, batch) => {
      Object.assign(acc, batch);
      return acc;
    }, {});
  }

  // Fallback: full image table enrichment.
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
