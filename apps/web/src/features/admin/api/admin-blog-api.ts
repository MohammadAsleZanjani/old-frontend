import { adminApiRequest } from "./admin-api-request";

export type BlogContentStatus = "ARCHIVED" | "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "SCHEDULED";

export interface UpsertAdminBlogPostInput {
  categorySlug?: string;
  commentsEnabled?: boolean;
  content: Record<string, unknown>;
  contentMarkdown: string;
  excerpt: string;
  featured?: boolean;
  featuredImageUrl?: string;
  languageCode: string;
  publishedAt?: string;
  readMinutes?: number;
  scheduledAt?: string;
  seo?: {
    canonicalUrl?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    title?: string;
  };
  slug: string;
  sortOrder?: number;
  status?: BlogContentStatus;
  tagSlugs?: string[];
  title: string;
}

export interface AdminBlogPostDetail extends Record<string, unknown> {
  category?: { slug?: string | null } | null;
  commentsEnabled?: boolean;
  content?: Record<string, unknown>;
  contentMarkdown?: string;
  excerpt?: string;
  featured?: boolean;
  featuredImageUrl?: string | null;
  id: string;
  language?: { code?: string | null } | null;
  publishedAt?: string | null;
  readMinutes?: number | null;
  scheduledAt?: string | null;
  slug: string;
  sortOrder?: number | null;
  status?: BlogContentStatus;
  tags?: Array<{ tag?: { slug?: string | null } | null }>;
  title?: string;
}

export function getAdminBlogPost(id: string) {
  return blogRequest<AdminBlogPostDetail>(`/admin/blog/posts/${id}`);
}

export function upsertAdminBlogPost(input: UpsertAdminBlogPostInput) {
  return blogRequest<AdminBlogPostDetail>("/admin/blog/posts", { body: input, method: "POST" });
}

async function blogRequest<T>(path: string, init: { body?: unknown; method?: string } = {}) {
  return adminApiRequest<T>(path, { body: init.body, method: init.method });
}
