import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';

export type InquirySubmissionPayload = {
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

export type InquirySubmissionConfig = {
  url: string;
  anonKey: string;
};

export function getInquirySubmissionConfig(): InquirySubmissionConfig | null {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!anonKey) return null;
  return { url: resolveLockedSupabaseUrl(), anonKey };
}

export async function postMarketplaceInquiry(payload: InquirySubmissionPayload, config: InquirySubmissionConfig) {
  return fetch(`${config.url}/rest/v1/marketplace_inquiries`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
}

export function formatSubmissionDiagnosticContext(response: Response) {
  return {
    status: response.status,
    statusText: response.statusText,
  };
}
