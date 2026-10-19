import { adminApiRequest } from "./admin-api-request";

export type PromotionStatus = "ACTIVE" | "DRAFT" | "EXPIRED" | "PAUSED";
export type PromotionRewardType = "ORDER_FIXED" | "ORDER_PERCENT" | "SILVER_WALLET" | "TOMAN_WALLET";

export interface PromotionEvent {
  color?: string | null;
  endsAt: string;
  id: string;
  startsAt: string;
  title: string;
}

export interface PromotionBlogger {
  code: string;
  id: string;
  user: {
    email?: string | null;
    id?: string;
    mobile?: string | null;
    profile?: { firstName?: string | null; lastName?: string | null } | null;
  };
}

export interface AdminPromotion {
  _count?: { redemptions: number };
  bloggerAffiliate?: PromotionBlogger | null;
  bloggerAffiliateId?: string | null;
  code: string;
  createdAt: string;
  currency?: string | null;
  description?: string | null;
  effectiveStatus: PromotionStatus;
  endsAt?: string | null;
  events: PromotionEvent[];
  id: string;
  maxDiscountAmount?: string | null;
  minOrderAmount: string;
  name: string;
  perUserLimit: number;
  redemptionCount: number;
  rewardType: PromotionRewardType;
  startsAt?: string | null;
  status: PromotionStatus;
  totalUsageLimit?: number | null;
  updatedAt: string;
  value: string;
}

export interface PromotionInput {
  bloggerAffiliateId?: string | null;
  code: string;
  currency?: string | null;
  description?: string | null;
  endsAt?: string | null;
  event?: {
    color?: string;
    endsAt: string;
    startsAt: string;
    title: string;
  } | null;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  name: string;
  perUserLimit?: number;
  rewardType: PromotionRewardType;
  startsAt?: string | null;
  status?: PromotionStatus;
  totalUsageLimit?: number | null;
  value: number;
}

export interface PromotionAnalytics {
  bloggerReports: Array<{ affiliateId: string; clicks: number; codeCount: number; contact?: string | null; conversionRate: number; name: string; redemptions: number; revenue: string; userId: string }>;
  kpis: {
    activeCodes: number;
    codes: number;
    completedRedemptions: number;
    discountAmount: string;
    pendingRedemptions: number;
    redemptions: number;
    silverWalletCredit: string;
    tomanWalletCredit: string;
  };
  timeline: Array<{ date: string; discountAmount: string; redemptions: number; revenue: string; walletCreditAmount: string }>;
  topCodes: Array<{ code: string; discountAmount: string; id: string; name: string; redemptions: number; revenue: string; walletCreditAmount: string }>;
}

interface PromotionPage {
  data: AdminPromotion[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function getAdminPromotions(query: {
  bloggerAffiliateId?: string;
  page?: number;
  pageSize?: number;
  rewardType?: PromotionRewardType;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: PromotionStatus;
}) {
  return adminApiRequest<PromotionPage>("/admin/promotions", { query });
}

export function getAdminPromotionAnalytics() {
  return adminApiRequest<PromotionAnalytics>("/admin/promotions/analytics");
}

export function getAdminPromotionCalendar(dateFrom?: string, dateTo?: string) {
  return adminApiRequest<Array<PromotionEvent & { promotion: Pick<AdminPromotion, "code" | "id" | "name" | "rewardType" | "status" | "value"> }>>("/admin/promotions/calendar", { query: { dateFrom, dateTo } });
}

export function getAdminPromotionBloggers() {
  return adminApiRequest<PromotionBlogger[]>("/admin/promotions/bloggers");
}

export function createAdminPromotion(input: PromotionInput) {
  return adminApiRequest<AdminPromotion>("/admin/promotions", { body: input, method: "POST" });
}

export function updateAdminPromotion(id: string, input: Partial<PromotionInput>) {
  return adminApiRequest<AdminPromotion>(`/admin/promotions/${id}`, { body: input, method: "PATCH" });
}

export function deleteAdminPromotion(id: string) {
  return adminApiRequest<{ deleted: true; id: string }>(`/admin/promotions/${id}`, { method: "DELETE" });
}
