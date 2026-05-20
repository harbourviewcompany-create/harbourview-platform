import { NextResponse } from 'next/server';
import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification';
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';
import { marketplaceCaptureSchema } from '@/lib/marketplace/intakeValidation';
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROUTE_ID = '/api/marketplace/capture';
const ABUSE_REJECTION_CODE = 'ABUSE_REJECTED';

type CaptureDiagnosticCode =
  | 'CAPTURE_VALIDATION_PAYLOAD'
  | 'CAPTURE_CONFIG_MISSING'
  | 'CAPTURE_SUPABASE_REQUEST_FAILED'
  | 'CAPTURE_SUPABASE_INSERT_FAILED'
  | 'CAPTURE_RATE_LIMITED'
  | 'CAPTURE_BOT_REJECTED'
  | 'CAPTURE_OK';

function withCode(message: string, code: CaptureDiagnosticCode | typeof ABUSE_REJECTION_CODE) {
  return `${message} [${code}]`;
}

function json(status: 'success' | 'error', message: string, httpStatus = 200, retryAfterSeconds?: number) {
  return NextResponse.json(
    { status, message },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store',
        ...(retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {}),
      },
    },
  );
}
function getSupabaseConfig() { const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; if (!anonKey) return null; return { url: resolveLockedSupabaseUrl(), anonKey }; }
function logCaptureDiagnostic(code: CaptureDiagnosticCode, details?: Record<string, string | number | boolean | null>) { console.info('harbourview_marketplace_capture', { code, ...details }); }

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = enforceRateLimit({ route: ROUTE_ID, ip, limit: 20, windowMs: 60_000 });
  if (!ipLimit.allowed) {
    logCaptureDiagnostic('CAPTURE_RATE_LIMITED', { ip, retryAfterSeconds: ipLimit.retryAfterSeconds });
    return json('error', withCode('Too many requests. Please try again shortly.', ABUSE_REJECTION_CODE), 429, ipLimit.retryAfterSeconds);
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json('error', withCode('Invalid marketplace capture payload.', 'CAPTURE_VALIDATION_PAYLOAD'), 400); }

  const parsed = marketplaceCaptureSchema.safeParse(body);
  if (!parsed.success) {
    logCaptureDiagnostic('CAPTURE_VALIDATION_PAYLOAD', { issues: parsed.error.issues.length });
    return NextResponse.json({ status: 'error', message: withCode('Invalid inquiry payload.', 'CAPTURE_VALIDATION_PAYLOAD'), errors: parsed.error.flatten() }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  if (parsed.data.hp_field?.trim()) {
    logCaptureDiagnostic('CAPTURE_BOT_REJECTED', { reason: 'honeypot', ip });
    return json('error', withCode('Request rejected.', ABUSE_REJECTION_CODE), 429);
  }

  const expectedToken = process.env.MARKETPLACE_FORM_CHALLENGE_TOKEN;
  if (expectedToken && parsed.data.challenge_token !== expectedToken) {
    logCaptureDiagnostic('CAPTURE_BOT_REJECTED', { reason: 'challenge', ip });
    return json('error', withCode('Request rejected.', ABUSE_REJECTION_CODE), 429);
  }

  const { contact_name: contactName, contact_email: contactEmail, contact_company: contactCompany, contact_phone: contactPhone, inquiry_type: inquiryType, message } = parsed.data;
  const identityLimit = enforceRateLimit({ route: ROUTE_ID, ip, identity: contactEmail, limit: 8, windowMs: 60_000 });
  if (!identityLimit.allowed) {
    logCaptureDiagnostic('CAPTURE_RATE_LIMITED', { ip, retryAfterSeconds: identityLimit.retryAfterSeconds, hasEmail: true });
    return json('error', withCode('Too many requests. Please try again shortly.', ABUSE_REJECTION_CODE), 429, identityLimit.retryAfterSeconds);
  }

  const successMessage = parsed.data.success_message || 'Marketplace inquiry received. Harbourview will review it before response or routing. [CAPTURE_OK]';
  const supabase = getSupabaseConfig(); if (!supabase) { logCaptureDiagnostic('CAPTURE_CONFIG_MISSING', { hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) }); return json('error', withCode('Inquiry capture is not configured yet. Please contact Harbourview directly.', 'CAPTURE_CONFIG_MISSING'), 500); }

  const payload = { listing_id: null, buyer_request_id: null, contact_name: contactName, contact_email: contactEmail, contact_company: contactCompany, contact_phone: contactPhone, inquiry_type: inquiryType, message, status: 'received' };
  let response: Response;
  try { response = await fetch(`${supabase.url}/rest/v1/marketplace_inquiries`, { method: 'POST', cache: 'no-store', headers: { apikey: supabase.anonKey, Authorization: `Bearer ${supabase.anonKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(payload) }); } catch (error) { logCaptureDiagnostic('CAPTURE_SUPABASE_REQUEST_FAILED', { errorName: error instanceof Error ? error.name : 'unknown' }); return json('error', withCode('The inquiry service could not be reached. Please try again or contact Harbourview directly.', 'CAPTURE_SUPABASE_REQUEST_FAILED'), 502); }
  if (!response.ok) { logCaptureDiagnostic('CAPTURE_SUPABASE_INSERT_FAILED', { status: response.status, statusText: response.statusText }); return json('error', withCode('The inquiry could not be saved. Please try again or contact Harbourview directly.', 'CAPTURE_SUPABASE_INSERT_FAILED'), 502); }

  await notifyMarketplaceInquiry({ ...payload, id: null, created_at: new Date().toISOString(), priority: 'medium' }).catch((error) => { console.info('harbourview_marketplace_notification_failed', { errorName: error instanceof Error ? error.name : 'unknown' }); });
  logCaptureDiagnostic('CAPTURE_OK', { inquiryType });
  return json('success', successMessage);
}
