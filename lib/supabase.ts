// Supabase client setup
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'

export const supabase = createClient(getSupabaseUrl(), getSupabasePublicClientKey())
