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
};

export default nextConfig;
