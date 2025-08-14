/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  typescript: {
    // Enable strict type checking
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // Enable ESLint during builds
    ignoreDuringBuilds: false,
  },
  poweredByHeader: false,
  compress: true,
  // Enable webpack bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      bundlePagesRouterDependencies: true,
    },
  }),
}

module.exports = nextConfig