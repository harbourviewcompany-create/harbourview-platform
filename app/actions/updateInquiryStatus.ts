'use server';

import { revalidatePath } from 'next/cache';

const ALLOWED_STATUSES = new Set(['new', 'reviewing', 'qualified', 'disqualified', 'responded', 'closed']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getServiceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminReviewEnabled = process.env.HARBOURVIEW_ADMIN_REVIEW_ENABLED === 'true';

  if (!url || !serviceRoleKey || !adminReviewEnabled) return null;
  return { url: url.replace(/\/$/, ''), serviceRoleKey };
}

export async function updateInquiryStatus(formData: FormData): Promise<void> {
  const id = readField(formData, 'id');
  const status = readField(formData, 'status');

  if (!UUID_PATTERN.test(id)) {
    return;
  }

  if (!ALLOWED_STATUSES.has(status)) {
    return;
  }

  const supabase = getServiceConfig();
  if (!supabase) {
    return;
  }

  const response = await fetch(`${supabase.url}/rest/v1/marketplace_inquiries?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${supabase.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });

  if (!response.ok) {
    return;
  }

  revalidatePath('/admin/inquiries');
  revalidatePath(`/admin/inquiries/${id}`);
}
