/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@heygen/streaming-avatar'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('simplex-noise');
    }
    return config;
  }
}

module.exports = nextConfig