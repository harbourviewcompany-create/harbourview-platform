# Gate 7 Marketplace Inquiry Verification

## Build verification

Run before merge:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

Expected result: typecheck, lint and production build complete without errors.

## Public inquiry checks

1. Open `/marketplace/listings`.
2. Open at least one listing detail page.
3. Confirm the primary CTA scrolls to the inline inquiry form.
4. Confirm the form includes listing slug and title context values, with only production inquiry columns sent to Supabase.
5. Submit with missing required fields and confirm a public-safe error.
6. Submit with invalid email and confirm a public-safe error.
7. Submit with message over 2,500 characters and confirm the client limit and server limit both prevent oversized payloads.
8. Submit without consent and confirm the form rejects it before any Supabase write.
9. Submit a valid inquiry and confirm a row is inserted in `marketplace_inquiries` using production columns:
   - `contact_name`
   - `contact_email`
   - `contact_company`
   - `contact_phone`
   - `inquiry_type`
   - `message`
   - `status = received`
   - `listing_id = null` unless a real Supabase listing ID exists
   - `buyer_request_id = null` unless a real buyer request ID exists
10. Confirm no internal review notes are rendered on public listing pages.

## RLS checks

Using anon credentials:

- Insert with required contact fields, valid email, message under 2,500 characters and `status = received` should succeed.
- Insert with missing contact name, invalid email, blank message, oversized message, non-`received` status or non-null `internal_notes` should fail.
- Select from `marketplace_inquiries` should fail.
- Update should fail.
- Delete should fail.

Using authenticated credentials:

- Select should fail until a finalized admin/reviewer role model is introduced.
- Update should fail until a finalized admin/reviewer role model is introduced.
- Delete should fail.
- Admin scaffold read/update behavior should be tested through the server-only service role key with `HARBOURVIEW_ADMIN_REVIEW_ENABLED=true` in a protected environment.

## Admin scaffold checks

1. Open `/admin/inquiries`.
2. Confirm the page is not linked from public navigation.
3. Confirm missing service-role environment variable or missing `HARBOURVIEW_ADMIN_REVIEW_ENABLED=true` shows a configuration warning and does not expose inquiry data.
4. Confirm inquiries are listed with created date, context label, inquiry type, company, phone, contact name, contact email, status and message preview.
5. Open `/admin/inquiries/[id]`.
6. Confirm the full inquiry detail renders.
7. Update status through each allowed lifecycle status:
   - received
   - reviewing
   - matched
   - closed
8. Confirm invalid statuses are rejected by the server action.

## Vercel checks

- Production and preview environments include `NEXT_PUBLIC_SUPABASE_URL`.
- Production and preview environments include `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server environment includes `SUPABASE_SERVICE_ROLE_KEY`.
- Server environment includes `HARBOURVIEW_ADMIN_REVIEW_ENABLED=true` only where admin routes are protected and intended for review use.
- Service role key is not exposed as a public variable.

## Merge standard

Do not merge until:

- Vercel preview is green.
- Supabase migrations have been reviewed.
- Public inquiry capture is verified.
- Admin scaffold limitations are understood.
