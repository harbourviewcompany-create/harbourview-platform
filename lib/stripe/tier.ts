import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type UserTier = 'free' | 'intel' | 'operator'

export async function getUserTier(): Promise<UserTier> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single()

    return (profile?.tier as UserTier) ?? 'free'
  } catch {
    return 'free'
  }
}

export function tierAtLeast(userTier: UserTier, required: UserTier): boolean {
  const order: UserTier[] = ['free', 'intel', 'operator']
  return order.indexOf(userTier) >= order.indexOf(required)
}
