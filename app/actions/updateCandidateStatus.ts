'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { updateCandidateStatus } from '@/lib/marketplace/candidates';

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function updateMarketplaceCandidateStatus(formData: FormData): Promise<void> {
  const auth = await requireAdminAuth();
  const id = readField(formData, 'id');
  const toStatus = readField(formData, 'to_status');
  const note = readField(formData, 'note');

  const result = await updateCandidateStatus({
    id,
    toStatus,
    note,
    userId: auth.user.id,
  });

  if (!result.ok) {
    redirect(`/admin/candidates/${id}?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath('/admin/candidates');
  revalidatePath(`/admin/candidates/${id}`);
}
