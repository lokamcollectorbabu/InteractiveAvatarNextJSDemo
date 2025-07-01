/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@heygen/streaming-avatar'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize simplex-noise for server-side build to prevent import errors
      config.externals.push('simplex-noise');
    }
    return config;
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Environment-specific configurations
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig