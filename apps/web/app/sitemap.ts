import type { MetadataRoute } from "next";

const routes = ["", "/products", "/wheel", "/fees", "/blog", "/faq", "/about", "/contact", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noghre.land";
  const now = new Date();
  return routes.map((path) => ({
    changeFrequency: path === "" ? "daily" : "weekly",
    lastModified: now,
    priority: path === "" ? 1 : 0.7,
    url: `${siteUrl}${path}`,
  }));
}
