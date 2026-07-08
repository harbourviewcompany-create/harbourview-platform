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

  // Marketplace pilot (Command Centre consolidation, phase 1): pure browse/
  // category routes are fully covered by the existing marketplace panel
  // inside Command Centre (components/dashboard/CommandCentre.tsx MKT_TABS +
  // the VIEW_SECTIONS category mapping in app/dashboard/page.tsx — same
  // source-of-truth mapping used here). 308s so bookmarks/SEO links land in
  // the shell instead of 404ing.
  //
  // Deliberately NOT redirected — no in-shell equivalent exists yet:
  // /marketplace/sell, /marketplace/sell/consumables, /marketplace/quote,
  // /marketplace/deals(/new|/[id]), /marketplace/my-listings,
  // /marketplace/consumables/[id] (dedicated request form),
  // /marketplace/listings/[slug] (individual listing detail),
  // /marketplace/genetics/[slug|request-access|submit-program].
  async redirects() {
    return [
      { source: '/marketplace', destination: '/dashboard?page=marketplace', permanent: true },
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

export default nextConfig;
