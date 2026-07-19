-- Phase C: network_review_items producers.
--
-- network_review_items had a fully-designed schema (object_type constrained to
-- country|category|listing|wanted_request|intelligence_brief, review_status
-- lifecycle, legal/compliance flags) but zero rows, zero triggers, zero
-- functions referencing it anywhere -- a review gate that nothing fed.
--
-- 'category' is intentionally NOT covered here: no backing content table was
-- found for it (checked information_schema for anything category-shaped;
-- 'category' only exists as an enum column on listings/buyer_requests, not
-- as a standalone content object). Left out rather than guessed at.
--
-- 'intelligence_brief' -> cc_jurisdiction_briefings. Note this table already
-- has its own `review_state` column and is actively fed (302 rows, updated
-- as recently as 2026-07-11) independent of this system. Per explicit
-- decision, this migration adds a SECOND, duplicate review record in
-- network_review_items for the same content. This is accepted duplication,
-- not an oversight -- flagging again here so it isn't mistaken for one later.
--
-- All four trigger functions are SECURITY DEFINER: network_review_items RLS
-- only grants admin/operator/service_role (policies: admin_operator_only,
-- service_role_all). A regular seller/buyer creating a listing or buyer
-- request is neither, so the insert would fail under RLS running as the
-- invoking role. SECURITY DEFINER bypasses that, matching the pattern
-- already established elsewhere in this codebase for admin-adjacent writes
-- triggered by non-admin actions.
--
-- claim_risk defaults to 'medium' (the network_review_items column default)
-- for all four types -- this is a coarse, uniform default, not a
-- risk-calibrated judgment per type. Per-type risk tuning is a follow-up,
-- not attempted here.
--
-- requires_legal_review / requires_compliance_review are set per object
-- type as a reasonable default, not a definitive policy:
--   listing, wanted_request -> requires_compliance_review = true (commercial claims)
--   country, intelligence_brief -> requires_legal_review = true (jurisdiction/regulatory claims)

-- ---------------------------------------------------------------------------
-- listings -> object_type = 'listing'
-- ---------------------------------------------------------------------------
create or replace function public.network_review_producer_listings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.network_review_items (
      object_type, source_ref, title_internal, title_public_draft,
      category_label, public_summary_draft, requires_compliance_review, created_by
    ) values (
      'listing', NEW.id::text, NEW.title, NEW.title,
      NEW.category::text, NEW.description, true, auth.uid()
    );
  exception when others then
    raise warning 'network_review_producer failed for %.%: %', TG_TABLE_NAME, NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_network_review_listings on public.listings;
create trigger trg_network_review_listings
  after insert on public.listings
  for each row execute function public.network_review_producer_listings();

-- ---------------------------------------------------------------------------
-- buyer_requests -> object_type = 'wanted_request'
-- ---------------------------------------------------------------------------
create or replace function public.network_review_producer_buyer_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.network_review_items (
      object_type, source_ref, title_internal, title_public_draft,
      category_label, public_summary_draft, requires_compliance_review, created_by
    ) values (
      'wanted_request', NEW.id::text, NEW.title, NEW.title,
      NEW.category::text, NEW.description, true, auth.uid()
    );
  exception when others then
    raise warning 'network_review_producer failed for %.%: %', TG_TABLE_NAME, NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_network_review_buyer_requests on public.buyer_requests;
create trigger trg_network_review_buyer_requests
  after insert on public.buyer_requests
  for each row execute function public.network_review_producer_buyer_requests();

-- ---------------------------------------------------------------------------
-- countries -> object_type = 'country'
-- Fires on new rows, and on meaningful edits to public_summary (not on every
-- column touch -- this table has ~30 status/tier columns updated frequently
-- by unrelated batch jobs; only public_summary changes represent a new
-- public-facing claim worth reviewing).
-- ---------------------------------------------------------------------------
create or replace function public.network_review_producer_countries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and NEW.public_summary is not distinct from OLD.public_summary then
    return NEW;
  end if;

  begin
    insert into public.network_review_items (
      object_type, source_ref, title_internal, title_public_draft,
      country_code, country_label, public_summary_draft, requires_legal_review, created_by
    ) values (
      'country', NEW.id::text, NEW.country_name, NEW.country_name,
      NEW.iso_alpha2, NEW.country_name, NEW.public_summary, true, auth.uid()
    );
  exception when others then
    raise warning 'network_review_producer failed for %.%: %', TG_TABLE_NAME, NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_network_review_countries on public.countries;
create trigger trg_network_review_countries
  after insert or update of public_summary on public.countries
  for each row execute function public.network_review_producer_countries();

-- ---------------------------------------------------------------------------
-- cc_jurisdiction_briefings -> object_type = 'intelligence_brief'
-- See top-of-file note: intentional duplication with this table's own
-- review_state column, per explicit decision.
-- ---------------------------------------------------------------------------
create or replace function public.network_review_producer_cc_briefings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and NEW.public_summary is not distinct from OLD.public_summary then
    return NEW;
  end if;

  begin
    insert into public.network_review_items (
      object_type, source_ref, title_internal, title_public_draft,
      country_code, category_label, public_summary_draft, requires_legal_review, created_by
    ) values (
      'intelligence_brief', NEW.id::text,
      'Briefing: ' || coalesce(NEW.jurisdiction_slug, NEW.id::text),
      'Briefing: ' || coalesce(NEW.jurisdiction_slug, NEW.id::text),
      NEW.country_iso2, NEW.jurisdiction_type, NEW.public_summary, true, auth.uid()
    );
  exception when others then
    raise warning 'network_review_producer failed for %.%: %', TG_TABLE_NAME, NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_network_review_cc_briefings on public.cc_jurisdiction_briefings;
create trigger trg_network_review_cc_briefings
  after insert or update of public_summary on public.cc_jurisdiction_briefings
  for each row execute function public.network_review_producer_cc_briefings();
