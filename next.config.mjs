/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Persistent cache → dramatically faster dev restarts & HMR
    turbopackFileSystemCacheForDev: true,
    // Opt-in for production builds
    // turbopackFileSystemCacheForBuild: true,
  },

  turbopack: {
    // Future-proof for custom loaders (e.g. SVGs if added)
    // rules: { ... }
  },
};

export default nextConfig;
