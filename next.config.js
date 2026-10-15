/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained build (.next/standalone/server.js) that runs
  // natively under Hostinger's Node.js application runner — no serverless
  // platform required.
  output: 'standalone',

  // Ensure these server-only packages are traced & copied into the standalone
  // output (mysql2 has dynamic internal requires the bundler/tracer can miss,
  // which would otherwise crash with "Cannot find module 'mysql2'" in prod).
  serverExternalPackages: ['mysql2', 'bcryptjs'],

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

  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    // Next needs inline scripts for hydration; dev also needs eval (fast refresh).
    const scriptSrc = isDev
      ? "'self' 'unsafe-inline' 'unsafe-eval'"
      : "'self' 'unsafe-inline'";
    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "media-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Ignored by browsers over plain HTTP; takes effect on HTTPS (prod).
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
