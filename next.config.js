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
  trailingSlash: true,
  generateEtags: false,
  poweredByHeader: false,

  // Explicitly use Pages Router (pages directory)
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Simplified webpack config with proper path handling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ensure proper path resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    return config;
  },

};

module.exports = nextConfig;