import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
