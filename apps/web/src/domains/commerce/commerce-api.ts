import { translateUiText } from "@/shared/i18n/ui-copy";
import { fetchWithAuthRefresh } from "@/shared/auth/platform-auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";

export interface CommerceRequestOptions {
  accessToken?: string;
  idempotencyKey?: string;
}

export interface AddCartItemInput {
  productId?: string;
  productSlug?: string;
  quantity?: number;
}

export interface CartItem {
  createdAt: string;
  currency: string;
  id: string;
  product: {
    id: string;
    images?: Array<{ url: string }>;
    shortDescription?: string | null;
    slug: string;
    stockQuantity: number;
    title: Record<string, string> | string;
  };
  productId: string;
  quantity: number;
  unitPrice: string;
  metadata?: {
    basePricePerGram?: string;
    buyPricePerGram?: string;
    productFeeAmount?: string;
    productFeeAmountTotal?: string;
    productFeePercent?: string;
    insuranceAmount?: string;
    insuranceAmountTotal?: string;
    insurancePercent?: string;
    makingFeeToman?: string;
    makingFeeTomanTotal?: string;
    metalAmount?: string;
    metalAmountTotal?: string;
    quantity?: number;
    silverFeeAmount?: string;
    silverFeeAmountTotal?: string;
    silverFeePercent?: string;
    totalForQuantity?: string;
    weightGrams?: string;
    weightGramsTotal?: string;
  };
}

export interface CartSummary {
  currency: string;
  id: string;
  items: CartItem[];
  status: string;
  subtotal: string;
  shoppingCredit?: {
    balance: string;
    currency: "TOMAN";
    purchaseOnly: boolean;
    withdrawable: boolean;
  };
  walletBalances?: {
    silverGrams: string;
    toman: string;
  };
  total: string;
  delivery?: {
    feeGrams: string;
    feeGramsPerUnit: string;
    feeToman: string;
    feeTomanPerUnit: string;
    paidFromSilverWallet: boolean;
    paidFromTomanWallet: boolean;
    source: "REFERRAL_FEE_CREDIT" | "SILVER_WALLET" | "TOMAN_WALLET" | "ORDER_PAYMENT" | "NONE";
    silverBalance: string;
    tomanBalance: string;
    unitCount: number;
  };
  deliveryAddress?: {
    city: string;
    country: string;
    id: string;
    isDefault: boolean;
    label: string;
    line1: string;
    line2?: string | null;
    phone?: string | null;
    postalCode?: string | null;
    province?: string | null;
    recipient?: string | null;
  } | null;
  updatedAt: string;
}

export interface CheckoutOrder {
  currency: string;
  id: string;
  invoices: Array<{ id: string; invoiceNumber: string; status: string; total: string }>;
  orderNumber: string;
  status: string;
  total: string;
}

export interface PromotionQuote {
  code: string;
  currency: string;
  discountAmount: string;
  event?: { endsAt: string; id: string; startsAt: string; title: string } | null;
  expiresAt?: string | null;
  name: string;
  rewardType: "ORDER_FIXED" | "ORDER_PERCENT" | "SILVER_WALLET" | "TOMAN_WALLET";
  subtotal: string;
  totalAfterDiscount: string;
  value: string;
  walletCreditAmount: string;
  walletCreditCurrency?: "SILVER_GRAM" | "TOMAN" | null;
}

export interface RequestPaymentInput {
  gateway?: "silver-wallet" | "wallet" | "zarinpal";
  invoiceId: string;
}

export interface PaymentRequestResult {
  id: string;
  paymentNumber: string;
  paymentUrl?: string | null;
  status: string;
}

export interface ProductOrder {
  createdAt: string;
  currency: string;
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  _count?: { items: number; payments: number };
}

export async function getProductOrders(options: CommerceRequestOptions = {}) {
  const response = await commerceFetch<
    | { items: ProductOrder[]; page?: number; pageSize?: number; total?: number; totalPages?: number }
    | { data: ProductOrder[]; meta?: { page?: number; pageSize?: number; total?: number; totalPages?: number } }
  >("/orders?page=1&pageSize=50", { accessToken: options.accessToken });
  if ("items" in response) return response;
  return {
    items: response.data ?? [],
    page: response.meta?.page,
    pageSize: response.meta?.pageSize,
    total: response.meta?.total,
    totalPages: response.meta?.totalPages,
  };
}

export function getCart(options: CommerceRequestOptions = {}) {
  return commerceFetch<CartSummary>("/cart", { accessToken: options.accessToken });
}

export function addCartItem(input: AddCartItemInput, options: CommerceRequestOptions = {}) {
  return commerceFetch<CartSummary>("/cart/items", {
    accessToken: options.accessToken,
    body: input,
    method: "POST",
  });
}

export function updateCartItem(itemId: string, quantity: number, options: CommerceRequestOptions = {}) {
  return commerceFetch<CartSummary>(`/cart/items/${itemId}`, {
    accessToken: options.accessToken,
    body: { quantity },
    method: "PATCH",
  });
}

export function checkout(options: CommerceRequestOptions & { promotionCode?: string; referralClickId?: string; referralCode?: string; useShoppingCredit?: boolean } = {}) {
  return commerceFetch<CheckoutOrder>("/checkout", {
    accessToken: options.accessToken,
    body: {
      referralClickId: options.referralClickId,
      referralCode: options.referralCode,
      promotionCode: options.promotionCode,
      useShoppingCredit: options.useShoppingCredit,
    },
    headers: options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : undefined,
    method: "POST",
  });
}

export function validatePromotionCode(code: string, options: CommerceRequestOptions = {}) {
  return commerceFetch<PromotionQuote>("/promotions/validate", {
    accessToken: options.accessToken,
    body: { code },
    method: "POST",
  });
}

export function requestPayment(input: RequestPaymentInput, options: CommerceRequestOptions = {}) {
  return commerceFetch<PaymentRequestResult>("/payments/request", {
    accessToken: options.accessToken,
    body: input,
    headers: options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : undefined,
    method: "POST",
  });
}

async function commerceFetch<T = unknown>(path: string, init: { accessToken?: string; body?: unknown; headers?: Record<string, string>; method?: string } = {}) {
  const response = await fetchWithAuthRefresh(`${API_BASE}${path}`, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    method: init.method ?? "GET",
  }, { accessToken: init.accessToken });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = readApiError(payload) ?? `Commerce request failed: ${response.status}`;
    throw new Error(translateUiText(message, getStoredLanguage()));
  }
  return payload as T;
}

function getStoredLanguage() {
  if (typeof window === "undefined") return "fa";
  return window.localStorage.getItem("lang") ?? "fa";
}

function readApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? ((record.error && typeof record.error === "object") ? (record.error as Record<string, unknown>).message : undefined);
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(", ");
  return undefined;
}
