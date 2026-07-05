'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const VALID_TIERS = ['free', 'intel', 'operator'] as const
type Tier = (typeof VALID_TIERS)[number]

export async function updateUserTier(userId: string, tier: string) {
  await requireAdminAuth()

  if (!VALID_TIERS.includes(tier as Tier)) {
    return { ok: false, error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` }
  }

  const supabase = await createSupabaseServiceClient()
  const { error } = await supabase
    .from('user_profiles')
    .update({ tier, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/members')
  return { ok: true }
}
