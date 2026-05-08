import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

function preview(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .slice(0, 200);
}

export async function GET() {
  await requireAdminAuth();

  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim() || '';
  const resolvedSupabaseUrl = resolveLockedSupabaseUrl();
  const directFetch = {
    attempted: false,
    status: null as number | null,
    responsePreviewFirst200: 'skipped',
  };

  if (key) {
    directFetch.attempted = true;
    try {
      const response = await fetch(`${resolvedSupabaseUrl}/rest/v1/marketplace_inquiries?limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      const text = await response.text();
      directFetch.status = response.status;
      directFetch.responsePreviewFirst200 = preview(text);
    } catch (error) {
      directFetch.responsePreviewFirst200 = error instanceof Error ? error.message.slice(0, 200) : 'unknown fetch error';
    }
  }

  return Response.json({
    hasServiceRoleKey: Boolean(key),
    serviceRoleKeyLength: key.length,
    adminReviewEnabled: process.env.HARBOURVIEW_ADMIN_REVIEW_ENABLED ?? null,
    resolvedSupabaseUrl,
    directFetch,
  });
}
