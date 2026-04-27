import { z } from 'zod'
import { SELLER_TYPES, BUYER_TYPES, REGIONS, PRICE_RANGES, LISTING_CATEGORY_SLUGS } from './categories'

// Zod 4 uses object-record enums; for const string arrays, refine() is cleaner.
const regionEnum = z.string().refine((v) => (REGIONS as readonly string[]).includes(v), { message: 'Invalid region' })
const priceRangeEnum = z.string().refine((v) => (PRICE_RANGES as readonly string[]).includes(v), { message: 'Invalid price range' })
const sellerTypeEnum = z.string().refine((v) => (SELLER_TYPES as readonly string[]).includes(v), { message: 'Invalid seller type' })
const buyerTypeEnum = z.string().refine((v) => (BUYER_TYPES as readonly string[]).includes(v), { message: 'Invalid buyer type' })
const categoryEnum = z.string().refine((v) => (LISTING_CATEGORY_SLUGS as readonly string[]).includes(v), { message: 'Invalid category' })

// ── Listing submission (public form) ─────────────────────────────────────────

export const listingSubmitSchema = z.object({
  category: categoryEnum,
  product_type: z.string().min(2, 'Product type is required').max(200),
  region: regionEnum,
  price_range: priceRangeEnum.optional().or(z.literal('')),
  specs_summary: z.string().max(1000).optional().or(z.literal('')),
  seller_type: sellerTypeEnum,
  // Private — stored but never returned to public API
  legal_entity_name: z.string().min(1, 'Legal entity name is required').max(300),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  contact_email: z.string().email('A valid email is required'),
  contact_phone: z.string().max(50).optional().or(z.literal('')),
  private_notes: z.string().max(2000).optional().or(z.literal('')),
  // Spam protection
  _hp: z.string().optional(),
  _ts: z.number().optional(),
})

// ── Buyer / wanted request (public form) ─────────────────────────────────────

export const buyerRequestSubmitSchema = z.object({
  product_type: z.string().min(2, 'Product type is required').max(200),
  region_interest: regionEnum,
  quantity_range: z.string().max(200).optional().or(z.literal('')),
  specs_requirements: z.string().max(1000).optional().or(z.literal('')),
  buyer_type: buyerTypeEnum,
  // Private
  legal_entity_name: z.string().min(1, 'Legal entity name is required').max(300),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  contact_email: z.string().email('A valid email is required'),
  contact_phone: z.string().max(50).optional().or(z.literal('')),
  private_notes: z.string().max(2000).optional().or(z.literal('')),
  _hp: z.string().optional(),
  _ts: z.number().optional(),
})

// ── Marketplace inquiry (public CTA) ─────────────────────────────────────────

export const inquirySubmitSchema = z.object({
  listing_id: z.string().uuid().optional(),
  buyer_request_id: z.string().uuid().optional(),
  inquirer_name: z.string().min(1, 'Name is required').max(200),
  inquirer_email: z.string().email('A valid email is required'),
  inquirer_company: z.string().max(300).optional().or(z.literal('')),
  inquirer_type: buyerTypeEnum,
  message: z.string().min(10, 'Please provide a brief message').max(3000),
  _hp: z.string().optional(),
  _ts: z.number().optional(),
})

// ── Admin status update schemas ───────────────────────────────────────────────

export const listingStatusUpdateSchema = z.object({
  status: z.union([
    z.literal('approved'),
    z.literal('rejected'),
    z.literal('archived'),
    z.literal('superseded'),
  ]),
  reason: z.string().max(500).optional().or(z.literal('')),
})

export const buyerRequestStatusUpdateSchema = z.object({
  status: z.union([z.literal('approved'), z.literal('rejected'), z.literal('archived')]),
  reason: z.string().max(500).optional().or(z.literal('')),
})

export const matchCreateSchema = z.object({
  listing_id: z.string().uuid().optional(),
  buyer_request_id: z.string().uuid().optional(),
  match_notes: z.string().max(2000).optional().or(z.literal('')),
})

export const matchStatusUpdateSchema = z.object({
  status: z.union([
    z.literal('proposed'),
    z.literal('inquiry_received'),
    z.literal('disclosure_requested'),
    z.literal('disclosure_approved'),
    z.literal('introduced'),
    z.literal('closed_won'),
    z.literal('closed_lost'),
  ]),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const disclosureRequestSchema = z.object({
  match_id: z.string().uuid(),
  requested_by: z.string().min(1).max(200),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const disclosureApprovalSchema = z.object({
  approved_by: z.string().min(1).max(200),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const adminNoteSchema = z.object({
  entity_type: z.union([
    z.literal('listing'),
    z.literal('buyer_request'),
    z.literal('supplier_profile'),
    z.literal('marketplace_inquiry'),
    z.literal('match'),
    z.literal('disclosure_request'),
    z.literal('disclosure_approval'),
  ]),
  entity_id: z.string().uuid(),
  note: z.string().min(1, 'Note cannot be empty').max(5000),
  created_by: z.string().min(1).max(200),
})

export type ListingSubmitData = z.infer<typeof listingSubmitSchema>
export type BuyerRequestSubmitData = z.infer<typeof buyerRequestSubmitSchema>
export type InquirySubmitData = z.infer<typeof inquirySubmitSchema>
export type ListingStatusUpdate = z.infer<typeof listingStatusUpdateSchema>
export type BuyerRequestStatusUpdate = z.infer<typeof buyerRequestStatusUpdateSchema>
export type MatchCreate = z.infer<typeof matchCreateSchema>
export type MatchStatusUpdate = z.infer<typeof matchStatusUpdateSchema>
export type DisclosureRequest = z.infer<typeof disclosureRequestSchema>
export type DisclosureApproval = z.infer<typeof disclosureApprovalSchema>
export type AdminNote = z.infer<typeof adminNoteSchema>
