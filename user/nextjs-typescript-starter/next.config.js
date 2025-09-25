/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: [],
  },
  typescript: {
    // 在生产构建时忽略 TypeScript 错误（可选）
    ignoreBuildErrors: false,
  },
  eslint: {
    // 在生产构建时忽略 ESLint 错误（可选）
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig

