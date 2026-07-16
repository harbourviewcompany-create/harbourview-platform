'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { networkAdminRequest } from '@/lib/network/serverAccess';
import type { NetworkReviewItemRow, NetworkReviewStatus } from '@/lib/network/serverTypes';

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

  // Publish first -- this is the operation with real constraints that can
  // fail (empty fields, the review_item_id uniqueness constraint on
  // repeat-approve). Only mark the review item approved once the projection
  // is confirmed written, so a failed publish never leaves the review item
  // in a false "approved" state with nothing actually published.
  const publishResult = await networkAdminRequest('/rest/v1/network_public_projections', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
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
    }),
  });

  if (!publishResult.ok) {
    throw new Error(`Publish failed, review item left unapproved: ${publishResult.error.message}`);
  }

  const statusResult = await updateReviewStatus(itemId, 'approved_public_summary', user.id);
  if (!statusResult.ok) throw new Error(statusResult.error.message);

  revalidatePath('/admin/network');
}
