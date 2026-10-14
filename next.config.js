/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained build (.next/standalone/server.js) that runs
  // natively under Hostinger's Node.js application runner — no serverless
  // platform required.
  output: 'standalone',

  // Hostinger Business hosting has no sharp/serverless image optimizer,
  // so serve images as-is.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

  // Allow slightly larger server action / upload bodies (we also enforce a
  // hard 5MB cap inside the upload route itself).
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },

  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;
