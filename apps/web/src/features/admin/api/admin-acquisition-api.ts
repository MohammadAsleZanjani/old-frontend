import { adminApiRequest } from "./admin-api-request";

export type AcquisitionCampaignStatus = "ACTIVE" | "DRAFT" | "ENDED" | "PAUSED";
export type AcquisitionPartnerStatus = "ACTIVE" | "ARCHIVED" | "PAUSED";
export type AcquisitionPublicationStatus = "CANCELLED" | "PLANNED" | "PUBLISHED" | "READY";
export type AcquisitionRewardType = "SHOPPING_CREDIT" | "TOMAN_WALLET";

export interface AcquisitionCampaign {
  _count: { attributions: number; clicks: number; partners: number; rewards: number };
  attributionWindowDays: number;
  createdAt: string;
  currency: string;
  distributedAmount: string;
  endsAt?: string | null;
  id: string;
  maxBudget: string;
  maxRewards: number;
  name: string;
  newUsersOnly: boolean;
  qualificationWindowDays: number;
  requiresKyc: boolean;
  rewardAmount: string;
  rewardedCount: number;
  rewardType: AcquisitionRewardType;
  slug: string;
  startsAt?: string | null;
  status: AcquisitionCampaignStatus;
  termsFa?: string | null;
  updatedAt: string;
}

export interface AcquisitionPublication {
  contentUrl?: string | null;
  id: string;
  notes?: string | null;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  sequence: number;
  status: AcquisitionPublicationStatus;
}

export interface AcquisitionCampaignPartner {
  adType?: string | null;
  campaignId: string;
  clicksCount: number;
  code: string;
  id: string;
  kycApprovedCount: number;
  partner: {
    id: string;
    instagramHandle?: string | null;
    metadata?: { incomplete?: boolean; sourceRow?: number } | null;
    name: string;
    status: AcquisitionPartnerStatus;
  };
  publications: AcquisitionPublication[];
  registrationsCount: number;
  rewardsCount: number;
  status: AcquisitionPartnerStatus;
}

export interface AcquisitionReport {
  campaign: AcquisitionCampaign;
  funnel: {
    clickToRegistrationRate: number;
    clicks: number;
    kycApproved: number;
    kycToRewardRate: number;
    registered: number;
    registrationToKycRate: number;
    registrationToRewardRate: number;
    rejected: number;
    rewarded: number;
  };
  partners: AcquisitionCampaignPartner[];
}

export interface AcquisitionCampaignInput {
  attributionWindowDays: number;
  endsAt?: string | null;
  maxBudget: number;
  maxRewards: number;
  name: string;
  newUsersOnly: boolean;
  qualificationWindowDays: number;
  requiresKyc: boolean;
  rewardAmount: number;
  rewardType: AcquisitionRewardType;
  startsAt?: string | null;
  status?: AcquisitionCampaignStatus;
  termsFa?: string | null;
}

export function getAcquisitionCampaigns() {
  return adminApiRequest<AcquisitionCampaign[]>("/admin/acquisition/campaigns");
}

export function getAcquisitionPartners(campaignId: string, search?: string, page = 1, pageSize = 100) {
  return adminApiRequest<{ data: AcquisitionCampaignPartner[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>("/admin/acquisition/partners", {
    query: { campaignId, page, pageSize, search },
  });
}

export function getAcquisitionReport(campaignId: string) {
  return adminApiRequest<AcquisitionReport>(`/admin/acquisition/campaigns/${campaignId}/report`);
}

export function reconcileAcquisitionCampaign(campaignId: string) {
  return adminApiRequest<{ credited: number; scannedUsers: number }>(`/admin/acquisition/campaigns/${campaignId}/reconcile`, { method: "POST" });
}

export function updateAcquisitionCampaign(id: string, input: Partial<AcquisitionCampaignInput>) {
  return adminApiRequest<AcquisitionCampaign>(`/admin/acquisition/campaigns/${id}`, { body: input, method: "PATCH" });
}

export function createAcquisitionPartner(input: { adType?: string; campaignId: string; code?: string; instagramHandle?: string; name: string }) {
  return adminApiRequest<AcquisitionCampaignPartner>("/admin/acquisition/partners", { body: input, method: "POST" });
}

export function updateAcquisitionPartner(id: string, input: { adType?: string | null; code?: string; instagramHandle?: string | null; name?: string; status?: AcquisitionPartnerStatus }) {
  return adminApiRequest<AcquisitionCampaignPartner>(`/admin/acquisition/partners/${id}`, { body: input, method: "PATCH" });
}

export function updateAcquisitionPublication(id: string, input: { contentUrl?: string | null; notes?: string | null; publishedAt?: string | null; scheduledAt?: string | null; status?: AcquisitionPublicationStatus }) {
  return adminApiRequest<AcquisitionPublication>(`/admin/acquisition/publications/${id}`, { body: input, method: "PATCH" });
}
