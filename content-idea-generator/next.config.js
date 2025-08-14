/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'ui-avatars.com',
    ],
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_TRENDS_API_KEY: process.env.GOOGLE_TRENDS_API_KEY,
    SERPAPI_KEY: process.env.SERPAPI_KEY,
  },
}

module.exports = nextConfig