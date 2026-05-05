/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

// ── 환경 공통 설정 ──────────────────────────────────────────────
const sharedConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'react-native',
    'react-native-web',
    '@react-native-async-storage/async-storage',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      ...config.resolve.extensions,
    ];
    return config;
  },
};

// ── 개발 전용 설정 ───────────────────────────────────────────────
// Nginx 없이 Next.js dev server가 직접 /api/, /uploads/ 를 백엔드로 프록시
const devConfig = {
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const backendOrigin = apiBase.replace(/\/api\/?$/, '');
    return [
      { source: '/api/:path*',     destination: `${apiBase}/:path*` },
      { source: '/uploads/:path*', destination: `${backendOrigin}/uploads/:path*` },
    ];
  },
};

// ── 프로덕션 전용 설정 ───────────────────────────────────────────
// Nginx가 /api/, /uploads/ 라우팅 담당 → Next.js rewrites 불필요
const prodConfig = {
};

module.exports = {
  ...sharedConfig,
  ...(isDev ? devConfig : prodConfig),
};
