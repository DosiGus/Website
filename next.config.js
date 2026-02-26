/** @type {import('next').NextConfig} */
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const isDevelopment = process.env.NODE_ENV !== "production";

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // In local dev we disable custom security headers so Next.js client
    // hydration/HMR scripts are never blocked by CSP restrictions.
    if (isDevelopment) {
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
