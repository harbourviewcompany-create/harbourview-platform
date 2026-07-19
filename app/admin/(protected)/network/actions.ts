'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { networkAdminRequest } from '@/lib/network/serverAccess';
import type { NetworkReviewItemRow, NetworkReviewStatus } from '@/lib/network/serverTypes';
import { assertPublicSafe } from '@/lib/intelligence-os/publicSafety';

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base.slice(0, 80) : 'item';
}

async function updateReviewStatus(itemId: string, status: NetworkReviewStatus, userId: string) {
  return networkAdminRequest(`/rest/v1/network_review_items?id=eq.${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      review_status: status,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    }),
  });
}

export async function rejectNetworkReviewItem(itemId: string) {
  const { user } = await requireAdminAuth();
  const result = await updateReviewStatus(itemId, 'rejected', user.id);
  if (!result.ok) throw new Error(result.error.message);
  revalidatePath('/admin/network');
}

export async function requestClarificationNetworkReviewItem(itemId: string) {
  const { user } = await requireAdminAuth();
  const result = await updateReviewStatus(itemId, 'needs_clarification', user.id);
  if (!result.ok) throw new Error(result.error.message);
  revalidatePath('/admin/network');
}

export async function approveNetworkReviewItem(itemId: string) {
  const { user } = await requireAdminAuth();

  const fetchResult = await networkAdminRequest<NetworkReviewItemRow[]>(
    `/rest/v1/network_review_items?id=eq.${encodeURIComponent(itemId)}&select=*`,
  );
  if (!fetchResult.ok) throw new Error(fetchResult.error.message);
  const item = fetchResult.data?.[0];
  if (!item) throw new Error('Review item not found.');

  const name = item.title_public_draft ?? item.title_internal;
  const publicSummary = item.public_summary_draft;
  if (!name?.trim() || !publicSummary?.trim()) {
    throw new Error(
      'Cannot publish: title or public summary draft is empty. Add a public summary before approving.',
    );
  }

  const slug = slugify(item.source_ref ?? item.title_public_draft ?? item.title_internal ?? item.id);

  const projectionPayload = {
    review_item_id: item.id,
    object_type: item.object_type,
    slug,
    name,
    public_summary: publicSummary,
    country_label: item.country_label,
    category_label: item.category_label,
    published_state: 'published',
    published_at: new Date().toISOString(),
    published_by: user.id,
    is_active: true,
    version: 1,
  };

  // Defense-in-depth: network_public_projections is publicly SELECT-able via
  // RLS the instant a row lands with published_state='published' (see
  // network_public_projections_published_read in
  // supabase/migrations/20260512000001_network_persistence_v1.sql). The
  // producer triggers in this PR (20260713130000_network_review_producers.sql)
  // copy raw source text -- e.g. a listing's own description -- straight into
  // title_public_draft/public_summary_draft with no sanitization; the admin's
  // approve click is the only gate before it goes public. Run the same
  // public-safety check the marketplace's own public projection path already
  // uses (lib/marketplace/publicProjection.ts -> assertPublicSafe) so a draft
  // that happens to carry a leaked source URL, contact address, or internal
  // note doesn't get published just because an admin approved the item without
  // catching it in the preview.
  try {
    assertPublicSafe(projectionPayload);
  } catch (error) {
    throw new Error(
      `Cannot publish: draft content failed the public-safety check -- ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }

  // Publish first -- this is the operation with real constraints that can
  // fail (empty fields, the review_item_id uniqueness constraint on
  // repeat-approve). Only mark the review item approved once the projection
  // is confirmed written, so a failed publish never leaves the review item
  // in a false "approved" state with nothing actually published.
  const publishResult = await networkAdminRequest('/rest/v1/network_public_projections', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(projectionPayload),
  });

  if (!publishResult.ok) {
    throw new Error(`Publish failed, review item left unapproved: ${publishResult.error.message}`);
  }

  const statusResult = await updateReviewStatus(itemId, 'approved_public_summary', user.id);
  if (!statusResult.ok) throw new Error(statusResult.error.message);

  revalidatePath('/admin/network');
}
