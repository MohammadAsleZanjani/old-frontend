import { adminApiRequest } from "./admin-api-request";

export type BlogCommentStatus = "APPROVED" | "PENDING" | "REJECTED" | "SPAM";
export type ProductReviewStatus = "APPROVED" | "PENDING" | "REJECTED" | "SPAM";
export type ProductQuestionStatus = "ANSWERED" | "CLOSED" | "PENDING" | "SPAM";

export interface ModerationList<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BlogCommentModerationItem {
  authorEmail?: string | null;
  authorName: string;
  body: string;
  createdAt: string;
  id: string;
  moderatedAt?: string | null;
  moderatedBy?: { email?: string | null; id: string } | null;
  post?: { id: string; slug: string; title: string } | null;
  postId: string;
  status: BlogCommentStatus;
}

export interface ProductReviewModerationItem {
  body?: string | null;
  createdAt: string;
  id: string;
  product?: { id: string; slug: string; title: string } | null;
  rating: number;
  status: ProductReviewStatus;
  title?: string | null;
  user?: { email?: string | null; id: string } | null;
}

export interface ProductQuestionModerationItem {
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  id: string;
  product?: { id: string; slug: string; title: string } | null;
  question: string;
  status: ProductQuestionStatus;
  user?: { email?: string | null; id: string } | null;
}

export interface ModerationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

export function getBlogComments(query: ModerationQuery = {}) {
  return moderationRequest<ModerationList<BlogCommentModerationItem>>("/admin/blog/comments", {
    ...query,
    commentStatus: query.status,
    status: undefined,
  });
}

export function moderateBlogComment(id: string, status: BlogCommentStatus) {
  return moderationRequest<BlogCommentModerationItem>(`/admin/blog/comments/${id}/moderate`, undefined, {
    body: { status },
    method: "PATCH",
  });
}

export function replyToBlogComment(input: { body: string; parentId: string; postId: string }) {
  return moderationRequest<BlogCommentModerationItem>("/admin/blog/comments/reply", undefined, {
    body: { ...input, authorName: "پشتیبانی نقره" },
    method: "POST",
  });
}

export function getProductReviews(query: ModerationQuery = {}) {
  return moderationRequest<ModerationList<ProductReviewModerationItem>>("/admin/products/moderation/reviews", {
    ...query,
    reviewStatus: query.status,
    status: undefined,
  });
}

export function moderateProductReview(id: string, status: ProductReviewStatus) {
  return moderationRequest<ProductReviewModerationItem>(`/admin/products/moderation/reviews/${id}`, undefined, {
    body: { status },
    method: "PATCH",
  });
}

export function getProductQuestions(query: ModerationQuery = {}) {
  return moderationRequest<ModerationList<ProductQuestionModerationItem>>("/admin/products/moderation/questions", {
    ...query,
    questionStatus: query.status,
    status: undefined,
  });
}

export function answerProductQuestion(id: string, answer: string, status: ProductQuestionStatus = "ANSWERED") {
  return moderationRequest<ProductQuestionModerationItem>(`/admin/products/moderation/questions/${id}`, undefined, {
    body: { answer, status },
    method: "PATCH",
  });
}

async function moderationRequest<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
  init: { body?: unknown; method?: string } = {},
) {
  return adminApiRequest<T>(path, { body: init.body, method: init.method, query });
}
