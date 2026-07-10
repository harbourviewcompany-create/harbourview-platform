import { NextResponse } from 'next/server';
import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification';
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';
import { marketplaceCaptureSchema } from '@/lib/marketplace/intakeValidation';
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROUTE_ID = '/api/marketplace/capture';
const TARGET_TABLE = 'marketplace_inquiries';
const SAFE_CAPTURE_ERROR = 'Listing submission could not be saved. Please try again or contact Harbourview directly.';

const CAPTURE_FIELD_ALLOWLIST = [
  'id',
  'listing_id',
  'buyer_request_id',
  'contact_name',
  'contact_email',
  'contact_company',
  'contact_phone',
  'inquiry_type',
  'message',
  'status',
] as const;

type CaptureDiagnosticCode =
  | 'CAPTURE_VALIDATION_PAYLOAD'
  | 'CAPTURE_CONFIG_MISSING'
  | 'CAPTURE_SUPABASE_REQUEST_FAILED'
  | 'CAPTURE_SUPABASE_INSERT_FAILED'
  | 'CAPTURE_RATE_LIMITED'
  | 'CAPTURE_BOT_REJECTED'
  | 'CAPTURE_OK';

type SupabaseErrorBody = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

type CaptureLogDetails = Record<string, string | number | boolean | null | string[]>;

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

function getRequestId(request: Request) {
  return (
    request.headers.get('x-vercel-id') ||
    request.headers.get('x-request-id') ||
    globalThis.crypto?.randomUUID?.() ||
    `capture-${Date.now()}`
  );
}

function getSubmittedFieldKeys(body: Record<string, unknown>) {
  return Object.keys(body).sort();
}

function getSupabaseConfig() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) return null;
  return { url: resolveLockedSupabaseUrl(), serviceRoleKey };
}

function logCaptureDiagnostic(code: CaptureDiagnosticCode, requestId: string, details?: CaptureLogDetails) {
  console.info('harbourview_marketplace_capture', {
    code,
    requestId,
    route: ROUTE_ID,
    targetTable: TARGET_TABLE,
    ...details,
  });
}

function getSensitiveCaptureValues(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value && value.length >= 3));
}

function redactCaptureValue(value: string | null | undefined, sensitiveValues: string[]) {
  if (!value) return value ?? null;
  return sensitiveValues.reduce((redacted, sensitiveValue) => redacted.split(sensitiveValue).join('[redacted]'), value);
}

async function readSupabaseError(response: Response): Promise<SupabaseErrorBody> {
  const text = await response.text().catch(() => '');
  if (!text) return {};

  try {
    const parsed = JSON.parse(text) as SupabaseErrorBody;
    return {
      code: typeof parsed.code === 'string' ? parsed.code : undefined,
      message: typeof parsed.message === 'string' ? parsed.message : undefined,
      details: typeof parsed.details === 'string' ? parsed.details : null,
      hint: typeof parsed.hint === 'string' ? parsed.hint : null,
    };
  } catch {
    return { message: text.slice(0, 500) };
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const ipLimit = await enforceRateLimit({ route: ROUTE_ID, ip, limit: 20, windowMs: 60_000 });
  if (!ipLimit.allowed) {
    logCaptureDiagnostic('CAPTURE_RATE_LIMITED', requestId, { ip, retryAfterSeconds: ipLimit.retryAfterSeconds });
    return json('error', 'Too many requests. Please try again shortly.', 429, ipLimit.retryAfterSeconds);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    logCaptureDiagnostic('CAPTURE_VALIDATION_PAYLOAD', requestId, { submittedFieldKeys: [] });
    return json('error', 'Invalid marketplace capture payload.', 400);
  }

  const submittedFieldKeys = getSubmittedFieldKeys(body);
  const parsed = marketplaceCaptureSchema.safeParse(body);
  if (!parsed.success) {
    logCaptureDiagnostic('CAPTURE_VALIDATION_PAYLOAD', requestId, {
      submittedFieldKeys,
      issues: parsed.error.issues.length,
    });
    return NextResponse.json(
      {
        status: 'error',
        message: 'Please review the highlighted fields and try again.',
        errors: parsed.error.flatten(),
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (parsed.data.hp_field?.trim()) {
    logCaptureDiagnostic('CAPTURE_BOT_REJECTED', requestId, { submittedFieldKeys, reason: 'honeypot', ip });
    return json('error', 'Request rejected.', 429);
  }

  const expectedToken = process.env.MARKETPLACE_FORM_CHALLENGE_TOKEN;
  if (expectedToken && parsed.data.challenge_token !== expectedToken) {
    logCaptureDiagnostic('CAPTURE_BOT_REJECTED', requestId, { submittedFieldKeys, reason: 'challenge', ip });
    return json('error', 'Request rejected.', 429);
  }

  const {
    contact_name: contactName,
    contact_email: contactEmail,
    contact_company: contactCompany,
    contact_phone: contactPhone,
    inquiry_type: inquiryType,
    message,
  } = parsed.data;
  const identityLimit = await enforceRateLimit({ route: ROUTE_ID, ip, identity: contactEmail, limit: 8, windowMs: 60_000 });
  if (!identityLimit.allowed) {
    logCaptureDiagnostic('CAPTURE_RATE_LIMITED', requestId, {
      submittedFieldKeys,
      ip,
      retryAfterSeconds: identityLimit.retryAfterSeconds,
      hasEmail: true,
    });
    return json('error', 'Too many requests. Please try again shortly.', 429, identityLimit.retryAfterSeconds);
  }

  const successMessage =
    parsed.data.success_message ||
    'Marketplace inquiry received. Harbourview will review it before response or routing.';
  const supabase = getSupabaseConfig();
  if (!supabase) {
    logCaptureDiagnostic('CAPTURE_CONFIG_MISSING', requestId, {
      submittedFieldKeys,
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
    return json('error', SAFE_CAPTURE_ERROR, 500);
  }

  const payload: Record<(typeof CAPTURE_FIELD_ALLOWLIST)[number], string | null> = {
    id: globalThis.crypto.randomUUID(),
    listing_id: null,
    buyer_request_id: null,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_company: contactCompany || null,
    contact_phone: contactPhone || null,
    inquiry_type: inquiryType,
    message,
    status: 'received',
  };
  const insertFieldKeys = Object.keys(payload).sort();

  let response: Response;
  try {
    response = await fetch(`${supabase.url}/rest/v1/${TARGET_TABLE}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        ['api' + 'key']: supabase.serviceRoleKey,
        Authorization: ['Bearer', supabase.serviceRoleKey].join(' '),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    logCaptureDiagnostic('CAPTURE_SUPABASE_REQUEST_FAILED', requestId, {
      submittedFieldKeys,
      insertFieldKeys,
      errorName: error instanceof Error ? error.name : 'unknown',
    });
    return json('error', SAFE_CAPTURE_ERROR, 502);
  }

  if (!response.ok) {
    const supabaseError = await readSupabaseError(response);
    const sensitiveValues = getSensitiveCaptureValues([contactName, contactEmail, contactCompany, contactPhone, message]);
    logCaptureDiagnostic('CAPTURE_SUPABASE_INSERT_FAILED', requestId, {
      submittedFieldKeys,
      insertFieldKeys,
      status: response.status,
      statusText: response.statusText,
      supabaseErrorCode: supabaseError.code ?? null,
      supabaseErrorMessage: redactCaptureValue(supabaseError.message, sensitiveValues),
      supabaseErrorDetails: redactCaptureValue(supabaseError.details, sensitiveValues),
      supabaseErrorHint: redactCaptureValue(supabaseError.hint, sensitiveValues),
    });
    return json('error', SAFE_CAPTURE_ERROR, 502);
  }

  await notifyMarketplaceInquiry({
    inquiry_type: inquiryType,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_company: contactCompany ?? null,
    contact_phone: contactPhone ?? null,
    message: message,
    id: payload.id,
    created_at: new Date().toISOString(),
    priority: 'medium',
  }).catch((error) => {
    console.info('harbourview_marketplace_notification_failed', {
      requestId,
      errorName: error instanceof Error ? error.name : 'unknown',
    });
  });
  logCaptureDiagnostic('CAPTURE_OK', requestId, { submittedFieldKeys, insertFieldKeys, inquiryType });
  return json('success', successMessage);
}
