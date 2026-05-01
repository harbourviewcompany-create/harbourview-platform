# Harbourview Marketplace Inquiry Capture

## Purpose

Marketplace inquiry capture replaces public `mailto:` CTAs with a controlled form on listing detail pages. The intent is to collect qualified buyer, seller-contact, quote-routing and sourcing-mandate requests before Harbourview makes any introduction.

## Public flow

1. A visitor opens a source-backed listing detail page.
2. The primary CTA anchors to the inline inquiry form.
3. The form submits through `app/actions/submitInquiry.ts`.
4. The action validates the listing slug against local marketplace fixtures, blocks sold or expired source leads, validates required fields, confirms consent and writes to `marketplace_inquiries` through Supabase REST.
5. The public user receives a success or public-safe failure message.

## Required environment variables

Production and preview Vercel environments need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for the isolated admin review scaffold

The service role key must remain server-only. Do not prefix it with `NEXT_PUBLIC_`.

## Supabase migrations

Apply the marketplace inquiry migrations before testing live submissions:

- `supabase/migrations/20260430_marketplace_inquiries.sql`
- `supabase/migrations/20260501_001_harden_marketplace_inquiries.sql`

The hardening migration enables RLS, grants public insert only, grants authenticated read/update and denies public select/update/delete through missing privileges and policies.

## Admin review scaffold

Admin inquiry review lives under:

- `/admin/inquiries`
- `/admin/inquiries/[id]`

This is intentionally isolated from public navigation and marked noindex. It uses the server-only service role key because the repository does not yet contain a finalized app role and admin-auth model.

Before production use, replace or wrap the scaffold with the final Harbourview admin authentication and role checks.

## Known risks before production use

- The current admin scaffold is route-isolated but not a complete authentication system.
- Authenticated Supabase access is broad until the final app-role model is introduced.
- Inquiry capture depends on Supabase environment variables and applied migrations.
- No automated test runner is currently configured, so verification is build plus manual checklist.
