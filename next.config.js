const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable static generation to prevent SSR issues
  experimental: {
    disableOptimizedLoading: true,
  },

  // Disable static optimization for problematic pages
  trailingSlash: true,
  generateEtags: false,
  poweredByHeader: false,

  // Fix file watching issues
  webpack: (config, { dev, isServer }) => {
    // Try to fix Watchpack issues with minimal configuration
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: ['**/node_modules/**'],
        aggregateTimeout: 300,
        poll: 1000,
      };
    }

    // Ensure proper handling of undefined paths
    if (config.resolve && config.resolve.alias) {
      // Remove any undefined aliases that might cause issues
      Object.keys(config.resolve.alias).forEach(key => {
        if (config.resolve.alias[key] === undefined) {
          delete config.resolve.alias[key];
        }
      });
    }

    return config;
  },

  // Disable static optimization to prevent router mounting issues
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
};

module.exports = withBundleAnalyzer(nextConfig);