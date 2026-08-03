import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
