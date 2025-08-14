/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'tensorflow'],
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ignore node_modules that shouldn't be bundled
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('canvas', 'jsdom');
    }

    // Handle TensorFlow.js
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tensorflow/tfjs-node$': '@tensorflow/tfjs-node/dist/index.js',
    };

    // Add rule for CSV files
    config.module.rules.push({
      test: /\.csv$/,
      loader: 'file-loader',
      options: {
        publicPath: '/_next/static/files/',
        outputPath: 'static/files/',
      },
    });

    return config;
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
  },
  async headers() {
    return [
      {
        source: '/api/track/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/api/test-delivery/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/tracking.js',
        destination: '/api/tracking-script',
      },
    ];
  },
};

module.exports = nextConfig;