/**
 * Generated types placeholder.
 * Replace with: npx supabase gen types typescript --project-id <your-project-id> > lib/supabase/types.ts
 */
export type Database = {
  public: {
    Tables: {
      listings: { Row: ListingRow; Insert: ListingInsert; Update: Partial<ListingInsert> }
      buyer_requests: { Row: BuyerRequestRow; Insert: BuyerRequestInsert; Update: Partial<BuyerRequestInsert> }
      supplier_profiles: { Row: SupplierProfileRow; Insert: SupplierProfileInsert; Update: Partial<SupplierProfileInsert> }
      marketplace_inquiries: { Row: MarketplaceInquiryRow; Insert: MarketplaceInquiryInsert; Update: Partial<MarketplaceInquiryInsert> }
      matches: { Row: MatchRow; Insert: MatchInsert; Update: Partial<MatchInsert> }
      disclosure_requests: { Row: DisclosureRequestRow; Insert: DisclosureRequestInsert; Update: Partial<DisclosureRequestInsert> }
      disclosure_approvals: { Row: DisclosureApprovalRow; Insert: DisclosureApprovalInsert; Update: Partial<DisclosureApprovalInsert> }
      status_history: { Row: StatusHistoryRow; Insert: StatusHistoryInsert; Update: Partial<StatusHistoryInsert> }
      internal_admin_notes: { Row: InternalAdminNoteRow; Insert: InternalAdminNoteInsert; Update: Partial<InternalAdminNoteInsert> }
      audit_events: { Row: AuditEventRow; Insert: AuditEventInsert; Update: Partial<AuditEventInsert> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type ListingStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'superseded'

export type ListingCategory =
  | 'new-products'
  | 'used-surplus'
  | 'cannabis-inventory'
  | 'services'
  | 'business-opportunities'

export type BuyerRequestStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived'

export type MatchStatus =
  | 'proposed'
  | 'inquiry_received'
  | 'disclosure_requested'
  | 'disclosure_approved'
  | 'introduced'
  | 'closed_won'
  | 'closed_lost'

export type DisclosureStatus = 'requested' | 'approved' | 'declined'

export type EntityType =
  | 'listing'
  | 'buyer_request'
  | 'supplier_profile'
  | 'marketplace_inquiry'
  | 'match'
  | 'disclosure_request'
  | 'disclosure_approval'

export interface ListingRow {
  id: string
  created_at: string
  updated_at: string
  status: ListingStatus
  category: ListingCategory
  product_type: string
  region: string
  price_range: string | null
  specs_summary: string | null
  seller_type: string
  // Private fields — never exposed to public API
  legal_entity_name: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  private_notes: string | null
  internal_score: number | null
  archived_at: string | null
  superseded_by: string | null
}

export type ListingInsert = Omit<ListingRow, 'id' | 'created_at' | 'updated_at'>

export interface BuyerRequestRow {
  id: string
  created_at: string
  updated_at: string
  status: BuyerRequestStatus
  product_type: string
  region_interest: string
  quantity_range: string | null
  specs_requirements: string | null
  buyer_type: string
  // Private
  legal_entity_name: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  private_notes: string | null
  archived_at: string | null
}

export type BuyerRequestInsert = Omit<BuyerRequestRow, 'id' | 'created_at' | 'updated_at'>

export interface SupplierProfileRow {
  id: string
  created_at: string
  updated_at: string
  status: ListingStatus
  company_display_name: string | null
  region: string
  categories: ListingCategory[]
  certifications: string[] | null
  brief_description: string | null
  // Private
  legal_entity_name: string | null
  contact_name: string | null
  contact_email: string | null
  archived_at: string | null
}

export type SupplierProfileInsert = Omit<SupplierProfileRow, 'id' | 'created_at' | 'updated_at'>

export interface MarketplaceInquiryRow {
  id: string
  created_at: string
  listing_id: string | null
  buyer_request_id: string | null
  inquirer_name: string
  inquirer_email: string
  inquirer_company: string | null
  inquirer_type: string
  message: string
  status: 'new' | 'reviewed' | 'actioned'
  ip_address: string | null
  user_agent: string | null
}

export type MarketplaceInquiryInsert = Omit<MarketplaceInquiryRow, 'id' | 'created_at'>

export interface MatchRow {
  id: string
  created_at: string
  updated_at: string
  listing_id: string | null
  buyer_request_id: string | null
  status: MatchStatus
  match_notes: string | null
  introduced_at: string | null
  closed_at: string | null
  closed_outcome: 'won' | 'lost' | null
}

export type MatchInsert = Omit<MatchRow, 'id' | 'created_at' | 'updated_at'>

export interface DisclosureRequestRow {
  id: string
  created_at: string
  match_id: string
  requested_by: string
  status: DisclosureStatus
  responded_at: string | null
  notes: string | null
}

export type DisclosureRequestInsert = Omit<DisclosureRequestRow, 'id' | 'created_at'>

export interface DisclosureApprovalRow {
  id: string
  created_at: string
  disclosure_request_id: string
  approved_by: string
  approved_at: string
  notes: string | null
}

export type DisclosureApprovalInsert = Omit<DisclosureApprovalRow, 'id' | 'created_at'>

export interface StatusHistoryRow {
  id: string
  created_at: string
  entity_type: EntityType
  entity_id: string
  from_status: string | null
  to_status: string
  changed_by: string
  reason: string | null
}

export type StatusHistoryInsert = Omit<StatusHistoryRow, 'id' | 'created_at'>

export interface InternalAdminNoteRow {
  id: string
  created_at: string
  entity_type: EntityType
  entity_id: string
  note: string
  created_by: string
}

export type InternalAdminNoteInsert = Omit<InternalAdminNoteRow, 'id' | 'created_at'>

export interface AuditEventRow {
  id: string
  created_at: string
  entity_type: EntityType
  entity_id: string
  action: string
  actor: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
}

export type AuditEventInsert = Omit<AuditEventRow, 'id' | 'created_at'>
