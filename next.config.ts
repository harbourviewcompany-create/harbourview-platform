import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // output: 'standalone' removed — conflicts with @opennextjs/cloudflare.
  // If a standalone Docker build is ever needed, set NEXT_STANDALONE=1 and
  // re-enable conditionally: output: process.env.NEXT_STANDALONE === '1' ? 'standalone' : undefined
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
