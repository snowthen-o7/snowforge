/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@snowforge/ui'],
  turbopack: {
    resolveAlias: {
      '@/lib/utils': './src/lib/utils.ts',
    },
  },
}

module.exports = nextConfig
