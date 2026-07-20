import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "soleinsider.com",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "imgur.com",
      },
      {
        protocol: "https",
        hostname: "**.kith.com",
      },
      {
        protocol: "https",
        hostname: "**.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.shopifycdn.net",
      },
      {
        protocol: "https",
        hostname: "**.nicekicks.com",
      },
      {
        protocol: "https",
        hostname: "**.soleretriever.com",
      },
      {
        protocol: "https",
        hostname: "**.supdrops.com",
      },
      {
        protocol: "https",
        hostname: "**.kicksonfire.com",
      },
    ],
  },
};

export default nextConfig;
