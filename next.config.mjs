import { withSentryConfig } from '@sentry/nextjs';
import { ACTIVE_COMMAND_CENTRE_REDIRECTS } from './config/command-centre-routes.mjs';

/** @type {import('next').NextConfig} */

const isVercelRuntime = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const allowLocalSupabase =
  process.env.GITHUB_ACTIONS === 'true' &&
  /^\d+$/.test(process.env.GITHUB_RUN_ID ?? '') &&
  process.env.CI === '1' &&
  process.env.HARBOURVIEW_LOCAL_TEST_BUILD === '1' &&
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://zvxdgdkukjrrwamdpqrg.supabase.co",
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
  reactStrictMode: true,

  experimental: {
    turbopackFileSystemCacheForDev: true,
    authInterrupts: true,
  },

  turbopack: {},

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    remotePatterns: [
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
      ...ACTIVE_COMMAND_CENTRE_REDIRECTS,
      { source: '/marketplace/submit-listing', destination: '/marketplace/sell', permanent: true },
      { source: '/marketplace/wanted-requests', destination: '/marketplace/wanted', permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: '/monitoring',
  disableLogger: true,
  automaticVercelMonitors: true,
});
