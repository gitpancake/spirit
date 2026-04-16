import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force port 3001 for local development only
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      port: 3001,
    }
  }),
};

export default nextConfig;
