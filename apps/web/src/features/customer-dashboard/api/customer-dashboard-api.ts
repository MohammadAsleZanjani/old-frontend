import { extractApiError } from "@/shared/lib/api-error";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";

export interface CustomerDashboardOverview {
  alerts: Array<{ label: string; severity: "critical" | "info" | "success" | "warning"; value: number }>;
  kpis: Array<{ label: string; meta: string; value: number }>;
  notifications: Array<{ actionUrl?: string | null; body: string; createdAt: string; id: string; status: string; title: string }>;
  profile: {
    name: string;
    email?: string;
    locale: string;
    status?: string;
  };
  recent: {
    downloads: Array<{ createdAt: string; id: string; product: { slug: string; title: string } }>;
    invoices: Array<{ balanceDue: string; createdAt: string; currency: string; id: string; invoiceNumber: string; status: string; total: string }>;
    orders: Array<{ createdAt: string; currency: string; id: string; orderNumber: string; status: string; total: string; _count: { items: number; payments: number } }>;
    payments: Array<{ amount: string; createdAt: string; currency: string; id: string; paymentNumber: string; status: string }>;
    tickets: Array<{ createdAt: string; id: string; priority: string; status: string; subject: string; ticketNumber: string; updatedAt: string }>;
  };
  referral: null | {
    balance: number;
    code: string;
    codes: Array<{ code: string; id: string; label?: string | null; targetPath: string }>;
    currency: string;
    paidBalance: number;
    pendingBalance: number;
    status: string;
  };
}

export interface CustomerPaymentDetail {
  amount: string;
  callbackUrl?: string | null;
  createdAt: string;
  currency: string;
  failureReason?: string | null;
  gateway: string;
  id: string;
  invoice?: { balanceDue: string; id: string; invoiceNumber: string; status: string; total: string } | null;
  logs: Array<{ createdAt: string; error?: string | null; gateway: string; id: string; status?: string | null; type: string }>;
  order?: { id: string; orderNumber: string; status: string } | null;
  paymentNumber: string;
  paymentUrl?: string | null;
  referenceId?: string | null;
  status: string;
  transactionId?: string | null;
  updatedAt: string;
  verifiedAt?: string | null;
}

export interface CustomerListPage<T> {
  items: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface CustomerOrderDetail {
  completedAt?: string | null;
  createdAt: string;
  currency: string;
  discount?: string;
  id: string;
  invoices: Array<{ balanceDue: string; createdAt: string; currency: string; discount?: string; id: string; invoiceNumber: string; items: CustomerInvoiceItem[]; paidAt?: string | null; status: string; subtotal?: string; tax?: string; total: string; updatedAt?: string }>;
  items: Array<{ currency: string; id: string; metadata?: Record<string, unknown> | null; product?: { id: string; slug: string; title: string } | null; quantity: number; sku?: string | null; title: string; total: string; unitPrice: string }>;
  metadata?: Record<string, unknown> | null;
  orderNumber: string;
  paidAt?: string | null;
  payments: Array<{ amount: string; createdAt: string; currency: string; gateway?: string; id: string; metadata?: Record<string, unknown> | null; paidAt?: string | null; paymentNumber: string; referenceId?: string | null; status: string; transactionId?: string | null; updatedAt?: string; verifiedAt?: string | null }>;
  refunds: Array<{ amount: string; createdAt: string; currency: string; id: string; refundNumber: string; status: string }>;
  status: string;
  subtotal: string;
  tax?: string;
  total: string;
  updatedAt: string;
}

export interface CustomerInvoiceDetail {
  balanceDue: string;
  createdAt: string;
  currency: string;
  discount?: string;
  dueAt?: string | null;
  id: string;
  invoiceNumber: string;
  items: CustomerInvoiceItem[];
  order?: { id: string; orderNumber: string; status: string } | null;
  paidAt?: string | null;
  payments: Array<{ amount: string; createdAt: string; currency: string; id: string; paymentNumber: string; status: string }>;
  refunds: Array<{ amount: string; createdAt: string; currency: string; id: string; refundNumber: string; status: string }>;
  status: string;
  subtotal: string;
  tax?: string;
  total: string;
  updatedAt: string;
  user?: {
    addresses?: Array<{
      city: string;
      country: string;
      id?: string;
      isDefault?: boolean;
      label: string;
      line1: string;
      line2?: string | null;
      phone?: string | null;
      postalCode?: string | null;
      province?: string | null;
      recipient?: string | null;
    }>;
    companyProfile?: { billingEmail?: string | null; companyName?: string | null; registrationNo?: string | null; taxId?: string | null } | null;
    email?: string | null;
    id: string;
    mobile?: string | null;
    profile?: { firstName?: string | null; idCardNo?: string | null; lastName?: string | null } | null;
  } | null;
}

export interface CustomerOrderListItem {
  _count?: { items?: number; payments?: number };
  createdAt: string;
  currency: string;
  id: string;
  orderNumber: string;
  status: string;
  total: string;
}

export interface CustomerInvoiceListItem {
  balanceDue: string;
  createdAt: string;
  currency: string;
  id: string;
  invoiceNumber: string;
  order?: { id: string; orderNumber: string } | null;
  status: string;
  total: string;
  type?: string;
}

export interface CustomerPaymentListItem {
  amount: string;
  createdAt: string;
  currency: string;
  gateway?: string;
  id: string;
  paymentNumber: string;
  status: string;
}

export interface CustomerRefundListItem {
  amount: string;
  createdAt: string;
  currency: string;
  id: string;
  payment?: { id: string; paymentNumber: string } | null;
  reason?: string | null;
  refundNumber: string;
  status: string;
}

export interface CustomerBalanceItem {
  balance: string;
  createdAt: string;
  currency: string;
  id: string;
  lifetimeSpent: string;
  totalPaid: string;
  totalRefunded: string;
  updatedAt: string;
}

export interface CustomerPurchaseItem {
  createdAt: string;
  currency: string;
  id: string;
  licenseType?: string | null;
  order: { createdAt: string; currency: string; id: string; orderNumber: string; status: string };
  product: { currentVersion?: string | null; demoUrl?: string | null; documentationUrl?: string | null; id: string; licenseType: string; slug: string; title: string };
  quantity: number;
  title: string;
  total: string;
  unitPrice: string;
}

export interface CustomerDownloadItem {
  createdAt: string;
  fileId?: string | null;
  id: string;
  product: {
    currentVersion?: string | null;
    files: Array<{ fileName: string; id: string; mimeType: string; sizeBytes: string; visibility: string }>;
    id: string;
    slug: string;
    title: string;
  };
}

export interface CustomerLicenseItem {
  createdAt: string;
  expiresAt?: string | null;
  id: string;
  licenseKey: string;
  product: { currentVersion?: string | null; documentationUrl?: string | null; id: string; licenseType: string; slug: string; title: string };
  status: string;
}

export interface CustomerReviewItem {
  body: string;
  createdAt: string;
  id: string;
  product: { id: string; slug: string; title: string };
  rating: number;
  reply?: string | null;
  repliedAt?: string | null;
  status: string;
  title?: string | null;
}

export interface CustomerQuestionItem {
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  id: string;
  product: { id: string; slug: string; title: string };
  question: string;
  status: string;
}

export interface CustomerProductCard {
  badge?: string | null;
  currency: string;
  currentVersion?: string | null;
  demoUrl?: string | null;
  documentationUrl?: string | null;
  id: string;
  licenseType: string;
  price: string;
  ratingAverage: string;
  reviewCount: number;
  salePrice?: string | null;
  shortDescription: string;
  slug: string;
  title: string;
}

export interface CustomerSavedProductItem {
  createdAt: string;
  id: string;
  note?: string | null;
  product: CustomerProductCard;
}

export interface CustomerRecentlyViewedItem {
  id: string;
  product: CustomerProductCard;
  viewedAt: string;
}

export interface CustomerHelpItem {
  answer: Record<string, string>;
  createdAt?: string;
  id: string;
  question: Record<string, string>;
  sortOrder: number;
  updatedAt?: string;
}

export interface CustomerCompanyProfile {
  billingEmail?: string | null;
  companyName?: string | null;
  id: string;
  industry?: string | null;
  notes?: string | null;
  registrationNo?: string | null;
  taxId?: string | null;
  website?: string | null;
}

export interface CustomerAddressItem {
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
}

export interface CustomerPreferenceItem {
  id: string;
  key: string;
  value: unknown;
}

export interface ReferralPolicyAcknowledgement {
  acknowledgedAt: string | null;
  required: boolean;
  version: string;
}

export interface CustomerApiTokenItem {
  createdAt: string;
  expiresAt?: string;
  id: string;
  last4: string;
  lastUsedAt?: string;
  name: string;
  revokedAt?: string;
  scopes: string[];
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
}

export interface CustomerApiTokenCreateResult {
  item: CustomerApiTokenItem;
  token: string;
}

export interface CustomerSecuritySettings {
  loginAlerts: boolean;
  twoFactorChannel: "EMAIL" | "SMS";
  twoFactorEnabled: boolean;
  updatedAt?: string;
}

export interface CustomerPaymentRequestResult {
  id: string;
  paymentNumber?: string;
  paymentUrl?: string | null;
  status?: string;
}

export interface CustomerPaymentMethodItem {
  billingEmail?: string;
  createdAt: string;
  gateway: string;
  id: string;
  isDefault: boolean;
  label: string;
  notes?: string;
  status: "ACTIVE" | "DISABLED";
  type: "GATEWAY" | "MANUAL_BANK" | "WALLET";
  updatedAt: string;
}

interface CustomerInvoiceItem {
  currency: string;
  description: string;
  id: string;
  quantity: number;
  total: string;
  unitPrice: string;
}

export function getCustomerDashboardOverview(options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerDashboardOverview>("/dashboard/overview", options);
}

export function getCustomerOrderDetail(orderId: string, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerOrderDetail>(`/orders/${orderId}`, options);
}

export async function getCustomerOrders(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return normalizeListPage<CustomerOrderListItem>(await dashboardFetch<CustomerListPage<CustomerOrderListItem> | CommerceListResponse<CustomerOrderListItem>>(`/orders${toQuery(query)}`, options));
}

export async function getCustomerInvoices(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return normalizeListPage<CustomerInvoiceListItem>(await dashboardFetch<CustomerListPage<CustomerInvoiceListItem> | CommerceListResponse<CustomerInvoiceListItem>>(`/invoices${toQuery(query)}`, options));
}

export async function getCustomerPayments(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return normalizeListPage<CustomerPaymentListItem>(await dashboardFetch<CustomerListPage<CustomerPaymentListItem> | CommerceListResponse<CustomerPaymentListItem>>(`/payments${toQuery(query)}`, options));
}

export function getCustomerBalances(options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerBalanceItem[]>("/wallet/balances", options);
}

export async function getCustomerRefunds(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return normalizeListPage<CustomerRefundListItem>(await dashboardFetch<CustomerListPage<CustomerRefundListItem> | CommerceListResponse<CustomerRefundListItem>>(`/refunds${toQuery(query)}`, options));
}

export function getCustomerInvoiceDetail(invoiceId: string, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerInvoiceDetail>(`/invoices/${invoiceId}`, options);
}

export async function downloadCustomerInvoicePdf(invoiceId: string, options: { accessToken?: string } = {}) {
  const token = options.accessToken ?? getStoredAccessToken();
  const response = await fetch(`${API_BASE}/invoices/${invoiceId}/pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw new Error(readApiError(payload) ?? `Invoice PDF request failed: ${response.status}`);
  }
  const disposition = response.headers.get("content-disposition");
  return {
    blob: await response.blob(),
    filename: readFilename(disposition) ?? `invoice-${invoiceId}.pdf`,
  };
}

export function getCustomerPaymentDetail(paymentId: string, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerPaymentDetail>(`/payments/${paymentId}`, options);
}

export function getCustomerPurchases(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerListPage<CustomerPurchaseItem>>(`/dashboard/purchases${toQuery(query)}`, options);
}

export function getCustomerDownloads(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerListPage<CustomerDownloadItem>>(`/dashboard/downloads${toQuery(query)}`, options);
}

export async function downloadCustomerProductFile(fileId: string, fileName: string, options: { accessToken?: string } = {}) {
  const token = options.accessToken ?? getStoredAccessToken();
  const response = await fetch(`${API_BASE}/dashboard/downloads/files/${fileId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw new Error(readApiError(payload) ?? `Product file download failed: ${response.status}`);
  }
  const disposition = response.headers.get("content-disposition");
  return {
    blob: await response.blob(),
    filename: readFilename(disposition) ?? fileName,
  };
}

export function getCustomerLicenses(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerListPage<CustomerLicenseItem>>(`/dashboard/licenses${toQuery(query)}`, options);
}

export function getCustomerReviews(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerListPage<CustomerReviewItem>>(`/dashboard/reviews${toQuery(query)}`, options);
}

export function createCustomerReview(input: { body: string; productId: string; rating: number; title?: string }, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerReviewItem>("/dashboard/reviews", { ...options, body: input, method: "POST" });
}

export function getCustomerQuestions(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerListPage<CustomerQuestionItem>>(`/dashboard/questions${toQuery(query)}`, options);
}

export function createCustomerQuestion(input: { productId: string; question: string }, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerQuestionItem>("/dashboard/questions", { ...options, body: input, method: "POST" });
}

export function getCustomerSavedProducts(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerListPage<CustomerSavedProductItem>>(`/dashboard/saved-products${toQuery(query)}`, options);
}

export function saveCustomerProduct(input: { note?: string; productId: string }, options: { accessToken?: string } = {}) {
  return dashboardFetch("/dashboard/saved-products", { ...options, body: input, method: "POST" });
}

export function removeCustomerSavedProduct(productId: string, options: { accessToken?: string } = {}) {
  return dashboardFetch(`/dashboard/saved-products/${productId}`, { ...options, method: "DELETE" });
}

export function getCustomerRecentlyViewed(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerListPage<CustomerRecentlyViewedItem>>(`/dashboard/recently-viewed${toQuery(query)}`, options);
}

export function recordCustomerRecentlyViewed(productId: string, options: { accessToken?: string } = {}) {
  return dashboardFetch("/dashboard/recently-viewed", { ...options, body: { productId }, method: "POST" });
}

export function getCustomerHelp(query: Record<string, string | number | undefined> = {}, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerListPage<CustomerHelpItem>>(`/dashboard/help${toQuery(query)}`, options);
}

export function getCustomerHelpItem(id: string, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerHelpItem>(`/dashboard/help/${encodeURIComponent(id)}`, options);
}

export function getCustomerCompany(options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerCompanyProfile | null>("/dashboard/company", options);
}

export function updateCustomerCompany(input: Partial<CustomerCompanyProfile>, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerCompanyProfile>("/dashboard/company", { ...options, body: input, method: "POST" });
}

export function getCustomerAddresses(options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerAddressItem[]>("/dashboard/addresses", options);
}

export function createCustomerAddress(input: Partial<CustomerAddressItem>, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerAddressItem>("/dashboard/addresses", { ...options, body: input, method: "POST" });
}

export function updateCustomerAddress(id: string, input: Partial<CustomerAddressItem>, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerAddressItem>(`/dashboard/addresses/${id}`, { ...options, body: input, method: "POST" });
}

export function deleteCustomerAddress(id: string, options: { accessToken?: string } = {}) {
  return dashboardFetch(`/dashboard/addresses/${id}`, { ...options, method: "DELETE" });
}

export function getCustomerPreferences(options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerPreferenceItem[]>("/dashboard/preferences", options);
}

export function updateCustomerPreferences(preferences: Record<string, unknown>, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerPreferenceItem[]>("/dashboard/preferences", { ...options, body: { preferences }, method: "POST" });
}

export function getReferralPolicyAcknowledgement(options: { accessToken?: string } = {}) {
  return dashboardFetch<ReferralPolicyAcknowledgement>("/dashboard/referral-policy-acknowledgement", options);
}

export function acknowledgeReferralPolicy(options: { accessToken?: string } = {}) {
  return dashboardFetch<ReferralPolicyAcknowledgement>("/dashboard/referral-policy-acknowledgement", { ...options, method: "POST" });
}

export function getCustomerApiTokens(options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerApiTokenItem[]>("/dashboard/api-tokens", options);
}

export function createCustomerApiToken(input: { expiresAt?: string; name: string; scopes: string[] }, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerApiTokenCreateResult>("/dashboard/api-tokens", { ...options, body: input, method: "POST" });
}

export function revokeCustomerApiToken(id: string, options: { accessToken?: string } = {}) {
  return dashboardFetch<{ revoked: boolean }>(`/dashboard/api-tokens/${id}`, { ...options, method: "DELETE" });
}

export function getCustomerSecuritySettings(options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerSecuritySettings>("/dashboard/security", options);
}

export function updateCustomerSecuritySettings(input: Partial<CustomerSecuritySettings>, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerSecuritySettings>("/dashboard/security", { ...options, body: input, method: "POST" });
}

export function getCustomerPaymentMethods(options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerPaymentMethodItem[]>("/dashboard/payment-methods", options);
}

export function createCustomerPaymentMethod(input: Partial<CustomerPaymentMethodItem>, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerPaymentMethodItem>("/dashboard/payment-methods", { ...options, body: input, method: "POST" });
}

export function updateCustomerPaymentMethod(id: string, input: Pick<Partial<CustomerPaymentMethodItem>, "isDefault" | "status">, options: { accessToken?: string } = {}) {
  return dashboardFetch<CustomerPaymentMethodItem>(`/dashboard/payment-methods/${id}`, { ...options, body: input, method: "POST" });
}

export function deleteCustomerPaymentMethod(id: string, options: { accessToken?: string } = {}) {
  return dashboardFetch<{ deleted: boolean }>(`/dashboard/payment-methods/${id}`, { ...options, method: "DELETE" });
}

export function requestCustomerPayment(invoiceId: string, options: { accessToken?: string; gateway?: "wallet" | "zarinpal" } = {}) {
  return dashboardFetch<CustomerPaymentRequestResult>("/payments/request", { ...options, body: { gateway: options.gateway ?? defaultPaymentGateway(), invoiceId }, method: "POST" });
}

export function requestCustomerRefund(paymentId: string, reason?: string, options: { accessToken?: string } = {}) {
  return dashboardFetch("/refunds/request", { ...options, body: { paymentId, reason }, method: "POST" });
}

async function dashboardFetch<T>(path: string, options: { accessToken?: string; body?: unknown; method?: string } = {}) {
  const token = options.accessToken ?? getStoredAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: options.method ?? "GET",
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(readApiError(payload) ?? `Dashboard request failed: ${response.status}`);
  }
  return payload as T;
}

function getStoredAccessToken() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("noghre:accessToken") ?? window.localStorage.getItem("accessToken") ?? undefined;
}

function defaultPaymentGateway() {
  return "zarinpal";
}

function readApiError(payload: unknown) {
  return extractApiError(payload);
}

function readFilename(disposition: string | null) {
  if (!disposition) return undefined;
  const match = disposition.match(/filename="([^"]+)"/);
  return match?.[1];
}

function toQuery(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

interface CommerceListResponse<T> {
  data: T[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

function normalizeListPage<T>(payload: CustomerListPage<T> | CommerceListResponse<T>): CustomerListPage<T> {
  if ("items" in payload) return payload;
  return {
    items: payload.data ?? [],
    page: payload.meta?.page,
    pageSize: payload.meta?.pageSize,
    total: payload.meta?.total,
    totalPages: payload.meta?.totalPages,
  };
}
