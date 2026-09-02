import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // EdgeOne 上不经过 Next 图片优化服务，避免 /_next/image 落到 Node 运行时
  images: { unoptimized: true },
};

export default nextConfig;
