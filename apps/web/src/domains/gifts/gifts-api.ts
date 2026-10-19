import { API_BASE, fetchWithAuthRefresh } from "@/shared/auth/platform-auth-client";
import { extractApiError } from "@/shared/lib/api-error";

export type GiftType = "SILVER_AMOUNT" | "SILVER_PRODUCT";
export type GiftStatus = "PENDING_REGISTRATION" | "PENDING_KYC" | "AVAILABLE" | "DELIVERY_REQUESTED" | "COMPLETED" | "CANCELLED";

export interface GiftItem {
  cancelledAt?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  deliveryRequest?: { id: string; requestNumber: string; status: string } | null;
  giftNumber: string;
  id: string;
  message?: string | null;
  product?: { id: string; images?: Array<{ url: string }>; slug: string } | null;
  productFeeGrams: string | number;
  productId?: string | null;
  productTitle?: string | null;
  quantity: number;
  recipientMobile: string;
  recipientUser?: { id: string; profile?: { firstName?: string | null; lastName?: string | null } | null } | null;
  reservedSilverGrams: string | number;
  sender?: { id: string; profile?: { firstName?: string | null; lastName?: string | null } | null };
  senderMobile: string;
  silverGrams?: string | number | null;
  status: GiftStatus;
  type: GiftType;
}

export interface GiftOverview {
  kycStatus: string;
  mobile?: string | null;
  mobileVerified: boolean;
  received: GiftItem[];
  sendGiftEnabled: boolean;
  sent: GiftItem[];
  silverBalance: string | number;
}

export interface GiftProduct {
  cover?: string | null;
  id: string;
  images?: Array<{ url: string }>;
  silver?: {
    formFactor?: string | null;
    productFeePercent?: string | number | null;
    stockQuantity?: number | null;
    weightGrams?: string | number | null;
  };
  slug: string;
  stockQuantity?: number | null;
  title: string;
}

export interface CreateGiftInput {
  message?: string;
  productId?: string;
  recipientMobile: string;
  silverGrams?: number;
  type: GiftType;
}

export function getGiftOverview() {
  return giftRequest<GiftOverview>("/gifts/overview");
}

export function getGiftProducts(language = "fa") {
  const query = new URLSearchParams({ language, pageSize: "100" });
  return giftRequest<{ items: GiftProduct[] }>(`/products?${query.toString()}`).then((response) => response.items);
}

export function createGift(input: CreateGiftInput, idempotencyKey: string) {
  return giftRequest<GiftItem>("/gifts", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
    method: "POST",
  });
}

export function cancelGift(id: string) {
  return giftRequest<GiftItem>(`/gifts/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

async function giftRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetchWithAuthRefresh(`${API_BASE}${path}`, init);
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) throw new Error(extractApiError(payload) ?? "انجام درخواست هدیه ناموفق بود.");
  return payload as T;
}
