'use server';

export type QuoteRequestActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const MAX_MESSAGE_LENGTH = 2500;
const MAX_TEXT_LENGTH = 180;

const VALID_BUYER_TYPES = new Set([
  'Licensed Producer / Operator',
  'Brand',
  'Distributor',
  'Retailer',
  'Startup / New Operator',
  'Other',
]);

const VALID_TIMELINES = new Set(['ASAP', 'Within 30 days', '30-90 days', 'Future planning']);

type QuoteDiagnosticCode =
  | 'QUOTE_VALIDATION_REQUIRED_FIELDS'
  | 'QUOTE_VALIDATION_EMAIL'
  | 'QUOTE_VALIDATION_FIELD_LENGTH'
  | 'QUOTE_VALIDATION_MESSAGE_LENGTH'
  | 'QUOTE_VALIDATION_BUYER_TYPE'
  | 'QUOTE_VALIDATION_TIMELINE'
  | 'QUOTE_CONFIG_MISSING'
  | 'QUOTE_SUPABASE_INSERT_FAILED'
  | 'QUOTE_OK';

function withCode(message: string, code: QuoteDiagnosticCode) {
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

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ''), anonKey };
}

function logQuoteDiagnostic(code: QuoteDiagnosticCode, details?: Record<string, string | number | boolean | null>) {
  console.info('harbourview_marketplace_quote_request', {
    code,
    ...details,
  });
}

function buildQuoteMessage(fields: {
  listingTitle: string;
  buyerType: string;
  targetMarket: string;
  volume: string;
  timeline: string;
  budget: string;
  supplierPreference: string;
  requirements: string;
}) {
  return [
    'Harbourview quote request',
    '',
    `Listing: ${fields.listingTitle || 'N/A'}`,
    `Buyer type: ${fields.buyerType}`,
    `Target market / jurisdiction: ${fields.targetMarket}`,
    `Volume / order size: ${fields.volume}`,
    `Timeline: ${fields.timeline}`,
    `Budget / price target: ${fields.budget || 'N/A'}`,
    `Supplier preference: ${fields.supplierPreference || 'N/A'}`,
    '',
    'Requirements:',
    fields.requirements || 'N/A',
    '',
    'Harbourview action requested:',
    'Review buyer fit, verify supplier/source availability, and advise on quote or introduction path.',
  ].join('\n');
}

export async function submitQuoteRequest(
  _previousState: QuoteRequestActionState,
  formData: FormData,
): Promise<QuoteRequestActionState> {
  const listingTitle = readField(formData, 'listingTitle');
  const name = readField(formData, 'name');
  const email = readField(formData, 'email').toLowerCase();
  const phone = readField(formData, 'phone');
  const company = readField(formData, 'company');
  const buyerType = readField(formData, 'buyerType');
  const targetMarket = readField(formData, 'targetMarket');
  const volume = readField(formData, 'volume');
  const timeline = readField(formData, 'timeline');
  const budget = readField(formData, 'budget');
  const supplierPreference = readField(formData, 'supplierPreference');
  const requirements = readField(formData, 'requirements');

  if (!name || !email || !company || !buyerType || !targetMarket || !volume || !timeline) {
    logQuoteDiagnostic('QUOTE_VALIDATION_REQUIRED_FIELDS', {
      hasName: Boolean(name),
      hasEmail: Boolean(email),
      hasCompany: Boolean(company),
      hasBuyerType: Boolean(buyerType),
      hasTargetMarket: Boolean(targetMarket),
      hasVolume: Boolean(volume),
      hasTimeline: Boolean(timeline),
    });
    return {
      status: 'error',
      message: withCode('Please complete all required quote request fields.', 'QUOTE_VALIDATION_REQUIRED_FIELDS'),
    };
  }

  if (!isValidEmail(email)) {
    logQuoteDiagnostic('QUOTE_VALIDATION_EMAIL');
    return {
      status: 'error',
      message: withCode('Please use a valid business email address.', 'QUOTE_VALIDATION_EMAIL'),
    };
  }

  if (!VALID_BUYER_TYPES.has(buyerType)) {
    logQuoteDiagnostic('QUOTE_VALIDATION_BUYER_TYPE');
    return {
      status: 'error',
      message: withCode('Please select a valid buyer type.', 'QUOTE_VALIDATION_BUYER_TYPE'),
    };
  }

  if (!VALID_TIMELINES.has(timeline)) {
    logQuoteDiagnostic('QUOTE_VALIDATION_TIMELINE');
    return {
      status: 'error',
      message: withCode('Please select a valid timeline.', 'QUOTE_VALIDATION_TIMELINE'),
    };
  }

  const textFields = [
    listingTitle,
    name,
    email,
    phone,
    company,
    buyerType,
    targetMarket,
    volume,
    timeline,
    budget,
    supplierPreference,
  ];

  if (textFields.some((field) => isOversized(field))) {
    logQuoteDiagnostic('QUOTE_VALIDATION_FIELD_LENGTH');
    return {
      status: 'error',
      message: withCode('One or more fields is longer than allowed.', 'QUOTE_VALIDATION_FIELD_LENGTH'),
    };
  }

  const message = buildQuoteMessage({
    listingTitle,
    buyerType,
    targetMarket,
    volume,
    timeline,
    budget,
    supplierPreference,
    requirements,
  });

  if (message.length > MAX_MESSAGE_LENGTH) {
    logQuoteDiagnostic('QUOTE_VALIDATION_MESSAGE_LENGTH', { messageLength: message.length });
    return {
      status: 'error',
      message: withCode('Please keep the quote request under 2,500 characters.', 'QUOTE_VALIDATION_MESSAGE_LENGTH'),
    };
  }

  const supabase = getSupabaseConfig();
  if (!supabase) {
    logQuoteDiagnostic('QUOTE_CONFIG_MISSING', {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    });
    return {
      status: 'error',
      message: withCode('Quote capture is not configured yet. Please contact Harbourview directly.', 'QUOTE_CONFIG_MISSING'),
    };
  }

  const payload = {
    listing_id: null,
    buyer_request_id: null,
    contact_name: name,
    contact_email: email,
    contact_company: company,
    contact_phone: phone || null,
    inquiry_type: 'quote_routing',
    message,
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
    logQuoteDiagnostic('QUOTE_SUPABASE_INSERT_FAILED', {
      status: response.status,
      statusText: response.statusText,
    });
    return {
      status: 'error',
      message: withCode('The quote request could not be saved. Please try again or contact Harbourview directly.', 'QUOTE_SUPABASE_INSERT_FAILED'),
    };
  }

  logQuoteDiagnostic('QUOTE_OK', {
    inquiryType: 'quote_routing',
    hasListingTitle: Boolean(listingTitle),
  });

  return {
    status: 'success',
    message: withCode('Quote request received. Harbourview will review the request before supplier introduction or quote routing.', 'QUOTE_OK'),
  };
}
