import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    authInterrupts: true,
  },
}

if (process.env.NODE_ENV === 'development' && process.env.CF_PAGES === '1') {
  void import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev())
}

export default nextConfig
