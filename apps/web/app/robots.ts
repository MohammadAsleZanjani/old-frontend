import type { MetadataRoute } from "next";

import { getSeoRobots } from "@/shared/seo/seo-api";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noghre.land";
  const seoRobots = await getSeoRobots();
  return {
    rules: {
      userAgent: seoRobots?.userAgent ?? "*",
      allow: seoRobots?.allow ?? ["/"],
      disallow: seoRobots?.disallow ?? ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
