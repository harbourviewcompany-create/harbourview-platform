import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options',      value: 'nosniff' },
  { key: 'X-Frame-Options',             value: 'DENY' },
  { key: 'X-DNS-Prefetch-Control',      value: 'on' },
  { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
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
      // Supabase REST/realtime, Stripe checkout, Vercel preview feedback
      "connect-src 'self' https://zvxdgdkukjrrwamdpqrg.supabase.co wss://zvxdgdkukjrrwamdpqrg.supabase.co https://api.stripe.com https://vercel.live",
      "font-src 'self'",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // eslint.ignoreDuringBuilds removed — Next.js 16 dropped this option from NextConfig.
  // ESLint runs as a separate CI step and no longer needs suppression here.
  reactStrictMode: true,
  experimental: {
    authInterrupts: true,
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
