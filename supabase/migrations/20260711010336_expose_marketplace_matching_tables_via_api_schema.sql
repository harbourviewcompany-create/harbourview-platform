-- Restore the exact production-owned body for migration 20260711010336.
-- The previous local reconciliation stub omitted the API views that the later
-- security-invoker hardening migration expects to exist.

-- buyer_requests: column-restricted, omits contact_name/contact_email/contact_phone/legal_entity/internal_notes/archived_at
-- (RLS gates rows by status='approved' but not columns; those fields stay service_role/direct-SQL only)
create view api.buyer_requests as
select
  id,
  category,
  title,
  description,
  product_type,
  region,
  price_range,
  buyer_type,
  requirements,
  status,
  created_at,
  updated_at
from public.buyer_requests;

grant select, insert on api.buyer_requests to anon, authenticated;
grant select on api.buyer_requests to service_role;

-- marketplace_item_images: public-safe subset, omits reviewed_by/rejection_reason (internal review detail)
create view api.marketplace_item_images as
select
  id,
  listing_id,
  candidate_id,
  uploader_user_id,
  storage_path,
  public_url,
  mime_type,
  file_size_bytes,
  review_status,
  alt_text,
  display_order,
  is_primary,
  created_at,
  updated_at
from public.marketplace_item_images;

grant select on api.marketplace_item_images to anon, authenticated, service_role;

-- matches: already admin/operator-only via RLS, full passthrough is fine
create view api.matches as
select
  id,
  listing_id,
  buyer_request_id,
  inquiry_id,
  status,
  internal_notes,
  proposed_at,
  introduced_at,
  closed_at,
  created_at,
  updated_at,
  match_rationale,
  match_rationale_model,
  match_rationale_generated_at
from public.matches;

grant select on api.matches to authenticated, service_role;
