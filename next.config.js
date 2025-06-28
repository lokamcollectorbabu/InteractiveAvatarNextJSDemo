/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@heygen/streaming-avatar'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize simplex-noise for server-side build to prevent import errors
      config.externals.push('simplex-noise');
    }
    return config;
  }
}

module.exports = nextConfig