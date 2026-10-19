import type { Lang } from "@/shared/i18n";

import { POSTS, type BlogPost } from "./data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://noghre.land/api/v1";

type ApiBlogPost = {
  author?: { avatar?: string; name?: string };
  category?: string | null;
  categorySlug?: string;
  comments?: Array<{ authorName: string; body: string; createdAt: string; id: string; likes: number }>;
  commentsCount?: number;
  contentMarkdown: string;
  coverGradient?: string | null;
  excerpt: string;
  featuredImageUrl?: string | null;
  id: string;
  publishedAt?: string;
  readMinutes: number;
  related?: ApiBlogPost[];
  slug: string;
  tags: Array<{ slug: string; title: string }>;
  title: string;
};

export type BlogComment = {
  authorName: string;
  body: string;
  createdAt: string;
  id: string;
  likes: number;
};

export type BlogPostDetail = BlogPost & {
  apiId?: string;
  comments: BlogComment[];
  related: BlogPost[];
};

export async function getBlogPosts(lang: Lang): Promise<BlogPost[]> {
  const response = await safeFetch<{ items: ApiBlogPost[] }>(`/blog/posts?language=${lang}&pageSize=100&sortBy=sortOrder&sortOrder=asc`);
  return response?.items?.length ? response.items.map((post) => fromApiPost(post, lang)) : POSTS;
}

export async function getBlogPost(slug: string, lang: Lang): Promise<BlogPostDetail | null> {
  const response = await safeFetch<ApiBlogPost>(`/blog/posts/${slug}?lang=${lang}`);
  if (response) {
    return {
      ...fromApiPost(response, lang),
      apiId: response.id,
      comments: response.comments ?? [],
      related: response.related?.map((post) => fromApiPost(post, lang)) ?? [],
    };
  }

  const fallback = POSTS.find((post) => post.slug === slug);
  if (!fallback) return null;
  return { ...fallback, comments: [], related: [], apiId: undefined };
}

export async function submitBlogComment(input: {
  authorEmail?: string;
  authorName: string;
  body: string;
  parentId?: string;
  slug: string;
}) {
  const response = await fetch(`${API_BASE}/blog/posts/${input.slug}/comments`, {
    body: JSON.stringify({
      authorEmail: input.authorEmail || undefined,
      authorName: input.authorName,
      body: input.body,
      parentId: input.parentId,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new Error("Unable to submit comment");
  return response.json() as Promise<BlogComment>;
}

function fromApiPost(post: ApiBlogPost, lang: Lang): BlogPost {
  const localized = <T extends string>(value: T) => ({ ar: value, en: value, fa: value });
  return {
    author: {
      avatar: post.author?.avatar ?? "S",
      name: localized(post.author?.name ?? "Setayesh Team"),
      role: {
        ar: "التحرير الهندسي",
        en: "Engineering Editorial",
        fa: "تحریریه فنی",
      },
    },
    category: (post.category ?? post.categorySlug ?? "Blog") as BlogPost["category"],
    content: localized(post.contentMarkdown),
    cover: post.featuredImageUrl ?? post.coverGradient ?? "from-primary/40 via-secondary/20 to-transparent",
    date: post.publishedAt ?? new Date().toISOString(),
    excerpt: localized(post.excerpt),
    readMin: post.readMinutes,
    slug: post.slug,
    tags: post.tags.map((tag) => tag.title),
    title: localized(post.title),
  };
}

async function safeFetch<T>(path: string): Promise<T | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 }, signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
