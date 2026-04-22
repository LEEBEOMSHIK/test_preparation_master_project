/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  // Next.js 13+ built-in transpilePackages replaces next-transpile-modules
  transpilePackages: [
    'react-native',
    'react-native-web',
    '@react-native-async-storage/async-storage',
  ],
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

module.exports = nextConfig;
