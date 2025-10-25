import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Docker 部署配置
  output: 'standalone',
  // 实验性功能配置
  experimental: {
    // 启用更好的错误处理
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // 开发服务器配置
  devIndicators: {
    position: 'bottom-right',
  },
  // Webpack配置
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 在客户端构建中忽略Node.js模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
