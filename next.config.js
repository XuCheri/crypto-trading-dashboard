/** @type {import('next').NextConfig} */
const nextConfig = {
  // 注意：已移除 output: 'export' 以启用 API Routes 代理功能
  // 部署到 Vercel 时，API Routes 会自动作为 Serverless Functions 运行

  // 图片优化配置
  images: {
    unoptimized: true,
  },

  // 严格模式
  reactStrictMode: true,

  // 禁用 x-powered-by header
  poweredByHeader: false,

  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'lightweight-charts',
    ],
  },

  // 编译器优化
  compiler: {
    // 移除 console.log（生产环境）
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 优化分块策略
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // 将大型库单独打包
          charts: {
            test: /[\\/]node_modules[\\/](lightweight-charts)[\\/]/,
            name: 'charts',
            priority: 20,
          },
          gridLayout: {
            test: /[\\/]node_modules[\\/](react-grid-layout|react-resizable)[\\/]/,
            name: 'grid-layout',
            priority: 20,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
          },
        },
      }
    }

    return config
  },
}

module.exports = nextConfig
