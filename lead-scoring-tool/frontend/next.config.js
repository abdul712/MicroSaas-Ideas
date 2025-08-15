/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Output configuration for Docker
  output: 'standalone',
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Public runtime config
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
    environment: process.env.NODE_ENV || 'development',
  },
  
  // Server runtime config (server-side only)
  serverRuntimeConfig: {
    // Internal API URLs that should not be exposed to the client
    internalApiUrl: process.env.INTERNAL_API_URL || 'http://backend:8000',
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/signin',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      config.optimization.concatenateModules = false;
    }
    
    // Custom webpack plugins
    config.plugins.push(
      new webpack.DefinePlugin({
        __BUILD_ID__: JSON.stringify(buildId),
        __DEV__: JSON.stringify(dev),
      })
    );
    
    // Handle file imports
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
      type: 'asset',
    });
    
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            priority: 20,
            chunks: 'all',
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimization
  compress: true,
  poweredByHeader: false,
  
  // TypeScript configuration
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    dirs: ['src', 'pages', 'components', 'lib', 'hooks'],
    ignoreDuringBuilds: false,
  },
  
  // SWC minification
  swcMinify: true,
  
  // Modularize imports for better tree shaking
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
    '@mui/lab': {
      transform: '@mui/lab/{{member}}',
    },
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  
  // Cross-origin configuration
  crossOrigin: 'anonymous',
  
  // Internationalization (if needed)
  // i18n: {
  //   locales: ['en', 'es', 'fr'],
  //   defaultLocale: 'en',
  // },
  
  // Trailing slash configuration
  trailingSlash: false,
  
  // Asset prefix for CDN
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.example.com' : '',
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  
  // React strict mode
  reactStrictMode: true,
  
  // Exclude packages from bundling
  experimental: {
    serverComponentsExternalPackages: [
      '@prisma/client',
      'bcryptjs',
      'jsonwebtoken',
    ],
    // Server actions
    serverActions: true,
    // Optimize CSS
    optimizeCss: true,
    // Optimize fonts
    optimizeFonts: true,
    // Turbopack (experimental)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = withBundleAnalyzer(nextConfig);