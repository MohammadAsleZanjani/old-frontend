const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://noghre.land/api/v1";

export interface PublicCmsPage {
  body?: string;
  contacts?: PublicContactChannel[];
  description: string;
  eyebrow?: string;
  faqs?: PublicFaqItem[];
  image?: string;
  points?: string[];
  slug: string;
  title: string;
  updatedAt?: string;
}

export interface PublicContactChannel {
  href?: string | null;
  key: string;
  label: string;
  type: string;
  value: string;
}

export interface PublicFaqItem {
  answer: string;
  id: string;
  question: string;
}

export interface PublicBlogPost {
  author?: { name?: string };
  category?: string;
  comments?: Array<{ authorName: string; body: string; createdAt: string; id: string; likes?: number }>;
  contentMarkdown: string;
  excerpt: string;
  featuredImageUrl?: string;
  id: string;
  publishedAt: string;
  readMinutes: number;
  related?: PublicBlogPost[];
  slug: string;
  tags: Array<{ slug: string; title: string }>;
  title: string;
}

export async function getPublicCmsPage(slug: string) {
  return safeFetch<PublicCmsPage>(`/cms/pages/${slug}`);
}

export async function getPublicBlogPosts() {
  const result = await safeFetch<{ items: PublicBlogPost[] }>("/blog/posts?language=fa&pageSize=100&sortOrder=desc");
  return result?.items ?? [];
}

export async function getPublicBlogPost(slug: string) {
  return safeFetch<PublicBlogPost>(`/blog/posts/${slug}?lang=fa`);
}

export async function submitPublicBlogComment(slug: string, input: { authorEmail?: string; authorName: string; body: string }) {
  const response = await fetch(`${API_BASE}/blog/posts/${slug}/comments`, {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) throw new Error(readApiError(payload) ?? "ثبت دیدگاه ناموفق بود.");
  return payload;
}

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function readApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? ((record.error && typeof record.error === "object") ? (record.error as Record<string, unknown>).message : undefined);
  return typeof message === "string" ? message : undefined;
}
