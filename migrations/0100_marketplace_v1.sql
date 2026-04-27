-- ============================================================
-- HARBOURVIEW MARKETPLACE v1 — MIGRATION 0100
-- Target: zvxdgdkukjrrwamdpqrg
-- Status: DRAFT — requires THC security review before apply
-- ============================================================

-- ── ENUMS ───────────────────────────────────────────────────

CREATE TYPE marketplace_section AS ENUM (
  'new_products',
  'used_surplus',
  'cannabis_inventory',
  'wanted_requests',
  'services',
  'business_opportunities',
  'supplier_directory'
);

CREATE TYPE marketplace_review_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'archived'
);

CREATE TYPE marketplace_contact_visibility AS ENUM (
  'hidden',
  'on_inquiry',
  'public'
);

CREATE TYPE marketplace_verification_status AS ENUM (
  'unverified',
  'pending_review',
  'verified',
  'suspended'
);

CREATE TYPE marketplace_inquiry_status AS ENUM (
  'pending',
  'read',
  'responded',
  'closed'
);

-- ── TABLES ──────────────────────────────────────────────────

CREATE TABLE marketplace_listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  section             marketplace_section NOT NULL,
  title               text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  slug                text NOT NULL UNIQUE,
  description         text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  price_amount        numeric(12,2),
  price_currency      text DEFAULT 'USD' CHECK (char_length(price_currency) = 3),
  location_country    text CHECK (char_length(location_country) = 2),
  review_status       marketplace_review_status NOT NULL DEFAULT 'pending',
  public_visibility   boolean NOT NULL DEFAULT false,
  contact_visibility  marketplace_contact_visibility NOT NULL DEFAULT 'on_inquiry',
  is_featured         boolean NOT NULL DEFAULT false,
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_listing_metadata_private (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  lead_quality        text,
  estimated_deal_value numeric(14,2),
  monetization_path   text,
  admin_priority      smallint DEFAULT 0,
  internal_notes      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_inquiries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  workspace_id    uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  buyer_name      text NOT NULL CHECK (char_length(buyer_name) BETWEEN 1 AND 200),
  buyer_email     text NOT NULL CHECK (buyer_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  buyer_phone     text,
  buyer_company   text,
  message         text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 3000),
  status          marketplace_inquiry_status NOT NULL DEFAULT 'pending',
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_wanted_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  title             text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  description       text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 3000),
  category          text,
  budget_range      text,
  status            marketplace_review_status NOT NULL DEFAULT 'pending',
  public_visibility boolean NOT NULL DEFAULT false,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_suppliers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  company_name          text NOT NULL CHECK (char_length(company_name) BETWEEN 2 AND 200),
  slug                  text NOT NULL UNIQUE,
  description           text,
  verification_status   marketplace_verification_status NOT NULL DEFAULT 'unverified',
  is_featured           boolean NOT NULL DEFAULT false,
  status                marketplace_review_status NOT NULL DEFAULT 'pending',
  created_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_review_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL CHECK (entity_type IN ('marketplace_listings','marketplace_wanted_requests','marketplace_suppliers')),
  entity_id       uuid NOT NULL,
  submitted_by    uuid REFERENCES auth.users(id),
  assigned_to     uuid REFERENCES auth.users(id),
  decision        marketplace_review_status,
  reviewer_notes  text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_review','resolved')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- audit_events already exists in this repo — add marketplace actions only
-- If audit_events does not exist, create it:
CREATE TABLE IF NOT EXISTS audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  entity_type   text NOT NULL,
  entity_id     uuid NOT NULL,
  action        text NOT NULL,
  actor_id      uuid REFERENCES auth.users(id),
  payload       jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_marketplace_listings_section ON marketplace_listings(section);
CREATE INDEX idx_marketplace_listings_review_status ON marketplace_listings(review_status);
CREATE INDEX idx_marketplace_listings_public ON marketplace_listings(public_visibility, review_status);
CREATE INDEX idx_marketplace_listings_slug ON marketplace_listings(slug);
CREATE INDEX idx_marketplace_inquiries_listing ON marketplace_inquiries(listing_id);
CREATE INDEX idx_marketplace_wanted_requests_status ON marketplace_wanted_requests(status, public_visibility);
CREATE INDEX idx_marketplace_suppliers_verification ON marketplace_suppliers(verification_status, status);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);

-- ── UPDATED_AT TRIGGERS ─────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_marketplace_wanted_requests_updated_at
  BEFORE UPDATE ON marketplace_wanted_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_marketplace_suppliers_updated_at
  BEFORE UPDATE ON marketplace_suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_marketplace_review_queue_updated_at
  BEFORE UPDATE ON marketplace_review_queue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SLUG GENERATOR ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_marketplace_slug(title text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM marketplace_listings WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$;

-- ── SAFE PUBLIC VIEWS ────────────────────────────────────────
-- These views are the ONLY safe way for public/anon to read marketplace data.
-- They expose NO private fields.

CREATE OR REPLACE VIEW marketplace_listings_public_view AS
SELECT
  id,
  section,
  title,
  slug,
  description,
  price_amount,
  price_currency,
  location_country,
  is_featured,
  created_at
FROM marketplace_listings
WHERE review_status = 'approved'
  AND public_visibility = true;

CREATE OR REPLACE VIEW marketplace_wanted_requests_public_view AS
SELECT
  id,
  title,
  description,
  category,
  budget_range,
  created_at
FROM marketplace_wanted_requests
WHERE status = 'approved'
  AND public_visibility = true;

CREATE OR REPLACE VIEW marketplace_suppliers_public_view AS
SELECT
  id,
  company_name,
  slug,
  description,
  is_featured,
  created_at
FROM marketplace_suppliers
WHERE verification_status = 'verified'
  AND status = 'approved';

-- ── RLS: ENABLE ──────────────────────────────────────────────

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listing_metadata_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_wanted_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- ── RLS: marketplace_listings ────────────────────────────────

-- Anon and authenticated: read own listings only (not approved public — use view)
CREATE POLICY "listings_select_own"
  ON marketplace_listings FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Admin: full read
CREATE POLICY "listings_select_admin"
  ON marketplace_listings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

-- Authenticated: insert own listings — review_status and public_visibility locked
CREATE POLICY "listings_insert_authenticated"
  ON marketplace_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND review_status = 'pending'
    AND public_visibility = false
  );

-- Admin: update any listing
CREATE POLICY "listings_update_admin"
  ON marketplace_listings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

-- Owner: update own listing while still pending
CREATE POLICY "listings_update_own_pending"
  ON marketplace_listings FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND review_status = 'pending'
  )
  WITH CHECK (
    review_status = 'pending'
    AND public_visibility = false
  );

-- No delete for any non-admin (admin handled via update to archived)

-- ── RLS: marketplace_listing_metadata_private ────────────────
-- Admin only — no anon, no authenticated member access

CREATE POLICY "private_meta_admin_all"
  ON marketplace_listing_metadata_private FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

-- ── RLS: marketplace_inquiries ───────────────────────────────

-- Owner sees own inquiries
CREATE POLICY "inquiries_select_own"
  ON marketplace_inquiries FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Admin sees all
CREATE POLICY "inquiries_select_admin"
  ON marketplace_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

-- Authenticated can submit inquiry (goes through API rate-limit layer)
CREATE POLICY "inquiries_insert_authenticated"
  ON marketplace_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'pending'
  );

-- ── RLS: marketplace_wanted_requests ─────────────────────────

CREATE POLICY "wanted_select_own"
  ON marketplace_wanted_requests FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "wanted_select_admin"
  ON marketplace_wanted_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

CREATE POLICY "wanted_insert_authenticated"
  ON marketplace_wanted_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'pending'
    AND public_visibility = false
  );

CREATE POLICY "wanted_update_admin"
  ON marketplace_wanted_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

-- ── RLS: marketplace_suppliers ───────────────────────────────

CREATE POLICY "suppliers_select_admin"
  ON marketplace_suppliers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

CREATE POLICY "suppliers_insert_authenticated"
  ON marketplace_suppliers FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND verification_status = 'unverified'
    AND status = 'pending'
  );

CREATE POLICY "suppliers_update_admin"
  ON marketplace_suppliers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

-- ── RLS: marketplace_review_queue ────────────────────────────

-- Admin only
CREATE POLICY "review_queue_admin_all"
  ON marketplace_review_queue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

-- ── RLS: audit_events ────────────────────────────────────────
-- Append-only. No UPDATE. No DELETE. Admin can INSERT and SELECT.

CREATE POLICY "audit_events_insert_admin"
  ON audit_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

CREATE POLICY "audit_events_select_admin"
  ON audit_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  );

-- NO UPDATE policy
-- NO DELETE policy

-- ── ROLLBACK ─────────────────────────────────────────────────
-- Run this block to undo this migration:
/*
DROP VIEW IF EXISTS marketplace_listings_public_view;
DROP VIEW IF EXISTS marketplace_wanted_requests_public_view;
DROP VIEW IF EXISTS marketplace_suppliers_public_view;
DROP TABLE IF EXISTS marketplace_review_queue CASCADE;
DROP TABLE IF EXISTS marketplace_listing_metadata_private CASCADE;
DROP TABLE IF EXISTS marketplace_inquiries CASCADE;
DROP TABLE IF EXISTS marketplace_wanted_requests CASCADE;
DROP TABLE IF EXISTS marketplace_suppliers CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TYPE IF EXISTS marketplace_section;
DROP TYPE IF EXISTS marketplace_review_status;
DROP TYPE IF EXISTS marketplace_contact_visibility;
DROP TYPE IF EXISTS marketplace_verification_status;
DROP TYPE IF EXISTS marketplace_inquiry_status;
*/

-- ── THC-001 FIX: Explicit GRANTs on safe views, REVOKEs on base tables ──────
-- anon may read ONLY through the safe public views, never base tables.

REVOKE ALL ON marketplace_listings FROM anon;
REVOKE ALL ON marketplace_listing_metadata_private FROM anon;
REVOKE ALL ON marketplace_inquiries FROM anon;
REVOKE ALL ON marketplace_wanted_requests FROM anon;
REVOKE ALL ON marketplace_suppliers FROM anon;
REVOKE ALL ON marketplace_review_queue FROM anon;
REVOKE ALL ON audit_events FROM anon;

GRANT SELECT ON marketplace_listings_public_view TO anon;
GRANT SELECT ON marketplace_wanted_requests_public_view TO anon;
GRANT SELECT ON marketplace_suppliers_public_view TO anon;

-- ── THC-002 FIX: Admin UPDATE WITH CHECK enforces state consistency ───────────
-- Drop and replace the admin update policy to add WITH CHECK.

DROP POLICY IF EXISTS "listings_update_admin" ON marketplace_listings;

CREATE POLICY "listings_update_admin"
  ON marketplace_listings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role = 'admin'
    )
    -- Enforce: public_visibility = true is only valid when review_status = 'approved'
    AND (
      public_visibility = false
      OR review_status = 'approved'
    )
  );
