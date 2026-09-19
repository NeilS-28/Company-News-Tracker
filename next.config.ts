import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./data/**/*', './src/db/**/*'],
  },
};

export default nextConfig;
