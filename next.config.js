/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@heygen/streaming-avatar'],
  webpack: (config, { isServer }) => {
    // Removed simplex-noise externalization as it's used in client-side components
    // that are already dynamically imported with ssr: false
    return config;
  }
}

module.exports = nextConfig