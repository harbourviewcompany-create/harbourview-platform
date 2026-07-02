import type { NextConfig } from 'next'

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
}

export default nextConfig
