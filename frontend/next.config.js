/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase', '@firebase/firestore', '@grpc/grpc-js', '@grpc/proto-loader'],
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
    };
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@grpc/grpc-js', '@grpc/proto-loader');
    }
    return config;
  },
};

module.exports = nextConfig;
