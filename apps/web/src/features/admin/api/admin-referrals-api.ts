import { adminApiRequest } from "./admin-api-request";

export type AdminReferralMode = "affiliates" | "clicks" | "commissions" | "conversions" | "fraud-signals" | "kyc-rewards" | "payouts";

export interface AdminReferralList<T = Record<string, unknown>> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface AdminReferralRule {
  commissionType: "FIXED" | "PERCENTAGE";
  cookieWindowDays: number;
  currency: string;
  endsAt?: string | null;
  holdDays: number;
  id: string;
  maxCommission?: string | null;
  maxConversionsPerUser: number;
  minOrderAmount: string;
  minPayoutAmount: string;
  name: string;
  referredRewardMax?: string | null;
  referredRewardType?: "FIXED" | "PERCENTAGE" | null;
  referredRewardValue: string;
  sortOrder: number;
  startsAt?: string | null;
  status: "ACTIVE" | "INACTIVE";
  value: string;
}

export interface AdminReferralRuleInput {
  commissionType: "FIXED" | "PERCENTAGE";
  cookieWindowDays?: number;
  currency?: string;
  endsAt?: string;
  holdDays?: number;
  maxCommission?: number;
  maxConversionsPerUser?: number;
  minOrderAmount?: number;
  minPayoutAmount?: number;
  name: string;
  referredRewardMax?: number;
  referredRewardType?: "FIXED" | "PERCENTAGE";
  referredRewardValue?: number;
  sortOrder?: number;
  startsAt?: string;
  status?: "ACTIVE" | "INACTIVE";
  value: number;
}

export interface AdminReferralReport {
  activeAffiliates: number;
  clicks: number;
  commissionByStatus: Record<string, string>;
  commissionGenerated: string;
  conversionRate: number;
  conversionRevenue: string;
  conversions: number;
  fraudSignals: number;
  kycQualifiedReferrals: number;
  kycRewardAmount: number;
  kycRewardsPaid: string;
  paidPayouts: string;
  pendingPayouts: string;
  referredUserRewards: string;
  referredUsers: number;
  registrationRewardAmount: number;
  registrationRewardedReferrals: number;
  registrationRewardsPaid: string;
}

export function getAdminReferralList(mode: AdminReferralMode, params: { page?: number; pageSize?: number; risk?: string; search?: string; sortOrder?: string; status?: string }) {
  return adminApiRequest<AdminReferralList>(`/admin/referrals/${mode}`, { query: params });
}

export function getAdminReferralReports() {
  return adminApiRequest<AdminReferralReport>("/admin/referrals/reports");
}

export function getAdminReferralRules() {
  return adminApiRequest<AdminReferralRule[]>("/admin/referrals/rules");
}

export function reconcileAdminReferralKycRewards() {
  return adminApiRequest<{ qualifiedUsers: number; rewardedRegistrations: number; scannedUsers: number }>("/admin/referrals/kyc-rewards/reconcile", { method: "POST" });
}

export function createAdminReferralRule(input: AdminReferralRuleInput) {
  return adminApiRequest<AdminReferralRule>("/admin/referrals/rules", { body: input, method: "POST" });
}

export function updateAdminReferralRule(id: string, input: AdminReferralRuleInput) {
  return adminApiRequest<AdminReferralRule>(`/admin/referrals/rules/${id}`, { body: input, method: "PATCH" });
}

export function updateAdminAffiliateStatus(id: string, status: string) {
  return adminApiRequest(`/admin/referrals/affiliates/${id}/status`, { body: { status }, method: "PATCH" });
}

export function updateAdminCommissionStatus(id: string, status: string) {
  return adminApiRequest(`/admin/referrals/commissions/${id}/status`, { body: { status }, method: "PATCH" });
}

export function updateAdminPayoutStatus(id: string, status: string) {
  return adminApiRequest(`/admin/referrals/payouts/${id}/status`, { body: { status }, method: "PATCH" });
}
