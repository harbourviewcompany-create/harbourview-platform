'use server';

import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification';
import { FIELD_CLASSIFICATION_MATRIX, getMaxMessageLength, hasOversizedFields, hasSpamTrapValue, readField, validateFieldAgainstPolicy } from '@/lib/marketplace/intakeSafety';
import { postMarketplaceInquiry } from '@/lib/marketplace/inquirySubmission';

export type InquiryActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const ALLOWED_INQUIRY_TYPES = new Set([
  'listing_verification',
  'seller_contact',
  'quote_routing',
  'similar_equipment',
  'sourcing_mandate',
]);

type InquiryDiagnosticCode =
  | 'INQUIRY_VALIDATION_REQUIRED_FIELDS'
  | 'INQUIRY_VALIDATION_EMAIL'
  | 'INQUIRY_VALIDATION_FIELD_LENGTH'
  | 'INQUIRY_VALIDATION_MESSAGE_LENGTH'
  | 'INQUIRY_VALIDATION_CONSENT'
  | 'INQUIRY_VALIDATION_UNSAFE_CONTENT'
  | 'INQUIRY_VALIDATION_SPAM_TRAP'
  | 'INQUIRY_CONFIG_MISSING'
  | 'INQUIRY_SUPABASE_INSERT_FAILED'
  | 'INQUIRY_OK';

function withCode(message: string, code: InquiryDiagnosticCode) {
  return `${message} [${code}]`;
}


function buildMessageWithListingContext(
  message: string,
  country: string,
  listingSlug: string,
) {
  return [
    message,
    '',
    '--- Marketplace listing context ---',
    `Market: ${country}`,
    `Listing slug: ${listingSlug || 'not specified'}`,
  ].join('\n');
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
  const website = readField(formData, 'website');

  if (hasSpamTrapValue(website)) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_SPAM_TRAP');
    return { status: 'error', message: withCode('Inquiry could not be processed.', 'INQUIRY_VALIDATION_SPAM_TRAP') };
  }

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

  if (hasOversizedFields([name, email, company, country, phone])) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_FIELD_LENGTH');
    return {
      status: 'error',
      message: withCode('One or more fields is longer than allowed.', 'INQUIRY_VALIDATION_FIELD_LENGTH'),
    };
  }

  const emailValidation = validateFieldAgainstPolicy(email, FIELD_CLASSIFICATION_MATRIX.email);
  if (!emailValidation.valid) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_EMAIL');
    return {
      status: 'error',
      message: withCode('Please use a valid business email address.', 'INQUIRY_VALIDATION_EMAIL'),
    };
  }

  const phoneValidation = validateFieldAgainstPolicy(phone, FIELD_CLASSIFICATION_MATRIX.phone);
  if (!phoneValidation.valid) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_UNSAFE_CONTENT');
    return {
      status: 'error',
      message: withCode('Please use a valid phone number format.', 'INQUIRY_VALIDATION_UNSAFE_CONTENT'),
    };
  }

  const companyValidation = validateFieldAgainstPolicy(company, FIELD_CLASSIFICATION_MATRIX.company);
  const messageValidation = validateFieldAgainstPolicy(message, FIELD_CLASSIFICATION_MATRIX.message);

  if (!companyValidation.valid || !messageValidation.valid) {
    logInquiryDiagnostic('INQUIRY_VALIDATION_UNSAFE_CONTENT');
    return {
      status: 'error',
      message: withCode('Please remove links or markup and submit plain text.', 'INQUIRY_VALIDATION_UNSAFE_CONTENT'),
    };
  }

  const messageWithListingContext = buildMessageWithListingContext(message, country, listingSlug);

  if (messageWithListingContext.length > getMaxMessageLength()) {
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


  const payload = {
    listing_id: null,
    buyer_request_id: null,
    contact_name: name,
    contact_email: email,
    contact_company: company,
    contact_phone: phone || null,
    inquiry_type: inquiryType,
    message: messageWithListingContext,
    status: 'received' as const,
  };

  const submissionResult = await postMarketplaceInquiry(payload);

  if (!submissionResult.ok) {
    if (submissionResult.kind === 'config_missing') {
      logInquiryDiagnostic('INQUIRY_CONFIG_MISSING', submissionResult.context);
      return {
        status: 'error',
        message: withCode('Inquiry capture is not configured yet. Please contact Harbourview directly.', 'INQUIRY_CONFIG_MISSING'),
      };
    }

    logInquiryDiagnostic('INQUIRY_SUPABASE_INSERT_FAILED', submissionResult.context);
    return {
      status: 'error',
      message: withCode('The inquiry could not be saved. Please try again or contact Harbourview directly.', 'INQUIRY_SUPABASE_INSERT_FAILED'),
    };
  }

  await notifyMarketplaceInquiry({
    ...payload,
    id: null,
    created_at: new Date().toISOString(),
    priority: 'medium',
  }).catch((error) => {
    console.info('harbourview_marketplace_inquiry_notification_failed', {
      errorName: error instanceof Error ? error.name : 'unknown',
    });
  });

  logInquiryDiagnostic('INQUIRY_OK', {
    listingSlug,
    inquiryType,
  });

  return {
    status: 'success',
    message: withCode('Inquiry received. Harbourview will review the request before any introduction or seller contact.', 'INQUIRY_OK'),
  };
}
