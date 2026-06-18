import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  // Exclude better-sqlite3 from client-side bundling (it's a native Node module)
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
