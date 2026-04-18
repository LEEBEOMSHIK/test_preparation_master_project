/** @type {import('next').NextConfig} */

// React Native Web 모듈 트랜스파일 설정
const withTM = require('next-transpile-modules')([
  'react-native',
  'react-native-web',
  '@react-native-async-storage/async-storage',
]);

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // React Native → React Native Web 매핑
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/:path*`,
      },
    ];
  },
};

module.exports = withTM(nextConfig);
