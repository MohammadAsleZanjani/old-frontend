import { API_BASE, platformAuth } from "@/shared/auth/platform-auth-client";

export type WheelPrizeType = "PHYSICAL_PRIZE" | "WALLET_CREDIT" | "FIXED_DISCOUNT" | "PERCENTAGE_DISCOUNT" | "EXTRA_SPIN";

export interface PublicWheelPrize {
  descriptionEn?: string | null;
  descriptionFa?: string | null;
  displayOrder: number;
  id: string;
  isJackpot: boolean;
  metadata?: unknown;
  prizeType: WheelPrizeType;
  titleEn: string;
  titleFa: string;
}

export interface PublicWheelCampaign {
  endsAt?: string | null;
  id: string;
  metadata?: unknown;
  name: string;
  prizes: PublicWheelPrize[];
  requiresLogin: boolean;
  slug: string;
  startsAt?: string | null;
}

export interface WheelEligibility {
  campaignId?: string;
  eligible: boolean;
  message: string;
  reasonCode: string;
  spinsRemaining: number;
}

export interface WheelSpinResult {
  replayed: boolean;
  reward: {
    expiresAt?: string | null;
    id: string;
    physicalClaim?: { id: string; status: string } | null;
    prizeType: WheelPrizeType;
    promotionCode?: { code: string } | null;
    status: string;
    value: string;
  };
  selectedSegment: number;
  spinId: string;
  spinToken: string;
  prize: PublicWheelPrize;
}

export interface WheelReward {
  createdAt: string;
  expiresAt?: string | null;
  id: string;
  physicalClaim?: { id: string; status: string; trackingCode?: string | null } | null;
  prize: Pick<PublicWheelPrize, "descriptionEn" | "descriptionFa" | "displayOrder" | "isJackpot" | "titleEn" | "titleFa">;
  prizeType: WheelPrizeType;
  promotionCode?: { code: string; maxDiscountAmount?: string | null; minOrderAmount: string; status: string } | null;
  remainingValue: string;
  status: string;
  value: string;
}

export interface MyWheelRewards {
  rewards: WheelReward[];
  shoppingCredit: {
    balance: string;
    transactions: Array<{ amount: string; balanceAfter: string; createdAt: string; description: string; id: string; type: string }>;
  };
}

export function getActiveWheel() {
  return wheelFetch<{ campaign: PublicWheelCampaign | null }>("/wheel/active");
}

export function getWheelEligibility() {
  return wheelFetch<WheelEligibility>("/wheel/eligibility", { auth: true });
}

export function spinWheel(input: { fingerprint?: string; sessionId?: string }, idempotencyKey: string) {
  return wheelFetch<WheelSpinResult>("/wheel/spin", { auth: true, body: input, headers: { "idempotency-key": idempotencyKey }, method: "POST" });
}

export function getMyWheelRewards() {
  return wheelFetch<MyWheelRewards>("/wheel/my-rewards", { auth: true });
}

export function claimPhysicalReward(rewardId: string, input: Record<string, string>) {
  return wheelFetch(`/wheel/rewards/${rewardId}/redeem`, { auth: true, body: input, method: "POST" });
}

export function trackWheelEvent(event: "WHEEL_VIEWED" | "SPIN_CTA_CLICKED" | "REGISTRATION_INITIATED", campaignId?: string, metadata?: Record<string, unknown>) {
  return wheelFetch("/wheel/events", {
    body: { campaignId, event, metadata, sessionId: getWheelSessionId(), visitorId: getWheelVisitorId() },
    method: "POST",
  });
}

export function trackAuthenticatedWheelEvent(event: "REGISTRATION_COMPLETED", campaignId?: string, metadata?: Record<string, unknown>) {
  return wheelFetch("/wheel/events/authenticated", {
    auth: true,
    body: { campaignId, event, metadata, sessionId: getWheelSessionId(), visitorId: getWheelVisitorId() },
    method: "POST",
  });
}

export function getWheelFingerprint() {
  if (typeof window === "undefined") return undefined;
  const key = "noghre:wheel-fingerprint";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

export function getWheelSessionId() {
  if (typeof window === "undefined") return undefined;
  const key = "noghre:wheel-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.sessionStorage.setItem(key, value);
  return value;
}

function getWheelVisitorId() {
  return getWheelFingerprint();
}

async function wheelFetch<T = unknown>(path: string, init: { auth?: boolean; body?: unknown; headers?: Record<string, string>; method?: string } = {}) {
  const token = init.auth ? platformAuth.getAccessToken() : undefined;
  const response = await fetch(`${API_BASE}${path}`, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    method: init.method ?? "GET",
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const nested = record.message && typeof record.message === "object" ? record.message as Record<string, unknown> : undefined;
    const message = typeof record.message === "string" ? record.message : typeof nested?.message === "string" ? nested.message : `Wheel request failed: ${response.status}`;
    const error = new Error(message) as Error & { code?: string };
    error.code = typeof record.code === "string" ? record.code : typeof nested?.code === "string" ? nested.code : undefined;
    throw error;
  }
  return payload as T;
}
