const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";

export interface ReferralRequestOptions {
  accessToken?: string;
}

export interface TrackReferralInput {
  code: string;
  landingPath?: string;
  utm?: Record<string, string>;
  visitorId?: string;
}

export interface CreateReferralCodeInput {
  label: string;
  targetPath?: string;
}

export interface RequestReferralPayoutInput {
  accountDetails?: Record<string, unknown>;
  amount: number;
  bankAccountId?: string;
  currency?: string;
  method?: string;
}

export function trackReferral(input: TrackReferralInput) {
  const { code, ...body } = input;
  return referralsFetch(`/referrals/track/${encodeURIComponent(code)}`, { body, method: "POST" });
}

export function getReferralDashboard(options: ReferralRequestOptions = {}) {
  return referralsFetch("/referrals/dashboard", { accessToken: options.accessToken });
}

export function createReferralCode(input: CreateReferralCodeInput, options: ReferralRequestOptions = {}) {
  return referralsFetch("/referrals/codes", { accessToken: options.accessToken, body: input, method: "POST" });
}

export function getReferralMaterials(options: ReferralRequestOptions = {}) {
  return referralsFetch("/referrals/marketing-materials", { accessToken: options.accessToken });
}

export function getReferredUsers(params: ReferralListParams = {}, options: ReferralRequestOptions = {}) {
  return referralsFetch(`/referrals/referred-users${toQuery(params)}`, { accessToken: options.accessToken });
}

export function getReferralCommissions(params: ReferralListParams = {}, options: ReferralRequestOptions = {}) {
  return referralsFetch(`/referrals/commissions${toQuery(params)}`, { accessToken: options.accessToken });
}

export function getReferralPayouts(params: ReferralListParams = {}, options: ReferralRequestOptions = {}) {
  return referralsFetch(`/referrals/payouts${toQuery(params)}`, { accessToken: options.accessToken });
}

export interface ReferralListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

export function requestReferralPayout(input: RequestReferralPayoutInput, options: ReferralRequestOptions = {}) {
  return referralsFetch("/referrals/payouts", { accessToken: options.accessToken, body: input, method: "POST" });
}

async function referralsFetch(path: string, init: { accessToken?: string; body?: unknown; method?: string } = {}) {
  const token = init.accessToken ?? getStoredAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: init.method ?? "GET",
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(readApiError(payload) ?? `Referral request failed: ${response.status}`);
  }
  return payload;
}

function getStoredAccessToken() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("setayesh:accessToken") ?? window.localStorage.getItem("accessToken") ?? undefined;
}

function readApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? ((record.error && typeof record.error === "object") ? (record.error as Record<string, unknown>).message : undefined);
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(", ");
  return undefined;
}

function toQuery(params: ReferralListParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}
