'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { getAdminDataClient } from '@/lib/supabase/adminDataClient';
import { canTransitionReviewStatus, isInquiryPriority, isReviewStatus } from '@/lib/marketplace/inquiryWorkflow';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_NOTES_LENGTH = 4000;

type ExistingWorkflowRow = {
  last_contacted_at: string | null;
  review_status: string | null;
};

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDateTime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeWorkflowFields(formData: FormData) {
  return {
    reviewStatus: readField(formData, 'review_status'),
    priority: readField(formData, 'priority'),
    notes: readField(formData, 'internal_response_notes'),
    nextFollowUpAt: normalizeDateTime(readField(formData, 'next_follow_up_at')),
    markContactedNow: readField(formData, 'mark_contacted_now') === '1',
  };
}

async function fetchCurrentWorkflow(id: string, url: string, serviceRoleKey: string) {
  const response = await fetch(
    `${url}/rest/v1/marketplace_inquiries?id=eq.${encodeURIComponent(id)}&select=last_contacted_at,review_status&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) return null;
  const rows = await response.json() as ExistingWorkflowRow[];
  return rows[0] ?? null;
}

export async function applyInquiryWorkflowUpdate(id: string, formData: FormData): Promise<boolean> {
  await requireAdminAuth();

  const { reviewStatus, priority, notes, nextFollowUpAt, markContactedNow } = normalizeWorkflowFields(formData);

  if (!UUID_PATTERN.test(id)) {
    return false;
  }

  if (!isReviewStatus(reviewStatus) || !isInquiryPriority(priority)) {
    return false;
  }

  if (notes.length > MAX_NOTES_LENGTH) {
    return false;
  }

  const client = getAdminDataClient();
  if (!client.ok) {
    return false;
  }

  const current = await fetchCurrentWorkflow(id, client.data.url, client.data.serviceRoleKey);
  if (!current) {
    return false;
  }

  if (!current.review_status || !isReviewStatus(current.review_status)) {
    return false;
  }

  if (!canTransitionReviewStatus(current.review_status, reviewStatus)) {
    return false;
  }

  const patch: {
    review_status: string;
    priority: string;
    internal_response_notes: string | null;
    next_follow_up_at: string | null;
    last_contacted_at?: string;
  } = {
    review_status: reviewStatus,
    priority,
    internal_response_notes: notes || null,
    next_follow_up_at: nextFollowUpAt,
  };

  if (markContactedNow || (reviewStatus === 'contacted' && !current.last_contacted_at)) {
    patch.last_contacted_at = new Date().toISOString();
  }

  const response = await fetch(`${client.data.url}/rest/v1/marketplace_inquiries?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    return false;
  }

  revalidatePath('/admin/inquiries');
  revalidatePath(`/admin/inquiries/${id}`);

  return true;
}

export async function updateInquiryWorkflow(formData: FormData): Promise<void> {
  const id = readField(formData, 'id');
  await applyInquiryWorkflowUpdate(id, formData);
}
