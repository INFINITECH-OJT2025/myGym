/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['127.0.0.1'], // ✅ Allow loading images from local Laravel server
    },
  };
  
  module.exports = nextConfig;
  