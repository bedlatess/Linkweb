import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker — bundles server deps into .next/standalone
  output: "standalone",

  // Allow images from OAuth providers (avatars)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
