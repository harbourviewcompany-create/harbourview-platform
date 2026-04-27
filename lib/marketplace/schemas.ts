// ============================================================
// HARBOURVIEW MARKETPLACE v1 — ZOD SCHEMAS
// All public submission routes validate against these.
// ============================================================
import { z } from 'zod';

const MARKETPLACE_SECTIONS = [
  'new_products',
  'used_surplus',
  'cannabis_inventory',
  'wanted_requests',
  'services',
  'business_opportunities',
  'supplier_directory',
] as const;

export const ListingSubmissionSchema = z.object({
  section: z.enum(MARKETPLACE_SECTIONS),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  price_amount: z.number().positive().optional(),
  price_currency: z.string().length(3).optional(),
  location_country: z.string().length(2).optional(),
  // These fields are explicitly rejected if provided by public user
  review_status: z.undefined({ message: 'review_status cannot be set on submission' }).optional(),
  public_visibility: z.undefined({ message: 'public_visibility cannot be set on submission' }).optional(),
}).strict();

export const InquirySubmissionSchema = z.object({
  listing_id: z.string().uuid(),
  buyer_name: z.string().min(1).max(200),
  buyer_email: z.string().email(),
  buyer_phone: z.string().max(50).optional(),
  buyer_company: z.string().max(200).optional(),
  message: z.string().min(10).max(3000),
});

export const WantedRequestSubmissionSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(3000),
  category: z.string().max(100).optional(),
  budget_range: z.string().max(100).optional(),
  review_status: z.undefined().optional(),
  public_visibility: z.undefined().optional(),
}).strict();

export const AdminListingUpdateSchema = z.object({
  review_status: z.enum(['pending', 'approved', 'rejected', 'archived']).optional(),
  is_featured: z.boolean().optional(),
}).strict();

export const AdminSupplierUpdateSchema = z.object({
  verification_status: z.enum(['unverified', 'pending_review', 'verified', 'suspended']).optional(),
  is_featured: z.boolean().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'archived']).optional(),
}).strict();

// ── Extended admin schemas (added by OT) ──────────────────────────────────

export const AdminWantedUpdateSchema = z.object({
  review_status: z.enum(['pending', 'approved', 'rejected', 'archived']).optional(),
  public_visibility: z.boolean().optional(),
}).strict();

export const AdminInquiryUpdateSchema = z.object({
  status: z.enum(['pending', 'read', 'responded', 'closed']).optional(),
  internal_note: z.string().max(2000).optional().nullable(),
}).strict();

export const AdminReviewQueueQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'archived']).optional(),
  entity_type: z.enum(['listing', 'wanted', 'supplier']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const ListingsQuerySchema = z.object({
  section: z.enum([
    'new_products', 'used_surplus', 'cannabis_inventory', 'wanted_requests',
    'services', 'business_opportunities', 'supplier_directory',
  ] as const).optional(),
  featured: z.enum(['true', 'false']).optional(),
  location: z.string().max(100).trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const SuppliersQuerySchema = z.object({
  verified: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AdminWantedUpdateInput = z.infer<typeof AdminWantedUpdateSchema>;
export type AdminInquiryUpdateInput = z.infer<typeof AdminInquiryUpdateSchema>;
export type AdminReviewQueueQueryInput = z.infer<typeof AdminReviewQueueQuerySchema>;
export type ListingsQueryInput = z.infer<typeof ListingsQuerySchema>;
export type SuppliersQueryInput = z.infer<typeof SuppliersQuerySchema>;
