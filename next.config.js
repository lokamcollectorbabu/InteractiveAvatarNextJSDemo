/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@heygen/streaming-avatar'],
  webpack: (config, { isServer }) => {
    // Removed simplex-noise externalization as it's a client-side dependency
    // that should be handled by Next.js's normal bundling process
    return config;
  }
}

module.exports = nextConfig