import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Retained for local/Node `npm run build` parity; Cloudflare/OpenNext deployment still uses its own runtime packaging path.
  output: 'standalone',
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
