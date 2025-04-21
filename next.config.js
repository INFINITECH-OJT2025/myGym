/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['127.0.0.1'], // ✅ Allow loading images from local Laravel server
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Ignore ESLint errors during production builds
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignore TypeScript errors during builds
  },experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
