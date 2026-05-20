import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';

export type InquiryInsertPayload = {
  listing_id: string | null;
  buyer_request_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_company: string;
  contact_phone: string | null;
  inquiry_type: string;
  message: string;
  status: 'received';
};

export function getMarketplaceInquirySupabaseConfig() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!anonKey) return null;

  return {
    url: resolveLockedSupabaseUrl(),
    anonKey,
  };
}

export function formatSupabaseDiagnosticContext() {
  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  };
}

export async function postMarketplaceInquiry(payload: InquiryInsertPayload) {
  const supabase = getMarketplaceInquirySupabaseConfig();
  if (!supabase) {
    return { ok: false as const, kind: 'config_missing' as const, context: formatSupabaseDiagnosticContext() };
  }

  const response = await fetch(`${supabase.url}/rest/v1/marketplace_inquiries`, {
    method: 'POST',
    headers: {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${supabase.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {
      ok: false as const,
      kind: 'insert_failed' as const,
      context: {
        status: response.status,
        statusText: response.statusText,
      },
    };
  }

  return { ok: true as const };
}
