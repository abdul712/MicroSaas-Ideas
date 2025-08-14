/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['prisma'],
  },
  images: {
    domains: [
      'localhost',
      'uploadthing.com',
      'utfs.io',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

module.exports = nextConfig;