import { API_BASE, fetchWithAuthRefresh, platformAuth } from "@/shared/auth/platform-auth-client";
import { extractApiError } from "@/shared/lib/api-error";

export type SilverPrice = {
  buyFeePercent: string | number;
  buyPricePerGram: string | number;
  change24h?: string | number;
  deliveryFeeToman: string | number;
  deliveryFeeGrams: string | number;
  deliveryMinGram: string | number;
  minBuyToman: string | number;
  minSellGram: string | number;
  pricePerGram: string | number;
  sellFeePercent: string | number;
  sellPricePerGram: string | number;
  source: string;
  spreadBuyPercent: string | number;
  spreadSellPercent: string | number;
  syncIntervalMinutes: number;
  updatedAt: string;
};

export type MarketQuote = {
  category: string;
  changePercent: number | null;
  high: number | null;
  key: string;
  low: number | null;
  price: number | null;
  title: string;
  updatedAt: string;
};

export async function getMarketOverview() {
  return apiFetch<{
    configured: boolean;
    gold: MarketQuote[];
    goldAvailable: boolean;
    silver: MarketQuote[];
    silverAvailable: boolean;
  }>("/silver/market", false);
}

export async function getMarketHistory(kind: "gold" | "silver", key?: string, days = 30) {
  const params = new URLSearchParams({ days: String(days), kind });
  if (key) params.set("key", key);
  return apiFetch<Array<{
    capturedAt: string;
    high: string | number | null;
    low: string | number | null;
    price: string | number;
    providerKey: string;
    providerUpdatedAt: string | null;
    title: string | null;
  }>>(`/silver/market-history?${params.toString()}`, false);
}

export type Wallet = {
  balance: string | number;
  currency: "TOMAN" | "SILVER_GRAM";
  id: string;
  locked: string | number;
};

export type DashboardOverview = {
  deliveryRequests?: unknown[];
  holding?: { availableGrams?: string | number; lockedGrams?: string | number };
  kyc?: { status?: string } | null;
  price?: SilverPrice;
  recentOrders?: unknown[];
  transactions?: Array<{ amount: string | number; createdAt: string; description: string; id: string; type: string }>;
  wallets?: Wallet[];
};

export async function getSilverPrice() {
  return apiFetch<SilverPrice>("/silver/price", false);
}

export type SilverPricePoint = { buyPricePerGram: string | number; change24h?: string | number; createdAt: string; pricePerGram: string | number; sellPricePerGram: string | number };

export async function getSilverPriceHistory(days = 30) {
  return apiFetch<SilverPricePoint[]>(`/silver/price-history?days=${days}`, false);
}

export async function getSilverOverview() {
  return apiFetch<DashboardOverview>("/silver/overview", true);
}

export interface PostalAddressLookup {
  address: string;
  district?: string;
  floor?: string;
  number?: string;
  postalCode: string;
  province: string;
  street?: string;
}

export async function getPostalAddress(postalCode: string) {
  return apiFetch<PostalAddressLookup>(`/silver/postal-address?code=${encodeURIComponent(postalCode)}`, true);
}

export async function createSilverOrder(type: "BUY" | "SELL", grams: number, gateway: "wallet" | "zarinpal" = "zarinpal") {
  const order = await apiFetch<{ id: string; invoiceId?: string }>("/silver/orders", true, {
    body: JSON.stringify({ grams, paymentMethod: type === "BUY" ? gateway === "wallet" ? "WALLET" : "GATEWAY" : undefined, type }),
    headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    method: "POST",
  });
  if (type === "SELL") return { order };
  if (!order.invoiceId) throw new Error("فاکتور پرداخت سفارش نقره ایجاد نشد.");
  const payment = await apiFetch<{ id: string; paymentUrl?: string | null }>("/payments/request", true, {
    body: JSON.stringify({ gateway, invoiceId: order.invoiceId }),
    headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    method: "POST",
  });
  if (payment.paymentUrl) window.location.assign(payment.paymentUrl);
  return { order, payment };
}

export async function createDeliveryRequest(input: {
  address: string;
  city: string;
  grams: number;
  postalCode: string;
  province?: string;
  userNote?: string;
}) {
  return apiFetch("/silver/delivery", true, {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

async function apiFetch<T>(path: string, authenticated: boolean, init: RequestInit = {}): Promise<T> {
  const response = authenticated
    ? await fetchWithAuthRefresh(`${API_BASE}${path}`, init)
    : await fetch(`${API_BASE}${path}`, { cache: "no-store", ...init });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) throw new Error(readApiError(payload) ?? "درخواست با خطا روبه‌رو شد.");
  return payload as T;
}

function readApiError(payload: unknown) {
  return extractApiError(payload);
}

export function isAuthenticated() {
  return Boolean(platformAuth.getAccessToken());
}
