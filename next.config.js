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

  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },

  // Disable static generation to prevent SSR issues
  experimental: {
    disableOptimizedLoading: true,
    // Enable optimized package imports
    optimizePackageImports: ['@tanstack/react-query', 'react-icons'],
    // Allow access from network IPs for local development
    allowedDevOrigins: ['http://192.168.1.150:3005', 'http://localhost:3005'],
  },

  // Security and performance headers
  generateEtags: false,
  poweredByHeader: false,
  compress: true, // Enable gzip compression

  // Cache headers to prevent stale JavaScript errors during active development
  async headers() {
    return [
      {
        // HTML pages - always revalidate (prevents stale JS references)
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '.*text/html.*',
          },
        ],
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
        ],
      },
      {
        // Static assets with hashes - cache for 1 year (safe because filename changes)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes - never cache
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // Proxy /poles to Poles Sync Module on port 3001
  async rewrites() {
    return [
      {
        source: '/poles',
        destination: 'http://localhost:3001/',
      },
      {
        source: '/poles/:path*',
        destination: 'http://localhost:3001/:path*',
      },
    ];
  },

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

    // Note: Using Next.js default chunk splitting for better dynamic import compatibility

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
};

module.exports = withBundleAnalyzer(nextConfig);