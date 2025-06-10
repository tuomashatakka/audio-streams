/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  
  webpack: (config, { isServer }) => {
    // Add support for Web Workers
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Handle Web Workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          name: 'static/chunks/[name].[hash].worker.js',
          publicPath: '/_next/',
        },
      },
    })

    // Handle audio files
    config.module.rules.push({
      test: /\.(wav|mp3|m4a|mp4|ogg|flac)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
        },
      },
    })

    return config
  },

  // Headers for Web Audio API and SharedArrayBuffer
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },

  // Static file optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // Performance optimizations
  swcMinify: true,
  poweredByHeader: false,

  // Enable static export if needed
  // output: 'export',
  // trailingSlash: true,
}

module.exports = nextConfig