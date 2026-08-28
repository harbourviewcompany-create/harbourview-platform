import { z } from 'zod'
import { MARKETPLACE_LISTING_TYPE_OPTIONS } from '@/lib/marketplace/listingTypeOptions'

const emailSchema = z.string().trim().toLowerCase().email('Please use a valid business email address.')
const shortText = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer.`)

export const captureInquiryTypeSchema = z.enum([
  'listing_submission',
  'wanted_request_submission',
  'quote_routing',
  'quote_request',
  'listing_verification',
  'seller_contact',
  'similar_equipment',
  'sourcing_mandate',
  'genetics_access_request',
  'genetics_program_submission',
  'contact_general',
  'clinical_education_request'])

const botFrictionFields = {
  hp_field: z.string().optional().default(''),
  challenge_token: z.string().optional().default(''),
}

export const marketplaceCaptureSchema = z.object({
  contact_name: shortText(220).min(1),
  contact_email: emailSchema,
  contact_company: shortText(220).nullable().optional(),
  contact_phone: shortText(220).nullable().optional(),
  inquiry_type: captureInquiryTypeSchema,
  message: z.string().trim().min(1).max(3500),
  success_message: z.string().trim().max(220).optional(),
  listing_id: z.string().uuid().nullable().optional(),
  listing_title: shortText(280).nullable().optional(),
  ...botFrictionFields,
})

export const listingSubmissionSchema = z.object({
  name: shortText(220).min(1),
  email: emailSchema,
  company: shortText(220).optional().default(''),
  listingType: z.enum(MARKETPLACE_LISTING_TYPE_OPTIONS),
  title: shortText(220).min(1),
  price: shortText(220).optional().default(''),
  location: shortText(220).optional().default(''),
  description: z.string().trim().min(1).max(2600),
  ...botFrictionFields,
})

export const quoteSubmissionSchema = z.object({
  listingTitle: shortText(180).optional().default(''),
  name: shortText(180).min(1),
  email: emailSchema,
  phone: shortText(180).optional().default(''),
  company: shortText(180).min(1),
  buyerType: z.enum(['Licensed Producer / Operator', 'Brand', 'Distributor', 'Retailer', 'Startup / New Operator', 'Other']),
  targetMarket: shortText(180).min(1),
  volume: shortText(180).min(1),
  timeline: z.enum(['ASAP', 'Within 30 days', '30-90 days', 'Future planning']),
  budget: shortText(180).optional().default(''),
  supplierPreference: shortText(180).optional().default(''),
  requirements: z.string().trim().max(1800).optional().default(''),
  ...botFrictionFields,
})

export type MarketplaceCaptureInput = z.infer<typeof marketplaceCaptureSchema>
export type ListingSubmissionInput = z.infer<typeof listingSubmissionSchema>
export type QuoteSubmissionInput = z.infer<typeof quoteSubmissionSchema>
