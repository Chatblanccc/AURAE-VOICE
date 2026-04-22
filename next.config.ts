import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** CSP tuned for Next.js: inline scripts/styles; tighten further with nonces if needed. */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
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
  /**
   * OneDrive/Desktop on Windows often returns EPERM on `rmdir` while Next cleans `.next`.
   * Skipping the full clean reduces those failures; run `npx rimraf .next` (or delete the folder)
   * when you need a pristine build.
   */
  cleanDistDir: false,
  reactCompiler: true,
  /** Browsers request /favicon.ico by default; point to our SVG so the tab icon is not missing or stale. */
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/favicon.svg", permanent: false }];
  },
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
