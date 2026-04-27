// ============================================================
// HARBOURVIEW MARKETPLACE v1 — ADMIN TYPES
// CRITICAL: Never import this file from public client components.
// These types are server-side admin only.
// ============================================================

import type { PublicListing, PublicSupplier, MarketplaceReviewStatus } from './types';

export interface AdminListing extends PublicListing {
  workspace_id: string | null;
  review_status: MarketplaceReviewStatus;
  public_visibility: boolean;
  contact_visibility: string;
  created_by: string | null;
  updated_at: string;
}

export interface AdminListingWithMeta extends AdminListing {
  private_meta?: {
    lead_quality: string | null;
    estimated_deal_value: number | null;
    monetization_path: string | null;
    admin_priority: number;
    internal_notes: string | null;
  };
}

export interface AdminSupplier extends PublicSupplier {
  workspace_id: string | null;
  verification_status: string;
  status: string;
  created_by: string | null;
  updated_at: string;
}

export interface AdminReviewQueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  submitted_by: string | null;
  assigned_to: string | null;
  decision: MarketplaceReviewStatus | null;
  reviewer_notes: string | null;
  status: 'pending' | 'in_review' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  workspace_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

// Audit action constants
export const AUDIT_ACTIONS = {
  LISTING_SUBMITTED: 'listing_submitted',
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_ARCHIVED: 'listing_archived',
  LISTING_FEATURED: 'listing_featured',
  LISTING_UNFEATURED: 'listing_unfeatured',
  SUPPLIER_VERIFIED: 'supplier_verified',
  SUPPLIER_SUSPENDED: 'supplier_suspended',
  INQUIRY_RECEIVED: 'inquiry_received',
  WANTED_REQUEST_SUBMITTED: 'wanted_request_submitted',
  WANTED_REQUEST_APPROVED: 'wanted_request_approved',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// Admin update payload
export interface AdminListingUpdate {
  review_status?: MarketplaceReviewStatus;
  is_featured?: boolean;
}

export interface AdminSupplierUpdate {
  verification_status?: string;
  is_featured?: boolean;
  status?: MarketplaceReviewStatus;
}
