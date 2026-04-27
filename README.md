# Harbourview — Public Website V1

Premium, mobile-first public website for Harbourview.

---

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · React Hook Form + Zod · Resend · Vercel

---

## Install

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                   # http://localhost:3000
npm run build                 # production build
npm run lint                  # 0 errors expected
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | From resend.com. Required for email delivery. |
| `HARBOURVIEW_TO_EMAIL` | Yes | Submission destination. Default: harborviewcompany@gmail.com |
| `HARBOURVIEW_FROM_EMAIL` | Yes | Verified sender address in Resend (e.g. intake@harbourview.io) |
| `NEXT_PUBLIC_BOOKING_URL` | No | Cal.com or Calendly link. Leave blank to hide booking CTAs. |
| `NEXT_PUBLIC_SITE_URL` | No | For OG metadata. Default: https://harbourview.io |

Missing `RESEND_API_KEY` returns a clear 503 — no silent failures.

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

API routes in `app/api/` can be extended to write to a database or call the Harbourview platform. Form schemas in `lib/validation.ts` are extendable without breaking existing routes.
