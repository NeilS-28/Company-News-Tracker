import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/*': ['./data/**/*', './src/db/**/*'],
  },
};

export default nextConfig;
