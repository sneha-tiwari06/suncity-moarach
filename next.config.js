/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable React Strict Mode to prevent PDF.js worker issues
  // In development, Strict Mode causes components to mount/unmount/remount
  // which can destroy the PDF.js worker transport while it's in use
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig