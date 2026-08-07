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

-- marketplace_item_images: NOT the recorded body, deliberately.
--
-- The recorded body selects listing_id, candidate_id, uploader_user_id,
-- storage_path, mime_type, display_order and is_primary, which describe the
-- seventeen-column public.marketplace_item_images living in production. That
-- is not the table this repository builds.
-- 20260605000000_marketplace_image_trust_layer.sql creates a different
-- forty-column table of the same name, and lib/marketplace/images/*.ts reads
-- that trust-layer shape.
--
-- The trust-layer migration has never executed against production: its ledger
-- row carries an empty statement array, none of its marketplace_image_* enum
-- types exist there, and production's table has zero trust-layer columns. The
-- repository is ahead of production here, so the recorded body encodes the
-- superseded pre-trust-layer shape and replaying it verbatim fails with
-- column "listing_id" does not exist.
--
-- The column list below is not invented: it is exactly
-- PUBLIC_MARKETPLACE_IMAGE_COLUMNS from lib/marketplace/images/dto.ts, the
-- repository's own public projection for this table, which that module keeps
-- deliberately separate from ADMIN_MARKETPLACE_IMAGE_COLUMNS. Nothing from the
-- admin set is exposed here: no original/edited/public storage bucket or path,
-- no source_name/source_url/source_reference, no adobe_edit_summary, no
-- content_credentials_*, no checksum, no rejection_reason, no reviewed_by,
-- no uploaded_by. created_at and updated_at are outside that public list and
-- are therefore also omitted.
--
-- Row visibility is unchanged: the trust layer's own "Public can read approved
-- public marketplace images" policy still gates anon to review_status =
-- 'APPROVED_PUBLIC' with rights_status <> 'UNKNOWN', image_class <>
-- 'ADMIN_PRIVATE_EVIDENCE' and public_url not null, and 20260711160935 sets
-- security_invoker on this view so that policy is enforced rather than
-- bypassed.
create view api.marketplace_item_images as
select
  id,
  item_id,
  image_class,
  image_role,
  source_type,
  public_url,
  thumbnail_url,
  hero_url,
  gallery_url,
  social_url,
  alt_text,
  caption,
  is_illustrative,
  review_status,
  rights_status
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
