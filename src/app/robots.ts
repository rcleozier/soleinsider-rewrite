import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteData";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/mobile-auth", "/mobileapi", "/public/ingest"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
