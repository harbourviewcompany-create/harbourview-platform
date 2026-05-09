import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    authInterrupts: true,
  },
  async redirects() {
    return [
      {
        source: '/marketplace/wanted-requests',
        destination: '/marketplace/wanted',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
