import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */

const isVercelRuntime = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const allowLocalSupabase =
  process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE === '1' &&
  !isVercelRuntime;
const supabaseConnectSources = [
  'https://zvxdgdkukjrrwamdpqrg.supabase.co',
  'wss://zvxdgdkukjrrwamdpqrg.supabase.co',
  ...(allowLocalSupabase
    ? ['http://127.0.0.1:54321', 'ws://127.0.0.1:54321', 'http://localhost:54321', 'ws://localhost:54321']
    : []),
];

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline + unsafe-eval for RSC streaming and hydration
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://zvxdgdkukjrrwamdpqrg.supabase.co",
      // Production stays project-locked. Explicit local test runs add only the
      // loopback Supabase endpoints needed for isolated authenticated evidence.
      `connect-src 'self' ${supabaseConnectSources.join(' ')} https://api.stripe.com https://vercel.live`,
      "font-src 'self'",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

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

  // Public marketplace surfaces stay on their own routes (HTTP 200).
  // Command Centre still hosts authenticated operator workflows at
  // /dashboard?page=marketplace. Do not permanently redirect public
  // browse/intake paths into the private shell — production verification
  // and SEO require public 200s.
  //
  // Authenticated-only flows (my-listings, deals) may still soft-redirect
  // from page components when session is required.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      // Legacy aliases only — no permanent funnel of public marketplace → dashboard
      { source: '/marketplace/submit-listing', destination: '/marketplace/sell', permanent: true },
      { source: '/marketplace/wanted-requests', destination: '/marketplace/wanted', permanent: true },
      { source: '/commercial-intelligence', destination: '/intelligence', permanent: true },
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
