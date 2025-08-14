/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**'
      }
    ],
    formats: ['image/avif', 'image/webp']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': false,
        '@sentry/profiling-node': false
      };
    }
    return config;
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://vision.googleapis.com https://api.stripe.com wss://localhost:* ws://localhost:*; frame-src https://js.stripe.com;"
          }
        ]
      }
    ];
  },
  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/generator',
        permanent: false
      }
    ];
  }
};

// Sentry configuration
const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true
};

module.exports = process.env.SENTRY_DSN ? withSentryConfig(nextConfig, sentryOptions) : nextConfig;