import type { MetadataRoute } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://noghre.land/api/v1";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noghre.land";
const SEO_FETCH_TIMEOUT_MS = 1_200;

export interface SeoMetadataPayload {
  canonicalUrl?: string;
  description: string;
  hreflang?: Record<string, string>;
  keywords: string[];
  ogDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  path: string;
  robots: string;
  structuredData?: Record<string, unknown>;
  title: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterTitle?: string;
}

export interface SitemapPayload {
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  imageUrls: string[];
  lastModified: string;
  path: string;
  priority: string | number;
}

export async function getSeoMetadata(path = "/", lang = "fa") {
  return safeFetch<SeoMetadataPayload>(`/seo/metadata?path=${encodeURIComponent(path)}&lang=${encodeURIComponent(lang)}`);
}

export async function getSeoSitemap() {
  return safeFetch<SitemapPayload[]>("/seo/sitemap");
}

export async function getSeoRobots() {
  return safeFetch<{ allow?: string[]; disallow?: string[]; userAgent?: string }>("/seo/robots");
}

export function absoluteUrl(path: string) {
  return `${siteUrl}${path === "/" ? "" : path}`;
}

async function safeFetch<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEO_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
