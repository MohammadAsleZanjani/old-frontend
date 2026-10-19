import { adminApiRequest } from "./admin-api-request";

export type AdminWheelPrizeType = "PHYSICAL_PRIZE" | "WALLET_CREDIT" | "FIXED_DISCOUNT" | "PERCENTAGE_DISCOUNT" | "EXTRA_SPIN";
export type AdminWheelCampaignStatus = "ACTIVE" | "ARCHIVED" | "DRAFT" | "PAUSED";

export interface AdminWheelPrize {
  claimedCount: number;
  dailyLimit?: number | null;
  displayOrder: number;
  id: string;
  isActive: boolean;
  isJackpot: boolean;
  maxDiscountAmount?: string | null;
  minimumPurchase: string;
  perUserLimit?: number | null;
  probability: string;
  prizeType: AdminWheelPrizeType;
  prizeValue: string;
  remainingStock?: number | null;
  rewardExpiryDays: number;
  stockLimit?: number | null;
  titleEn: string;
  titleFa: string;
}

export interface AdminWheelCampaign {
  _count?: { events: number; grants: number; prizes: number; spins: number };
  completedSpinCount: number;
  dailySpinLimit: number;
  endsAt?: string | null;
  extraSpinCapPerUser: number;
  firstSpinEnabled: boolean;
  globalSpinLimit?: number | null;
  id: string;
  name: string;
  perUserSpinLimit?: number | null;
  prizes: AdminWheelPrize[];
  rateLimitPerMinute: number;
  requiresVerifiedEmail: boolean;
  requiresVerifiedMobile: boolean;
  slug: string;
  startsAt?: string | null;
  status: AdminWheelCampaignStatus;
}

export interface AdminWheelAnalytics {
  campaign: { id: string; name: string; status: string };
  claimedRewards: number;
  estimatedRewardValue: string;
  events: Array<{ _count: { _all: number }; _sum: { revenue?: string | null }; event: string }>;
  funnel: { registrationInitiated: number; spinRate: number; spins: number; uniquePlayers: number; views: number };
  grants: { granted: number; remaining: number };
  prizes: Array<{ id: string; titleFa: string; wins: number }>;
  revenue: number;
}

export function getWheelCampaigns(query: { page?: number; pageSize?: number; search?: string } = {}) {
  return adminApiRequest<{ items: AdminWheelCampaign[]; page: number; pageSize: number; total: number; totalPages: number }>("/admin/wheel/campaigns", { query });
}

export function getWheelCampaign(id: string) {
  return adminApiRequest<AdminWheelCampaign>(`/admin/wheel/campaigns/${id}`);
}

export function createWheelCampaign(input: Record<string, unknown>) {
  return adminApiRequest<AdminWheelCampaign>("/admin/wheel/campaigns", { body: input, method: "POST" });
}

export function updateWheelCampaign(id: string, input: Record<string, unknown>) {
  return adminApiRequest<AdminWheelCampaign>(`/admin/wheel/campaigns/${id}`, { body: input, method: "PATCH" });
}

export function grantWheelSpins(campaignId: string, input: { quantity: number; source?: string; sourceReference?: string; userId: string }) {
  return adminApiRequest(`/admin/wheel/campaigns/${campaignId}/grants`, { body: input, method: "POST" });
}

export function getWheelSpins(campaignId: string, query: { page?: number; pageSize?: number; search?: string } = {}) {
  return adminApiRequest<{ items: Array<{ createdAt: string; id: string; prize: AdminWheelPrize; suspicious: boolean; user: { email?: string | null; id: string; mobile?: string | null } }>; total: number }>(`/admin/wheel/campaigns/${campaignId}/spins`, { query });
}

export function getWheelClaims(query: { page?: number; pageSize?: number; search?: string } = {}) {
  return adminApiRequest<{ items: Array<{ address?: string | null; city?: string | null; createdAt: string; id: string; recipientMobile?: string | null; recipientName?: string | null; reward: { campaign: AdminWheelCampaign; prize: AdminWheelPrize }; status: string; trackingCode?: string | null; user: { email?: string | null; id: string; mobile?: string | null } }>; total: number }>("/admin/wheel/claims", { query });
}

export function updateWheelClaim(id: string, input: { adminNotes?: string; status: string; trackingCode?: string }) {
  return adminApiRequest(`/admin/wheel/claims/${id}`, { body: input, method: "PATCH" });
}

export function getWheelAnalytics(campaignId: string) {
  return adminApiRequest<AdminWheelAnalytics>(`/admin/wheel/campaigns/${campaignId}/analytics`);
}
