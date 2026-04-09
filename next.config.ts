import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** CSP tuned for Next.js: inline scripts/styles; tighten further with nonces if needed. */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next/React hydration uses inline scripts in dev; production may still need 'unsafe-inline' for some chunks
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders: { key: string; value: string }[] = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        // Google profile photos
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        // WeChat profile photos (for when WeChat login is enabled)
        protocol: 'https',
        hostname: 'thirdwx.qlogo.cn',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
