import type { NextConfig } from "next";

// All product imagery now resolves to S3 (see src/lib/productImages.ts), so
// this allowlist is load-bearing — a build without the env vars set would
// otherwise break every image on the site. The known bucket host is listed
// statically as a floor, and the env-derived host is added on top so a
// CloudFront/custom domain or a bucket rename keeps working.
const s3StaticHostname = "soleinsider.s3.us-east-1.amazonaws.com";

const s3EnvHostname =
  process.env.S3_PUBLIC_HOSTNAME ||
  (process.env.S3_BUCKET_NAME && process.env.AWS_REGION
    ? `${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
    : undefined);

const s3Hostnames = Array.from(
  new Set([s3StaticHostname, ...(s3EnvHostname ? [s3EnvHostname] : [])]),
);

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
      ...s3Hostnames.map((hostname) => ({ protocol: "https" as const, hostname })),
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
