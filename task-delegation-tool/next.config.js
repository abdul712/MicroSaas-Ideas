/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@tensorflow/tfjs-node']
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // AI/ML optimization
    if (isServer) {
      config.externals.push('@tensorflow/tfjs-node')
    }
    
    // WebSocket support
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      fs: false,
    }
    
    return config
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
}

module.exports = nextConfig