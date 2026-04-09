import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: 'a.espncdn.com' }],
  },
};

export default nextConfig;
