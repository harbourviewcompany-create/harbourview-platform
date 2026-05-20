import { NextResponse } from 'next/server';
import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification';
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_MESSAGE_LENGTH = 2500;
const MAX_TEXT_LENGTH = 220;
const ALLOWED_INQUIRY_TYPES = new Set([
  'listing_submission',
  'wanted_request_submission',
  'quote_routing',
  'quote_request',
  'listing_verification',
  'seller_contact',
  'similar_equipment',
  'sourcing_mandate',
]);

type CaptureDiagnosticCode =
  | 'CAPTURE_VALIDATION_REQUIRED_FIELDS'
  | 'CAPTURE_VALIDATION_EMAIL'
  | 'CAPTURE_VALIDATION_FIELD_LENGTH'
  | 'CAPTURE_VALIDATION_MESSAGE_LENGTH'
  | 'CAPTURE_VALIDATION_TYPE'
  | 'CAPTURE_CONFIG_MISSING'
  | 'CAPTURE_SUPABASE_REQUEST_FAILED'
  | 'CAPTURE_SUPABASE_INSERT_FAILED'
  | 'CAPTURE_OK';

function withCode(message: string, code: CaptureDiagnosticCode) {
  return `${message} [${code}]`;
}

function json(status: 'success' | 'error', message: string, httpStatus = 200) {
  return NextResponse.json(
    { status, message },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

function readField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readNullableField(body: Record<string, unknown>, key: string) {
  const value = readField(body, key);
  return value || null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isOversized(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.length > maxLength;
}

function getSupabaseConfig() {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!anonKey) return null;
  return { url: resolveLockedSupabaseUrl(), anonKey };
}

function logCaptureDiagnostic(code: CaptureDiagnosticCode, details?: Record<string, string | number | boolean | null>) {
  console.info('harbourview_marketplace_capture', {
    code,
    ...details,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json('error', withCode('Invalid marketplace capture payload.', 'CAPTURE_VALIDATION_REQUIRED_FIELDS'), 400);
  }

  const contactName = readField(body, 'contact_name');
  const contactEmail = readField(body, 'contact_email').toLowerCase();
  const contactCompany = readNullableField(body, 'contact_company');
  const contactPhone = readNullableField(body, 'contact_phone');
  const inquiryType = readField(body, 'inquiry_type');
  const message = readField(body, 'message');
  const successMessage = readField(body, 'success_message') || 'Marketplace inquiry received. Harbourview will review it before response or routing. [CAPTURE_OK]';

  if (!contactName || !contactEmail || !inquiryType || !message) {
    logCaptureDiagnostic('CAPTURE_VALIDATION_REQUIRED_FIELDS', {
      hasContactName: Boolean(contactName),
      hasContactEmail: Boolean(contactEmail),
      hasInquiryType: Boolean(inquiryType),
      hasMessage: Boolean(message),
    });
    return json('error', withCode('Please complete all required inquiry fields.', 'CAPTURE_VALIDATION_REQUIRED_FIELDS'), 400);
  }

  if (!isValidEmail(contactEmail)) {
    logCaptureDiagnostic('CAPTURE_VALIDATION_EMAIL');
    return json('error', withCode('Please use a valid business email address.', 'CAPTURE_VALIDATION_EMAIL'), 400);
  }

  if (!ALLOWED_INQUIRY_TYPES.has(inquiryType)) {
    logCaptureDiagnostic('CAPTURE_VALIDATION_TYPE', { inquiryType });
    return json('error', withCode('Please select a valid inquiry type.', 'CAPTURE_VALIDATION_TYPE'), 400);
  }

  if ([contactName, contactEmail, contactCompany || '', contactPhone || '', inquiryType].some((field) => isOversized(field))) {
    logCaptureDiagnostic('CAPTURE_VALIDATION_FIELD_LENGTH');
    return json('error', withCode('One or more fields is longer than allowed.', 'CAPTURE_VALIDATION_FIELD_LENGTH'), 400);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    logCaptureDiagnostic('CAPTURE_VALIDATION_MESSAGE_LENGTH', { messageLength: message.length });
    return json('error', withCode('Please keep the inquiry under 2,500 characters.', 'CAPTURE_VALIDATION_MESSAGE_LENGTH'), 400);
  }

  const supabase = getSupabaseConfig();
  if (!supabase) {
    logCaptureDiagnostic('CAPTURE_CONFIG_MISSING', {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    });
    return json('error', withCode('Inquiry capture is not configured yet. Please contact Harbourview directly.', 'CAPTURE_CONFIG_MISSING'), 500);
  }

  const payload = {
    listing_id: null,
    buyer_request_id: null,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_company: contactCompany,
    contact_phone: contactPhone,
    inquiry_type: inquiryType,
    message,
    status: 'received',
  };

  let response: Response;
  try {
    response = await fetch(`${supabase.url}/rest/v1/marketplace_inquiries`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: supabase.anonKey,
        Authorization: `Bearer ${supabase.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    logCaptureDiagnostic('CAPTURE_SUPABASE_REQUEST_FAILED', {
      errorName: error instanceof Error ? error.name : 'unknown',
    });
    return json('error', withCode('The inquiry service could not be reached. Please try again or contact Harbourview directly.', 'CAPTURE_SUPABASE_REQUEST_FAILED'), 502);
  }

  if (!response.ok) {
    logCaptureDiagnostic('CAPTURE_SUPABASE_INSERT_FAILED', {
      status: response.status,
      statusText: response.statusText,
    });
    return json('error', withCode('The inquiry could not be saved. Please try again or contact Harbourview directly.', 'CAPTURE_SUPABASE_INSERT_FAILED'), 502);
  }

  await notifyMarketplaceInquiry({
    ...payload,
    id: null,
    created_at: new Date().toISOString(),
    priority: 'medium',
  }).catch((error) => {
    console.info('harbourview_marketplace_notification_failed', {
      errorName: error instanceof Error ? error.name : 'unknown',
    });
  });

  logCaptureDiagnostic('CAPTURE_OK', { inquiryType });
  return json('success', successMessage);
}
