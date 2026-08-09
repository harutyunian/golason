import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.api-sports.io",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/scores",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
