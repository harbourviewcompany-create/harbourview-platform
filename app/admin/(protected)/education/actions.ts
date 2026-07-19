'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { fetchAdminSupabaseJsonMutation } from '@/lib/supabase/adminDataClient';

export async function markEducationModuleReviewed(moduleId: string) {
  const { user } = await requireAdminAuth();

  const result = await fetchAdminSupabaseJsonMutation(
    `/rest/v1/education_modules?id=eq.${encodeURIComponent(moduleId)}`,
    'PATCH',
    {
      content_review_status: 'human_reviewed',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    },
  );

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  revalidatePath('/admin/education');
}
