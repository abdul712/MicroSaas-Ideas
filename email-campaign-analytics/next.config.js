/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000',
  },
  images: {
    domains: ['localhost', 'api.example.com'],
  },
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  rewrites: async () => {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:8000'}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;