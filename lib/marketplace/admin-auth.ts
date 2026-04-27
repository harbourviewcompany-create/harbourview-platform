// lib/marketplace/admin-auth.ts
// Harbourview Marketplace v1 — admin authorization guard
// Server-only. Never import in client components or public routes.
// Consistent with app/api/admin/marketplace/[id]/route.ts auth pattern.

import { createServerClient } from '@/lib/supabase/server';

export type AdminAuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; reason: string };

/**
 * Verify the current session user has platform_role = 'admin'.
 * Uses the user-authenticated client so RLS is exercised on the profiles lookup.
 */
export async function requireMarketplaceAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { authorized: false, reason: 'Not authenticated' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('platform_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { authorized: false, reason: 'Profile not found' };
    }

    if (profile.platform_role !== 'admin') {
      return { authorized: false, reason: 'Insufficient role' };
    }

    return { authorized: true, userId: user.id };
  } catch {
    return { authorized: false, reason: 'Authorization check failed' };
  }
}

/** Standard 403 response */
export function unauthorizedResponse(reason: string): Response {
  return new Response(JSON.stringify({ error: 'Forbidden', reason }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
