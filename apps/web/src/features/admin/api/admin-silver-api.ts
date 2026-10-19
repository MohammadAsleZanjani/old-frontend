import { adminApiRequest } from "./admin-api-request";

export interface AdminSilverPrice {
  buyFeePercent: string;
  buyPricePerGram: string;
  change24h: string;
  deliveryFeeGrams: string;
  deliveryFeeToman: string;
  deliveryMinGram: string;
  minBuyToman: string;
  minSellGram: string;
  pricePerGram: string;
  sellFeePercent: string;
  sellPricePerGram: string;
  syncIntervalMinutes: number;
  updatedAt: string;
}

export interface AdminSilverSettings {
  fees: {
    buyFeePercent: string;
    deliveryFeeToman: string;
    sellFeePercent: string;
  };
  price: {
    deliveryMinGram: string;
    deliveryWorkingDays: string;
    minBuyToman: string;
    minSellGram: string;
    spreadBuyPercent: string;
    spreadSellPercent: string;
    syncIntervalMinutes: string;
  };
}

export interface AdminSilverOrder {
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  feeAmount: string;
  grams: string;
  grossAmount: string;
  id: string;
  invoice?: { id: string; invoiceNumber: string; status: string } | null;
  orderNumber: string;
  payment?: AdminSilverOrderPayment | null;
  paymentMethod?: "GATEWAY" | "WALLET";
  payments: AdminSilverOrderPayment[];
  pricePerGram: string;
  rejectionReason?: string | null;
  status: string;
  totalToman: string;
  transactions: Array<{
    amount: string;
    balanceAfter: string;
    createdAt: string;
    description: string;
    id: string;
    status: string;
    type: string;
    wallet: { currency: "SILVER_GRAM" | "TOMAN" };
  }>;
  transactionAt: string;
  transactionReference?: string | null;
  type: "BUY" | "SELL";
  updatedAt: string;
  user: WalletUserOption;
}

export interface AdminSilverOrderPayment {
  amount: string;
  authority?: string | null;
  cardPan?: string | null;
  createdAt: string;
  failedAt?: string | null;
  failureReason?: string | null;
  gateway: string;
  id: string;
  paidAt?: string | null;
  paymentNumber: string;
  referenceId?: string | null;
  requestedAt?: string | null;
  status: string;
  transactionId?: string | null;
  verifiedAt?: string | null;
}

export interface WalletAdjustmentInput {
  amount: number;
  currency: "SILVER_GRAM" | "TOMAN";
  description: string;
  userId: string;
  direction: "INCREASE" | "DECREASE";
}

export interface WalletUserOption {
  email?: string | null;
  id: string;
  mobile?: string | null;
  profile?: { firstName?: string | null; idCardNo?: string | null; lastName?: string | null } | null;
}

export interface AdminSilverHolding {
  availableGrams: string;
  createdAt: string;
  id: string;
  lockedGrams: string;
  totalGrams: string;
  updatedAt: string;
  user: WalletUserOption;
  userId: string;
}

export interface AdminSilverHoldingList {
  items: AdminSilverHolding[];
  page: number;
  pageSize: number;
  summary: {
    todayPurchasedGrams: string;
    totalDeliveredGrams: string;
    totalPurchasedGrams: string;
  };
  total: number;
  totalPages: number;
}

export interface AdminSilverHoldingQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}

export interface AdminWalletAdjustment {
  amount: string;
  balanceAfter: string;
  createdAt: string;
  createdById?: string | null;
  description: string;
  id: string;
  reference?: string | null;
  status: string;
  user: WalletUserOption;
  wallet: {
    balance: string;
    currency: "SILVER_GRAM" | "TOMAN";
    id: string;
  };
}

export interface AdminWalletAdjustmentList {
  items: AdminWalletAdjustment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminWalletAdjustmentQuery {
  currency?: "SILVER_GRAM" | "TOMAN";
  direction?: "INCREASE" | "DECREASE";
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

export const walletTransactionTypes = ["DEPOSIT", "WITHDRAW", "BUY", "SELL", "FEE", "ADJUSTMENT", "DELIVERY", "PROMOTION", "REFERRAL", "GIFT"] as const;

export type AdminWalletTransactionType = (typeof walletTransactionTypes)[number];
export type AdminWalletCurrency = "SILVER_GRAM" | "TOMAN";
export type AdminWalletTransactionDirection = "DECREASE" | "INCREASE";

export interface AdminWalletTransaction {
  amount: string;
  balanceAfter: string;
  balanceBefore: string;
  createdAt: string;
  createdById?: string | null;
  description: string;
  direction: AdminWalletTransactionDirection;
  id: string;
  metadata?: unknown;
  orderId?: string | null;
  paymentId?: string | null;
  reference?: string | null;
  status: string;
  type: AdminWalletTransactionType;
  user: WalletUserOption;
  userId: string;
  wallet: {
    balance: string;
    currency: AdminWalletCurrency;
    id: string;
    locked: string;
  };
  walletId: string;
}

export interface AdminWalletTransactionList {
  items: AdminWalletTransaction[];
  page: number;
  pageSize: number;
  summary: {
    decreases: number;
    increases: number;
    total: number;
    types: Partial<Record<AdminWalletTransactionType, number>>;
  };
  total: number;
  totalPages: number;
}

export interface AdminWalletTransactionQuery {
  currency?: AdminWalletCurrency;
  direction?: AdminWalletTransactionDirection;
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  type?: AdminWalletTransactionType;
  userId?: string;
}

export interface AdminWalletTransactionDetail extends AdminWalletTransaction {
  acquisitionReward?: Record<string, unknown> | null;
  createdBy?: WalletUserOption | null;
  gift?: Record<string, unknown> | null;
  order?: Record<string, unknown> | null;
  payment?: Record<string, unknown> | null;
  promotionRedemption?: Record<string, unknown> | null;
  referralKycReward?: Record<string, unknown> | null;
  referralReward?: Record<string, unknown> | null;
  tomanWithdrawal?: Record<string, unknown> | null;
}

export type AdminTomanWithdrawalStatus = "PENDING_REVIEW" | "APPROVED" | "PROCESSING" | "PAID" | "REJECTED" | "CANCELLED" | "FAILED";

export interface AdminTomanWithdrawal {
  adminNote?: string | null;
  amount: string;
  approvedAt?: string | null;
  bankAccount: {
    accountNumber?: string | null;
    bankName?: string | null;
    cardNumber?: string | null;
    iban: string;
    id: string;
    ownerName?: string | null;
    verificationReference?: string | null;
    verifiedAt?: string | null;
  };
  createdAt: string;
  feeAmount: string;
  id: string;
  netAmount: string;
  provider: string;
  providerTrackingCode?: string | null;
  providerTransferId?: string | null;
  rejectionReason?: string | null;
  requestNumber: string;
  reviewedAt?: string | null;
  status: AdminTomanWithdrawalStatus;
  transferredAt?: string | null;
  updatedAt: string;
  user: WalletUserOption;
  userNote?: string | null;
}

export interface AdminTomanWithdrawalList {
  items: AdminTomanWithdrawal[];
  page: number;
  pageSize: number;
  summary: Partial<Record<AdminTomanWithdrawalStatus, { amount: string; count: number }>>;
  total: number;
  totalPages: number;
}

export interface AdminTomanWithdrawalQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: AdminTomanWithdrawalStatus;
  userId?: string;
}

export interface ReviewAdminTomanWithdrawalInput {
  action: "APPROVE" | "REJECT" | "MARK_PROCESSING" | "MARK_PAID" | "MARK_FAILED";
  adminNote?: string;
  provider?: string;
  providerTrackingCode?: string;
  providerTransferId?: string;
  rejectionReason?: string;
}

export interface AdminManualTomanWithdrawalOptions {
  availableBalance: string;
  bankAccounts: Array<{
    accountNumber?: string | null;
    bankName?: string | null;
    cardNumber?: string | null;
    iban: string;
    id: string;
    ownerName?: string | null;
    verifiedAt?: string | null;
  }>;
  kycStatus: "APPROVED" | "NOT_STARTED" | "PENDING" | "REJECTED";
  lockedBalance: string;
  minimumAmount: number;
  user: WalletUserOption;
}

export interface CreateAdminTomanWithdrawalInput {
  adminNote: string;
  amount: number;
  bankAccountId: string;
  userId: string;
}

export function getAdminSilverPrice() {
  return adminApiRequest<AdminSilverPrice>("/admin/silver/price");
}

export function updateAdminSilverPrice(input: { buyPricePerGram: number; change24h?: number; pricePerGram: number; sellPricePerGram: number; source?: string }) {
  return adminApiRequest<AdminSilverPrice>("/admin/silver/price", { body: input, method: "POST" });
}

export function getAdminSilverSettings() {
  return adminApiRequest<AdminSilverSettings>("/admin/silver/settings");
}

export function updateAdminSilverSettings(input: Record<string, number>) {
  return adminApiRequest<AdminSilverSettings>("/admin/silver/settings", { body: input, method: "PATCH" });
}

export function getAdminSilverOrder(orderId: string) {
  return adminApiRequest<AdminSilverOrder>(`/admin/silver/orders/${orderId}`);
}

export function getAdminSilverHoldings(query: AdminSilverHoldingQuery) {
  return adminApiRequest<AdminSilverHoldingList>("/admin/silver/holdings", { query });
}

export function createAdminWalletAdjustment(input: WalletAdjustmentInput) {
  return adminApiRequest("/admin/silver/wallet-adjustments", { body: input, method: "POST" });
}

export function getAdminWalletAdjustments(query: AdminWalletAdjustmentQuery) {
  return adminApiRequest<AdminWalletAdjustmentList>("/admin/silver/wallet-adjustments", { query });
}

export function getAdminWalletTransactions(query: AdminWalletTransactionQuery) {
  return adminApiRequest<AdminWalletTransactionList>("/admin/silver/transactions", { query });
}

export function getAdminWalletTransaction(transactionId: string) {
  return adminApiRequest<AdminWalletTransactionDetail>(`/admin/silver/transactions/${transactionId}`);
}

export function searchWalletUsers(search: string) {
  return adminApiRequest<{ items: WalletUserOption[] }>(`/admin/silver/wallet-user-options?search=${encodeURIComponent(search)}&pageSize=20`);
}

export function getAdminTomanWithdrawals(query: AdminTomanWithdrawalQuery) {
  return adminApiRequest<AdminTomanWithdrawalList>("/admin/silver/toman-withdrawals", { query });
}

export function getAdminManualTomanWithdrawalOptions(userId: string) {
  return adminApiRequest<AdminManualTomanWithdrawalOptions>(`/admin/silver/toman-withdrawals/manual-options/${encodeURIComponent(userId)}`);
}

export function createAdminManualTomanWithdrawal(input: CreateAdminTomanWithdrawalInput, idempotencyKey: string) {
  return adminApiRequest<AdminTomanWithdrawal>("/admin/silver/toman-withdrawals/manual", {
    body: input,
    headers: { "idempotency-key": idempotencyKey },
    method: "POST",
  });
}

export function reviewAdminTomanWithdrawal(id: string, input: ReviewAdminTomanWithdrawalInput) {
  return adminApiRequest<AdminTomanWithdrawal>(`/admin/silver/toman-withdrawals/${id}`, { body: input, method: "PATCH" });
}
