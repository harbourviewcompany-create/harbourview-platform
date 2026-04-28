# Harbourview — Public Website V1

Premium, mobile-first public website for Harbourview.

---

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · React Hook Form + Zod · Resend · Supabase · Vercel

---

## Install

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                   # http://localhost:3000
npm run build                 # production build
npm run lint                  # 0 errors expected
npm run typecheck             # 0 errors expected
npm run check                 # typecheck + lint + production build
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | From Resend. Required for email delivery. |
| `HARBOURVIEW_TO_EMAIL` | Yes | Submission destination. Default: harborviewcompany@gmail.com |
| `HARBOURVIEW_FROM_EMAIL` | Yes | Verified sender address in Resend. Example: intake@harbourview.io |
| `NEXT_PUBLIC_BOOKING_URL` | No | Cal.com or Calendly link. Leave blank to hide booking CTAs. |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL. Default local value: http://localhost:3000 |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes for platform/database work | Canonical Supabase project URL: https://zvxdgkukjrrwamdpqrg.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes for Supabase client work | Public anon key from the locked Supabase project. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Service role key for trusted server tasks only. Never expose this in browser code. |

Missing `RESEND_API_KEY` returns a clear 503 — no silent failures.

---

## Supabase Project Lock

This repo is locked to Supabase project ref:

```txt
zvxdgkukjrrwamdpqrg
```

Use this project for all Harbourview platform/database work unless deliberately migrating. Do not point development or Vercel to a second Supabase project without updating this README and `.env.example` in the same change.

---

## Deploy to Vercel

1. Push to GitHub
2. Import at vercel.com/new
3. Add environment variables in Vercel dashboard
4. Deploy — Next.js auto-detected

---

## Configure Resend

1. Create account at resend.com
2. Verify your sending domain
3. Create API key → set `RESEND_API_KEY`
4. Set `HARBOURVIEW_FROM_EMAIL` to a verified address on that domain

---

## Add Booking Link

Set `NEXT_PUBLIC_BOOKING_URL` to a Cal.com or Calendly URL. Leave blank to hide all booking CTAs gracefully.

---

## Add Analytics

Edit `lib/analytics.ts`. Replace the stub with Plausible, PostHog, or Segment. Events are already wired throughout the site.

---

## OG Image

Place a 1200×630 PNG at `public/og/harbourview-og.png`.

---

## Future Platform Integration

API routes in `app/api/` can be extended to write to Supabase or call the Harbourview platform. Form schemas in `lib/validation.ts` are extendable without breaking existing routes.
