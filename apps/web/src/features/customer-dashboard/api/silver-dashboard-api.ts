import { API_BASE, fetchWithAuthRefresh } from "@/shared/auth/platform-auth-client";
import { extractApiError } from "@/shared/lib/api-error";

export interface SilverPrice {
  buyFeePercent: number;
  buyPricePerGram: number;
  change24h: number;
  deliveryFeeToman: number;
  deliveryFeeGrams: number;
  deliveryWorkingDays: number;
  deliveryMinGram: number;
  maxWalletTopUpToman: number;
  minBuyToman: number;
  minWalletTopUpToman: number;
  minSellGram: number;
  pricePerGram: number;
  sellFeePercent: number;
  sellPricePerGram: number;
  syncIntervalMinutes: number;
  updatedAt: string;
}

export interface SilverWallet {
  balance: number;
  currency: "SILVER_GRAM" | "TOMAN";
  id: string;
  locked: number;
}

export interface SilverHolding {
  authenticityStatus?: string;
  availableGrams: number;
  certificateNumber?: string;
  lockedGrams: number;
  sealedPackageEligible?: boolean;
}

export interface SilverOrder {
  createdAt: string;
  grams: number;
  id: string;
  invoiceId?: string;
  orderNumber: string;
  paymentMethod?: "GATEWAY" | "WALLET";
  pricePerGram: number;
  status: string;
  totalToman: number;
  type: "BUY" | "SELL";
}

export interface SilverTransaction {
  amount: number;
  balanceAfter?: number;
  createdAt: string;
  description: string;
  id: string;
  reference?: string;
  status?: string;
  type: string;
  wallet?: Pick<SilverWallet, "currency" | "id">;
  walletId?: string;
}

export type SilverTransactionType = "DEPOSIT" | "WITHDRAW" | "BUY" | "SELL" | "FEE" | "ADJUSTMENT" | "DELIVERY" | "PROMOTION" | "REFERRAL" | "GIFT";

export interface SilverTransactionList {
  items: SilverTransaction[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DeliveryRequest {
  address?: string;
  branchCode?: string;
  createdAt?: string;
  method?: "BRANCH_PICKUP" | "POSTAL_DELIVERY";
  deliveryFeeGrams?: number;
  estimatedAt?: string;
  grams?: number;
  productFeeGrams?: number;
  productId?: string;
  productSku?: string;
  productTitle?: string;
  quantity?: number;
  id: string;
  requestNumber: string;
  requestedAt: string;
  source?: "PHYSICAL_REQUEST" | "PRODUCT_ORDER";
  status: string;
}

export interface KycProfile {
  createdAt: string;
  firstName?: string;
  id: string;
  idCardNo?: string;
  lastName?: string;
  nationalCode?: string;
  status: string;
}

export interface UserBankAccount {
  accountNumber?: string | null;
  accountStatus?: string | null;
  accountType?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  cardNumber?: string | null;
  createdAt: string;
  iban: string;
  id: string;
  isVerified: boolean;
  lastUsedAt?: string | null;
  ownerName?: string | null;
  provider?: string;
  verificationReference?: string | null;
  verifiedAt?: string | null;
}

export type TomanWithdrawalStatus = "PENDING_REVIEW" | "APPROVED" | "PROCESSING" | "PAID" | "REJECTED" | "CANCELLED" | "FAILED";

export interface TomanWithdrawal {
  adminNote?: string | null;
  amount: number;
  approvedAt?: string | null;
  bankAccount: Pick<UserBankAccount, "accountNumber" | "bankName" | "cardNumber" | "iban" | "id" | "ownerName" | "verificationReference" | "verifiedAt">;
  bankAccountId: string;
  cancelledAt?: string | null;
  createdAt: string;
  failedAt?: string | null;
  feeAmount: number;
  id: string;
  netAmount: number;
  processingAt?: string | null;
  provider?: string;
  providerTrackingCode?: string | null;
  providerTransferId?: string | null;
  rejectionReason?: string | null;
  requestNumber: string;
  status: TomanWithdrawalStatus;
  transferredAt?: string | null;
  updatedAt: string;
  userNote?: string | null;
}

export interface TomanWithdrawalList {
  items: TomanWithdrawal[];
  page: number;
  pageSize: number;
  summary: Partial<Record<TomanWithdrawalStatus, { amount: number; count: number }>>;
  total: number;
  totalPages: number;
}

export interface SilverOverview {
  deliveryReceiver: { mobile: string; mobileVerified: boolean; name: string };
  deliveryRequests: DeliveryRequest[];
  holding: SilverHolding;
  kyc: KycProfile | null;
  price: SilverPrice;
  recentOrders: SilverOrder[];
  referralFeeCredit: { balance: string; currency: "TOMAN"; feeOnly: true; withdrawable: false };
  transactions: SilverTransaction[];
  wallets: SilverWallet[];
}

export function getSilverOverview() {
  return silverRequest<SilverOverview>("/silver/overview");
}

export function getSilverTransactions(query: { page?: number; pageSize?: number; search?: string; status?: string; type?: SilverTransactionType } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const suffix = params.toString();
  return silverRequest<SilverTransactionList>(`/silver/transactions${suffix ? `?${suffix}` : ""}`);
}

export function createSilverOrder(input: { grams: number; paymentMethod?: "GATEWAY" | "WALLET"; referralClickId?: string; referralCode?: string; type: "BUY" | "SELL" }, idempotencyKey?: string) {
  return silverRequest<SilverOrder>("/silver/orders", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json", ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}) },
    method: "POST",
  });
}

export function createDeliveryRequest(input: {
  address: string;
  city: string;
  giftId?: string;
  postalCode: string;
  productId: string;
  province?: string;
  quantity?: number;
}) {
  return silverRequest<DeliveryRequest>("/silver/delivery", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

export function createTomanWalletTopUp(input: { amount: number }) {
  return silverRequest<{ id: string; paymentNumber: string; paymentUrl?: string | null; status: string }>("/wallet/top-ups", {
    body: JSON.stringify({ ...input, gateway: "zarinpal" }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

export function submitKycProfile(input: { birthDateJalali?: string; firstName: string; lastName: string; nationalId: string }) {
  return silverRequest<KycProfile>("/silver/kyc", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

export function getBankAccounts() {
  return silverRequest<UserBankAccount[]>("/silver/bank-accounts");
}

export function createBankAccount(input: { birthDate?: string; iban: string }) {
  return silverRequest<UserBankAccount>("/silver/bank-accounts", { body: JSON.stringify(input), headers: { "content-type": "application/json" }, method: "POST" });
}

export function deleteBankAccount(id: string) {
  return silverRequest<{ deleted: boolean }>(`/silver/bank-accounts/${id}`, { method: "DELETE" });
}

export function getTomanWithdrawals() {
  return silverRequest<TomanWithdrawalList>("/silver/withdrawals?page=1&pageSize=20");
}

export function createTomanWithdrawal(input: { amount: number; bankAccountId: string; userNote?: string }) {
  return silverRequest<TomanWithdrawal>("/silver/withdrawals", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    method: "POST",
  });
}

export function cancelTomanWithdrawal(id: string) {
  return silverRequest<TomanWithdrawal>(`/silver/withdrawals/${id}/cancel`, { method: "POST" });
}

async function silverRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetchWithAuthRefresh(`${API_BASE}${path}`, init);
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) throw new Error(readApiError(payload) ?? "درخواست با خطا روبه‌رو شد.");
  return payload as T;
}

function readApiError(payload: unknown) {
  return extractApiError(payload);
}
