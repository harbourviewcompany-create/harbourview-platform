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

-- DELIBERATELY NOT RESTORED: api.marketplace_item_images.
--
-- The recorded body creates this view over columns
-- (listing_id, candidate_id, uploader_user_id, storage_path, mime_type,
-- display_order, is_primary) that describe the seventeen-column
-- public.marketplace_item_images living in production. That is not the table
-- this repository builds. 20260605000000_marketplace_image_trust_layer.sql
-- creates a different forty-column table of the same name, and
-- lib/marketplace/images/*.ts reads the trust-layer shape (item_id,
-- image_class, image_role, original_storage_path, edited_storage_path,
-- public_storage_bucket, adobe_edit_summary, content_credentials_status).
--
-- The trust-layer migration has never executed against production: its ledger
-- row carries an empty statement array, none of its marketplace_image_* enum
-- types exist there, and production's table has zero trust-layer columns.
-- Production is therefore behind this repository for this table, and the
-- recorded view body encodes the superseded pre-trust-layer shape.
--
-- Restoring it verbatim would fail replay (column "listing_id" does not
-- exist). Choosing a replacement column list instead is a public-exposure
-- decision governed by docs/HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md,
-- because the view is granted to anon. Left for an explicit decision rather
-- than guessed. 20260711160935 still expects this view to exist.

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
