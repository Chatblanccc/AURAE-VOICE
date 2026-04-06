import type { NextConfig } from "next";

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
};

export default nextConfig;
