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
