import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // هذا السطر يمنع خطأ 400 ويخفف الضغط على السيرفر
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.gimxa.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

export default nextConfig;
