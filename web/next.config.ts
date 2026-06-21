import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  staticPageGenerationTimeout: 1000,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
