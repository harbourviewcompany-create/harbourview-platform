-- Restored from production migration ledger on 2026-09-16.
alter view api.marketplace_public_listings_v1 set (security_invoker = false);
