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
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ''), anonKey };
}

export async function submitMarketplaceInquiry(
  _previousState: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  const listingSlug = readField(formData, 'listing_slug');
  const listing = marketplaceListings.find((item) => item.slug === listingSlug);

  if (!listing) {
    return { status: 'error', message: 'This listing is not available for public inquiry.' };
  }

  if (
    listing.availabilityStatus === 'sold_or_expired' ||
    listing.verificationStatus === 'sold_or_expired_source'
  ) {
    return { status: 'error', message: 'This listing is no longer available for public inquiry.' };
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
    return { status: 'error', message: 'Please complete name, email, company, country and message.' };
  }

  if (!isValidEmail(email)) {
    return { status: 'error', message: 'Please use a valid business email address.' };
  }

  if (
    isOversized(name) ||
    isOversized(email) ||
    isOversized(company) ||
    isOversized(country) ||
    isOversized(phone)
  ) {
    return { status: 'error', message: 'One or more fields is longer than allowed.' };
  }

  const messageWithListingContext = buildMessageWithListingContext(message, country, listing);

  if (messageWithListingContext.length > MAX_MESSAGE_LENGTH) {
    return { status: 'error', message: 'Please keep the message under 2,500 characters.' };
  }

  if (!consent) {
    return { status: 'error', message: 'Please confirm consent before submitting the inquiry.' };
  }

  const supabase = getSupabaseConfig();
  if (!supabase) {
    return {
      status: 'error',
      message: 'Inquiry capture is not configured yet. Please contact Harbourview directly.',
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
    return {
      status: 'error',
      message: 'The inquiry could not be saved. Please try again or contact Harbourview directly.',
    };
  }

  return {
    status: 'success',
    message: 'Inquiry received. Harbourview will review the request before any introduction or seller contact.',
  };
}
