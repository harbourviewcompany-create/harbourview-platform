import 'server-only';

import { getAdminDataClient, fetchAdminSupabaseJsonMutation, type AdminDataResult } from '@/lib/supabase/adminDataClient';
import { ADMIN_MARKETPLACE_IMAGE_COLUMNS } from './dto';
import { canRejectMarketplaceImage, getMarketplaceImageApprovalBlockers, PRIVATE_MARKETPLACE_IMAGE_BUCKETS } from './rules';
import type { MarketplaceImageApprovalType, MarketplaceItemImageRow } from './types';

const TARGET_TABLE = 'marketplace_item_images';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export type MarketplaceImageMutationResult =
  | { ok: true }
  | { ok: false; code: string; message: string; blockers?: string[] };

export type ApproveMarketplaceImageInput = {
  approvalType: MarketplaceImageApprovalType;
  publicUrl?: string | null;
  thumbnailUrl?: string | null;
  heroUrl?: string | null;
  galleryUrl?: string | null;
  socialUrl?: string | null;
  adobeEditSummary?: string | null;
  contentCredentialsStatus?: string | null;
};

function assertUuid(id: string) {
  return UUID_PATTERN.test(id);
}

async function fetchRawImage(imageId: string): Promise<AdminDataResult<MarketplaceItemImageRow | null>> {
  const client = getAdminDataClient();
  if (!client.ok) return client;

  const response = await fetch(
    `${client.data.url}/rest/v1/${TARGET_TABLE}?select=${ADMIN_MARKETPLACE_IMAGE_COLUMNS}&id=eq.${encodeURIComponent(imageId)}&limit=1`,
    {
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  );

  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'request_failed', message: `Supabase returned ${response.status}: ${text.slice(0, 240)}` },
    };
  }

  const rows = text ? (JSON.parse(text) as MarketplaceItemImageRow[]) : [];
  return { ok: true, data: rows[0] ?? null, source: 'db' };
}

export async function approveMarketplaceImage(imageId: string, input: ApproveMarketplaceImageInput): Promise<MarketplaceImageMutationResult> {
  if (!assertUuid(imageId)) return { ok: false, code: 'invalid_id', message: 'Invalid image id.' };

  const current = await fetchRawImage(imageId);
  if (!current.ok) return { ok: false, code: current.error.code, message: current.error.message };
  if (!current.data) return { ok: false, code: 'not_found', message: 'Marketplace image not found.' };

  const candidate = {
    ...current.data,
    public_url: input.publicUrl ?? current.data.public_url,
    adobe_edit_summary: input.adobeEditSummary ?? current.data.adobe_edit_summary,
  };
  const blockers = getMarketplaceImageApprovalBlockers(candidate, input.approvalType);
  if (blockers.length) {
    return { ok: false, code: 'approval_blocked', message: 'Marketplace image approval blocked.', blockers };
  }

  const patch: Record<string, unknown> = {
    review_status: input.approvalType,
    reviewed_at: new Date().toISOString(),
    public_url: input.publicUrl ?? current.data.public_url,
    thumbnail_url: input.thumbnailUrl ?? current.data.thumbnail_url,
    hero_url: input.heroUrl ?? current.data.hero_url,
    gallery_url: input.galleryUrl ?? current.data.gallery_url,
    social_url: input.socialUrl ?? current.data.social_url,
    adobe_edit_summary: input.adobeEditSummary ?? current.data.adobe_edit_summary,
    content_credentials_status: input.contentCredentialsStatus ?? current.data.content_credentials_status,
    rejection_reason: null,
  };

  const result = await fetchAdminSupabaseJsonMutation<null>(
    `/rest/v1/${TARGET_TABLE}?id=eq.${encodeURIComponent(imageId)}`,
    'PATCH',
    patch,
  );

  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true };
}

export async function rejectMarketplaceImage(imageId: string, rejectionReason: string): Promise<MarketplaceImageMutationResult> {
  if (!assertUuid(imageId)) return { ok: false, code: 'invalid_id', message: 'Invalid image id.' };
  if (!canRejectMarketplaceImage(rejectionReason)) {
    return { ok: false, code: 'rejection_reason_required', message: 'Cannot reject without rejection_reason.' };
  }

  const result = await fetchAdminSupabaseJsonMutation<null>(
    `/rest/v1/${TARGET_TABLE}?id=eq.${encodeURIComponent(imageId)}`,
    'PATCH',
    {
      review_status: 'REJECTED',
      rejection_reason: rejectionReason.trim(),
      reviewed_at: new Date().toISOString(),
    },
  );

  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true };
}

export async function replaceMarketplaceImage(imageId: string, replacementImageId: string): Promise<MarketplaceImageMutationResult> {
  if (!assertUuid(imageId) || !assertUuid(replacementImageId)) return { ok: false, code: 'invalid_id', message: 'Invalid image id.' };

  const result = await fetchAdminSupabaseJsonMutation<null>(
    `/rest/v1/${TARGET_TABLE}?id=eq.${encodeURIComponent(imageId)}`,
    'PATCH',
    {
      review_status: 'REPLACED',
      replaced_by_image_id: replacementImageId,
      reviewed_at: new Date().toISOString(),
    },
  );

  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true };
}

export async function createMarketplacePrivateImageSignedUrl(imageId: string, field: 'original' | 'edited' = 'original') {
  if (!assertUuid(imageId)) return { ok: false as const, code: 'invalid_id', message: 'Invalid image id.' };

  const current = await fetchRawImage(imageId);
  if (!current.ok) return { ok: false as const, code: current.error.code, message: current.error.message };
  if (!current.data) return { ok: false as const, code: 'not_found', message: 'Marketplace image not found.' };

  const bucket = field === 'edited' ? current.data.edited_storage_bucket : current.data.original_storage_bucket;
  const path = field === 'edited' ? current.data.edited_storage_path : current.data.original_storage_path;

  if (!bucket || !path) return { ok: false as const, code: 'missing_private_path', message: 'Private image path is missing.' };
  if (!(PRIVATE_MARKETPLACE_IMAGE_BUCKETS as readonly string[]).includes(bucket)) {
    return { ok: false as const, code: 'not_private_bucket', message: 'Signed URL is only allowed for private marketplace image buckets.' };
  }

  const client = getAdminDataClient();
  if (!client.ok) return { ok: false as const, code: client.error.code, message: client.error.message };

  const response = await fetch(
    `${client.data.url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'POST',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: 300 }),
      cache: 'no-store',
    },
  );

  const text = await response.text();
  if (!response.ok) {
    return { ok: false as const, code: 'signed_url_failed', message: `Supabase signed URL request failed ${response.status}: ${text.slice(0, 160)}` };
  }

  const body = text ? (JSON.parse(text) as { signedURL?: string; signedUrl?: string }) : {};
  const signedPath = body.signedURL || body.signedUrl;
  if (!signedPath) return { ok: false as const, code: 'signed_url_missing', message: 'Supabase did not return a signed URL.' };

  return { ok: true as const, signedUrl: signedPath.startsWith('http') ? signedPath : `${client.data.url}${signedPath}`, expiresInSeconds: 300 };
}
