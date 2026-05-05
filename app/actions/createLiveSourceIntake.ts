'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { createManualSourceIntake } from '@/lib/marketplace/liveSources';

export async function createLiveSourceIntake(formData: FormData): Promise<void> {
  const auth = await requireAdminAuth();
  const result = await createManualSourceIntake(formData, auth.user.id);

  if (!result.ok) {
    redirect(`/admin/sources/new?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath('/admin/sources');
  revalidatePath('/admin/candidates');
  redirect(`/admin/candidates/${result.data.candidate.id}`);
}
