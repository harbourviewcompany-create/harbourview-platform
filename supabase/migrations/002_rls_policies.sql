-- ============================================================
-- Harbourview Marketplace — Migration 002
-- Row-Level Security policies
-- ============================================================

-- Enable RLS on all tables
alter table listings enable row level security;
alter table buyer_requests enable row level security;
alter table supplier_profiles enable row level security;
alter table marketplace_inquiries enable row level security;
alter table matches enable row level security;
alter table disclosure_requests enable row level security;
alter table disclosure_approvals enable row level security;
alter table status_history enable row level security;
alter table internal_admin_notes enable row level security;
alter table audit_events enable row level security;

-- ── Listings: public can only read approved, non-archived ─────────────────────

create policy "Public can read approved listings"
  on listings for select
  to anon
  using (status = 'approved');

-- Service role (admin) can do everything
create policy "Service role full access to listings"
  on listings for all
  to service_role
  using (true)
  with check (true);

-- Authenticated users (future self-serve portal) can insert
create policy "Authenticated can insert listings"
  on listings for insert
  to authenticated
  with check (true);

-- ── Buyer Requests: public can read approved ──────────────────────────────────

create policy "Public can read approved buyer_requests"
  on buyer_requests for select
  to anon
  using (status = 'approved');

create policy "Service role full access to buyer_requests"
  on buyer_requests for all
  to service_role
  using (true)
  with check (true);

create policy "Authenticated can insert buyer_requests"
  on buyer_requests for insert
  to authenticated
  with check (true);

-- ── Supplier Profiles: public can read approved ───────────────────────────────

create policy "Public can read approved supplier_profiles"
  on supplier_profiles for select
  to anon
  using (status = 'approved');

create policy "Service role full access to supplier_profiles"
  on supplier_profiles for all
  to service_role
  using (true)
  with check (true);

-- ── Inquiries: public can insert, cannot read ─────────────────────────────────

create policy "Public can insert inquiries"
  on marketplace_inquiries for insert
  to anon
  with check (true);

create policy "Service role full access to inquiries"
  on marketplace_inquiries for all
  to service_role
  using (true)
  with check (true);

-- ── Matches: admin only ───────────────────────────────────────────────────────

create policy "Service role full access to matches"
  on matches for all
  to service_role
  using (true)
  with check (true);

-- ── Disclosures: admin only ───────────────────────────────────────────────────

create policy "Service role full access to disclosure_requests"
  on disclosure_requests for all
  to service_role
  using (true)
  with check (true);

create policy "Service role full access to disclosure_approvals"
  on disclosure_approvals for all
  to service_role
  using (true)
  with check (true);

-- ── Internal tables: admin only ───────────────────────────────────────────────

create policy "Service role full access to status_history"
  on status_history for all
  to service_role
  using (true)
  with check (true);

create policy "Service role full access to internal_admin_notes"
  on internal_admin_notes for all
  to service_role
  using (true)
  with check (true);

create policy "Service role full access to audit_events"
  on audit_events for all
  to service_role
  using (true)
  with check (true);

-- ── No hard delete policy ─────────────────────────────────────────────────────
-- Hard DELETE is revoked; use archive/supersede lifecycle states instead.
-- Enforce by revoking DELETE from anon and authenticated roles.

revoke delete on listings from anon, authenticated;
revoke delete on buyer_requests from anon, authenticated;
revoke delete on supplier_profiles from anon, authenticated;
revoke delete on marketplace_inquiries from anon, authenticated;
revoke delete on matches from anon, authenticated;
revoke delete on disclosure_requests from anon, authenticated;
revoke delete on disclosure_approvals from anon, authenticated;

-- Note: status_history, internal_admin_notes, and audit_events are append-only.
revoke delete on status_history from anon, authenticated;
revoke delete on internal_admin_notes from anon, authenticated;
revoke delete on audit_events from anon, authenticated;
revoke update on status_history from anon, authenticated;
revoke update on internal_admin_notes from anon, authenticated;
revoke update on audit_events from anon, authenticated;
