/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 배포를 위한 standalone 모드
  output: 'standalone',
  
  // 빌드 시 ESLint 무시 (배포용)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 빌드 시 TypeScript 에러 무시 (경고만)
  typescript: {
    ignoreBuildErrors: true,
  },
  
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
    // 디버깅을 위해 임시로 비활성화
    // removeConsole: process.env.NODE_ENV === 'production',
  },
  // 개발 서버 최적화
  experimental: {
    optimizePackageImports: ['lucide-react', 'chart.js'],
  },
  
  // Railway 도메인 리다이렉트
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '(.*)\\.railway\\.app',
          },
        ],
        destination: 'https://pmms.info/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
