/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@tensorflow/tfjs-node'],
  },
  webpack: (config, { isServer }) => {
    // Handle TensorFlow.js in server environment
    if (isServer) {
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node'
      });
    }
    
    // Handle Canvas for server-side rendering
    config.resolve.alias.canvas = false;
    
    return config;
  },
  images: {
    domains: ['localhost', 'cdn.shopify.com', 'images-na.ssl-images-amazon.com'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

module.exports = nextConfig