import { adminApiRequest } from "./admin-api-request";

export interface SeoList<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SeoMetadataItem {
  canonicalUrl?: string | null;
  checklist?: Record<string, unknown> | null;
  description: string;
  entityId: string;
  entityType: string;
  id: string;
  keywords: string[];
  language?: { code: string; name: string } | null;
  ogImage?: string | null;
  path: string;
  robots: string;
  score: number;
  status: string;
  title: string;
  updatedAt: string;
}

export interface RedirectItem {
  hits: number;
  id: string;
  language?: { code: string; name: string } | null;
  sourcePath: string;
  status: "ACTIVE" | "DISABLED";
  statusCode: number;
  targetPath: string;
  updatedAt: string;
}

export interface SeoAuditItem {
  createdAt: string;
  entityId: string;
  entityType: string;
  id: string;
  issues?: Record<string, unknown> | null;
  language: string;
  score: number;
}

export interface SeoQuery {
  language?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface UpsertSeoMetadataInput {
  canonicalUrl?: string;
  description: string;
  entityId: string;
  entityType: string;
  hreflang?: Record<string, string>;
  keywords?: string[];
  languageCode: string;
  ogImage?: string;
  path: string;
  robots?: string;
  structuredData?: Record<string, unknown>;
  title: string;
}

export interface UpsertRedirectInput {
  languageCode?: string;
  sourcePath: string;
  status?: "ACTIVE" | "DISABLED";
  statusCode?: number;
  targetPath: string;
}

export function getSeoMetadata(query: SeoQuery = {}) {
  return seoRequest<SeoList<SeoMetadataItem>>("/admin/seo/metadata", query);
}

export function upsertSeoMetadata(input: UpsertSeoMetadataInput) {
  return seoRequest<SeoMetadataItem>("/admin/seo/metadata", undefined, { body: input, method: "POST" });
}

export function getSeoRedirects(query: SeoQuery = {}) {
  return seoRequest<SeoList<RedirectItem>>("/admin/seo/redirects", query);
}

export function upsertSeoRedirect(input: UpsertRedirectInput) {
  return seoRequest<RedirectItem>("/admin/seo/redirects", undefined, { body: input, method: "POST" });
}

export function getSeoAudits(query: SeoQuery = {}) {
  return seoRequest<SeoList<SeoAuditItem>>("/admin/seo/audits", query);
}

async function seoRequest<T>(
  path: string,
  query?: SeoQuery,
  init: { body?: unknown; method?: string } = {},
) {
  return adminApiRequest<T>(path, { body: init.body, method: init.method, query });
}
