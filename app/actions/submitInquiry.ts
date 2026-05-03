'use server';

import { marketplaceListings } from '@/lib/marketplace/listings';

export type InquiryActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const MAX_MESSAGE_LENGTH = 2500;
const MAX_TEXT_LENGTH = 180;
const ALLOWED_INQUIRY_TYPES = new Set([
  'listing_verification',
  'seller_contact',
  'quote_routing',
  'similar_equipment',
  'sourcing_mandate',
]);

type InquiryDiagnosticCode =
  | 'INQUIRY_LISTING_NOT_FOUND'
  | 'INQUIRY_LISTING_UNAVAILABLE'
  | 'INQUIRY_VALIDATION_REQUIRED_FIELDS'
  | 'INQUIRY_VALIDATION_EMAIL'
  | 'INQUIRY_VALIDATION_FIELD_LENGTH'
  | 'INQUIRY_VALIDATION_MESSAGE_LENGTH'
  | 'INQUIRY_VALIDATION_CONSENT'
  | 'INQUIRY_CONFIG_MISSING'
  | 'INQUIRY_SUPABASE_INSERT_FAILED'
  | 'INQUIRY_OK';

function withCode(message: string, code: InquiryDiagnosticCode) {
  return `${message} [${code}]`;
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isOversized(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.length > maxLength;
}

function buildMessageWithListingContext(
  message: string,
  country: string,
  listing: { title: string; slug: string; sourceName: string; sourceUrl: string },
) {
  return [
    message,
    '',
    '--- Marketplace listing context ---',
    `Market: ${country}`,
    `Listing: ${listing.title}`,
    `Slug: ${listing.slug}`,
    `Source: ${listing.sourceName}`,
    `Source URL: ${listing.sourceUrl}`,
  ].join('\n');
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ''), anonKey };
}

function logInquiryDiagnostic(code: InquiryDiagnosticCode, details?: Record<string, string | number | boolean | null>) {
  console.info('harbourview_marketplace_inquiry', {
    code,
    ...details,
  });
}

export async function submitMarketplaceInquiry(
  _previousState: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  const listingSlug = readField(formData, 'listing_slug');
  const listing = marketplaceListings.find((item) => item.slug === listingSlug);

  if (!listing) {
    logInquiryDiagnostic('INQUIRY_LISTING_NOT_FOUND', { hasListingSlug: Boolean(listingSlug) });
    return {
      status: 'error',
      message: withCode('This listing is not available for public inquiry.', 'INQUIRY_LISTING_NOT_FOUND'),
    };
  }

  if (
    listing.availabilityStatus === 'sold_or_expired' ||
    listing.verificationStatus === 'sold_or_expired_source'
  ) {
    logInquiryDiagnostic('INQUIRY_LISTING_UNAVAILABLE', { listingSlug: listing.slug });
    return {
      status: 'error',
      message: withCode('This listing is no longer available for public inquiry.', 'INQUIRY_LISTING_UNAVAILABLE'),
    };
  }

  const name = readField(formData, 'name');
  const email = readField(formData, 'email').toLowerCase();
  const company = readField(formData, 'company');
  const country = readField(formData, 'country');
  const phone = readField(formData, 'phone');
  const requestedInquiryType = readField(formData, 'inquiry_type') || 'listing_verification';
  const inquiryType = ALLOWED_INQUIRY_TYPES.has(requestedInquiryType)
    ? requestedInquiryType
    : 'listing_verification';
  const message = readField(formData, 'message');
  const consent = formData.get('consent') === 'on';

  if (!name || !email || !company || !country || !message) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_REQUIRED_FIELDS', {
      hasName: Boolean(name),
      hasEmail: Boolean(email),
      hasCompany: Boolean(company),
      hasCountry: Boolean(country),
      hasMessage: Boolean(message),
    });
    return {
      status: 'error',
      message: withCode('Please complete name, email, company, country and message.', 'INQUIRY_VALIDATION_REQUIRED_FIELDS'),
    };
  }

  if (!isValidEmail(email)) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_EMAIL');
    return {
      status: 'error',
      message: withCode('Please use a valid business email address.', 'INQUIRY_VALIDATION_EMAIL'),
    };
  }

  if (
    isOversized(name) ||
    isOversized(email) ||
    isOversized(company) ||
    isOversized(country) ||
    isOversized(phone)
  ) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_FIELD_LENGTH');
    return {
      status: 'error',
      message: withCode('One or more fields is longer than allowed.', 'INQUIRY_VALIDATION_FIELD_LENGTH'),
    };
  }

  const messageWithListingContext = buildMessageWithListingContext(message, country, listing);

  if (messageWithListingContext.length > MAX_MESSAGE_LENGTH) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_MESSAGE_LENGTH', {
      messageLength: messageWithListingContext.length,
    });
    return {
      status: 'error',
      message: withCode('Please keep the message under 2,500 characters.', 'INQUIRY_VALIDATION_MESSAGE_LENGTH'),
    };
  }

  if (!consent) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_CONSENT');
    return {
      status: 'error',
      message: withCode('Please confirm consent before submitting the inquiry.', 'INQUIRY_VALIDATION_CONSENT'),
    };
  }

  const supabase = getSupabaseConfig();
  if (!supabase) {
    logInquiryDiagnostic('INQUIRY_CONFIG_MISSING', {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    });
    return {
      status: 'error',
      message: withCode('Inquiry capture is not configured yet. Please contact Harbourview directly.', 'INQUIRY_CONFIG_MISSING'),
    };
  }

  const payload = {
    listing_id: null,
    buyer_request_id: null,
    contact_name: name,
    contact_email: email,
    contact_company: company,
    contact_phone: phone || null,
    inquiry_type: inquiryType,
    message: messageWithListingContext,
    status: 'received',
  };

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
    logInquiryDiagnostic('INQUIRY_SUPABASE_INSERT_FAILED', {
      status: response.status,
      statusText: response.statusText,
    });
    return {
      status: 'error',
      message: withCode('The inquiry could not be saved. Please try again or contact Harbourview directly.', 'INQUIRY_SUPABASE_INSERT_FAILED'),
    };
  }

  logInquiryDiagnostic('INQUIRY_OK', {
    listingSlug: listing.slug,
    inquiryType,
  });

  return {
    status: 'success',
    message: withCode('Inquiry received. Harbourview will review the request before any introduction or seller contact.', 'INQUIRY_OK'),
  };
}
