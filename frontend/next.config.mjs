/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nextjs.org',
        pathname: '/icons/**',
      },
    ],
  },
  // 성능 최적화
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 개발 서버 최적화
  experimental: {
    optimizePackageImports: ['lucide-react', 'chart.js'],
  },
};

export default nextConfig;
