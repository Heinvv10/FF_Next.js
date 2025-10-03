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

  // Handle MUI CSS imports
  transpilePackages: ['@mui/x-data-grid', '@mui/material'],

  // Disable static generation to prevent SSR issues
  experimental: {
    disableOptimizedLoading: true,
  },

  // Disable static optimization for problematic pages
  // Note: trailingSlash true was causing API redirects, removing for now
  generateEtags: false,
  poweredByHeader: false,

  // Explicitly use Pages Router (pages directory)
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Bundle optimization and webpack config
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ensure proper path resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    // Bundle optimization
    if (!dev && !isServer) {
      // Enable chunk splitting for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Vendor chunk for common dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'async',
          },
          // Separate chunk for MUI components
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            priority: 20,
            chunks: 'async',
          },
          // Separate chunk for large components
          contractors: {
            test: /[\\/]src[\\/]components[\\/]contractor[\\/]/,
            name: 'contractors',
            priority: 15,
            chunks: 'async',
            minSize: 20000,
          },
        },
      };

      // Bundle analyzer setup
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-analysis.html',
          })
        );
      }
    }
    
    return config;
  },

};

module.exports = nextConfig;