import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for faster navigation
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@/components', '@/lib'],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
