import type { NextConfig } from "next";

// Newly uploaded product images resolve to this host (see src/lib/s3.ts) —
// either the bucket's own S3 endpoint or a CloudFront/custom domain in front
// of it, depending on whether S3_PUBLIC_HOSTNAME is set.
const s3PublicHostname =
  process.env.S3_PUBLIC_HOSTNAME ||
  (process.env.S3_BUCKET_NAME && process.env.AWS_REGION
    ? `${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
    : undefined);

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      // Default is 1MB, too small for the admin "Add Release" image uploads.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "soleinsider.com",
      },
      ...(s3PublicHostname
        ? [{ protocol: "https" as const, hostname: s3PublicHostname }]
        : []),
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
