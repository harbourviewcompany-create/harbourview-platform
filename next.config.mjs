import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Consolidated from the previously dead next.config.ts (2026-07-03): Next
  // 16.2.10 reads only this file when both next.config.mjs and
  // next.config.ts are present -- confirmed via a direct test (added an
  // unambiguous bogus key to next.config.ts, rebuilt, got zero validation
  // warning, proving that file was never being read). next.config.ts has
  // been removed. Do not recreate a .ts config alongside this file.

  reactStrictMode: true,

  experimental: {
    // Persistent cache → dramatically faster dev restarts & HMR
    turbopackFileSystemCacheForDev: true,
    // Opt-in for production builds
    // turbopackFileSystemCacheForBuild: true,

    // REQUIRED for unauthorized()/forbidden() from 'next/navigation', used
    // in lib/auth/require-auth.ts and lib/auth/adminGuard.ts. Without this,
    // Next.js throws E411/E488 immediately on call (confirmed by reading
    // node_modules/next/dist/client/components/{unauthorized,forbidden}.js
    // directly) -- not a silent bypass, but a broken generic error page
    // instead of the intended redirect/UI for any authenticated-but-wrong-role
    // user hitting an admin/tier-gated route.
    authInterrupts: true,
  },

  turbopack: {
    // Future-proof for custom loaders (e.g. SVGs if added)
    // rules: { ... }
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    remotePatterns: [
      // Supabase storage (project-locked) is the only remote image source.
      {
        protocol: 'https',
        hostname: 'zvxdgdkukjrrwamdpqrg.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24,
  },

  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  // Marketplace consolidation into Command Centre (/dashboard?page=marketplace).
  // Phase 1 (pilot): pure browse/category routes, covered by MKT_TABS +
  // VIEW_SECTIONS (app/dashboard/page.tsx). Phase 2: Submit/Quote/Deal Rooms/
  // My Listings, now covered by the marketplace panel's action sub-views
  // (components/dashboard/CommandCentre.tsx MKT_ACTION_TABS + DealRoomsPanel) —
  // reusing the same form/list components the standalone routes used
  // (DynamicMarketplaceIntakeForm, QuoteRequestForm, MyListingsClient), just
  // re-hosted inside the shell instead of on their own page. 308s so
  // bookmarks/SEO links land in the shell instead of 404ing.
  //
  // Deliberately NOT redirected — no in-shell equivalent exists yet:
  // /marketplace/consumables/[id] (dedicated request form),
  // /marketplace/listings/[slug] (individual listing detail),
  // /marketplace/genetics/[slug|request-access|submit-program].
  // /marketplace/deals/[id] specifically: deal room selection is now
  // client-side panel state, not a URL — a shared/bookmarked link to a
  // specific room can't be deep-linked into that state, so it lands on the
  // Deal Rooms list instead of erroring.
  async redirects() {
    return [
      { source: '/marketplace', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/sell', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/sell/consumables', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/quote', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/deals', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/deals/new', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/deals/:id', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/my-listings', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/listings', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/wanted', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/import-demand', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/export-ready', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/services', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/consumables', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/distressed-businesses', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/distressed-inventory', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/business-opportunities', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/qualified-access', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/cannabis-inventory', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/cultivation-equipment', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/processing-equipment', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/used-surplus', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/labs-testing', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/logistics', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/packaging', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/new-products', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/professional-services', destination: '/dashboard?page=marketplace', permanent: true },
      { source: '/marketplace/genetics', destination: '/dashboard?page=genetics', permanent: true },
    ];
  },
};

// Sentry: wraps the config to auto-instrument, upload source maps on build
// (when SENTRY_AUTH_TOKEN is present), and inject the tunnel route. No-ops
// harmlessly in environments without Sentry env vars configured.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps / print Sentry CLI output when an auth token is
  // actually configured — keeps local/dev builds silent and fast.
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Route browser → Sentry ingest traffic through our own domain to reduce
  // the chance of ad-blockers dropping error reports.
  tunnelRoute: '/monitoring',

  disableLogger: true,
  automaticVercelMonitors: true,
});
