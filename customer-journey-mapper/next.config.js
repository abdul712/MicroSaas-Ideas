/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@clickhouse/client']
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com']
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    CLICKHOUSE_URL: process.env.CLICKHOUSE_URL,
    REDIS_URL: process.env.REDIS_URL,
    KAFKA_BROKERS: process.env.KAFKA_BROKERS,
  }
}

module.exports = nextConfig