import { adminApiBlobRequest, adminApiRequest } from "./admin-api-request";

export interface AdminOverview {
  access: {
    isSuperAdmin: boolean;
    permissions: string[];
    roleNames: string[];
  };
  alerts: Array<{ label: string; severity: "critical" | "info" | "success" | "warning"; value: number }>;
  charts: {
    orders: Array<{ date: string; value: number }>;
    revenue: Array<{ date: string; value: number }>;
  };
  health: {
    generatedAt: string;
    queues: string;
    redis: string;
    search: string;
  };
  kpis: Array<{ label: string; meta?: string; tone: "info" | "neutral" | "primary" | "success" | "warning"; value: number }>;
  recentActivity: Array<{
    at: string;
    customer: string;
    href: string;
    label: string;
    status: string;
    type: string;
    userId?: string | null;
  }>;
}

export async function getAdminOverview(options: { accessToken?: string } = {}) {
  const payload = await adminRequest<unknown>("/admin/dashboard/overview", options);
  return normalizeAdminOverview(payload);
}

export interface AdminResourceList {
  items: unknown[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminInvoiceDetail {
  balanceDue: string;
  createdAt: string;
  currency: string;
  discount: string;
  dueAt?: string | null;
  id: string;
  invoiceNumber: string;
  items: Array<{ currency: string; description: string; id: string; quantity: number; total: string; unitPrice: string }>;
  notes?: string | null;
  order?: { id: string; orderNumber: string; status: string } | null;
  paidAt?: string | null;
  payments: Array<{ amount: string; createdAt: string; currency: string; id: string; paymentNumber: string; status: string }>;
  refunds: Array<{ amount: string; createdAt: string; currency: string; id: string; refundNumber: string; status: string }>;
  status: string;
  subtotal: string;
  tax: string;
  total: string;
  type: string;
  updatedAt: string;
  user?: AdminInvoiceCustomer | null;
}

export interface AdminInvoiceCustomer {
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
}

export interface AdminInvoiceCustomerOption {
  addresses?: Array<{ city: string; country: string; id: string; line1: string; line2?: string | null; phone?: string | null; postalCode?: string | null; province?: string | null; recipient?: string | null }>;
  email?: string | null;
  id: string;
  mobile?: string | null;
  profile?: { firstName?: string | null; lastName?: string | null } | null;
}

export interface CreateAdminUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  password?: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
}

export interface CreateCustomInvoiceInput {
  currency: "TOMAN";
  customer: {
    address?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    userId?: string;
  };
  discount?: number;
  dueAt?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  notes?: string;
  status: "DRAFT" | "PENDING" | "PAID";
  tax?: number;
  type: "invoice" | "pre-invoice";
}

export interface AdminOrderDetail {
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  currency: string;
  discount: string;
  id: string;
  invoices: Array<{ balanceDue: string; createdAt: string; currency: string; id: string; invoiceNumber: string; paidAt?: string | null; status: string; total: string; updatedAt?: string }>;
  items: Array<{
    currency: string;
    id: string;
    metadata?: Record<string, unknown> | null;
    product?: { id: string; slug: string; title: string } | null;
    quantity: number;
    sku?: string | null;
    title: string;
    total: string;
    unitPrice: string;
  }>;
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
  orderNumber: string;
  paidAt?: string | null;
  payments: Array<{
    amount: string;
    authority?: string | null;
    cardPan?: string | null;
    createdAt: string;
    currency: string;
    failedAt?: string | null;
    failureReason?: string | null;
    gateway: string;
    id: string;
    logs?: Array<{ createdAt: string; error?: string | null; gateway: string; id: string; status?: string | null; type: string }>;
    metadata?: Record<string, unknown> | null;
    paidAt?: string | null;
    paymentNumber: string;
    referenceId?: string | null;
    requestedAt?: string | null;
    status: string;
    transactionId?: string | null;
    updatedAt: string;
    verifiedAt?: string | null;
  }>;
  promotionRedemption?: {
    code: string;
    discountAmount: string;
    promotion?: { id: string; name: string } | null;
    rewardType: string;
    status: string;
    value: string;
    walletCreditAmount: string;
  } | null;
  refunds: Array<{ amount: string; createdAt: string; currency: string; id: string; refundNumber: string; status: string }>;
  status: string;
  subtotal: string;
  tax: string;
  total: string;
  updatedAt: string;
  user?: {
    addresses?: Array<{
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
      updatedAt: string;
    }>;
    createdAt: string;
    email?: string | null;
    emailVerifiedAt?: string | null;
    id: string;
    kycProfile?: {
      birthDateJalali?: string | null;
      fatherName?: string | null;
      fullName?: string | null;
      nationalId?: string | null;
      provider?: string | null;
      rejectionReason?: string | null;
      reviewedAt?: string | null;
      status: string;
      verifiedAt?: string | null;
    } | null;
    lastLoginAt?: string | null;
    mobile?: string | null;
    mobileVerifiedAt?: string | null;
    profile?: {
      displayName?: string | null;
      firstName?: string | null;
      idCardNo?: string | null;
      lastName?: string | null;
      locale: string;
      timezone: string;
    } | null;
    status: string;
  } | null;
}

export interface AdminPaymentDetail {
  amount: string;
  authority?: string | null;
  callbackUrl?: string | null;
  cardPan?: string | null;
  createdAt: string;
  currency: string;
  effectStatus?: AdminGatewayTransactionEffectStatus;
  effectsAppliedAt?: string | null;
  failureReason?: string | null;
  gateway: string;
  id: string;
  invoice?: { balanceDue: string; id: string; invoiceNumber: string; status: string; total: string; type?: string } | null;
  invoiceAmountMatches?: boolean | null;
  logs: Array<{ createdAt: string; error?: string | null; gateway: string; id: string; status?: string | null; type: string }>;
  order?: { id: string; orderNumber: string; status: string; total?: string } | null;
  paidAt?: string | null;
  paymentNumber: string;
  paymentUrl?: string | null;
  purpose?: AdminGatewayTransactionPurpose;
  referenceId?: string | null;
  refunds: Array<{ amount: string; createdAt: string; currency: string; id: string; refundNumber: string; status: string }>;
  status: string;
  silverOrder?: { grams: string; id: string; orderNumber: string; status: string; totalToman: string } | null;
  transactionId?: string | null;
  updatedAt: string;
  user?: { email?: string | null; id: string; mobile?: string | null; profile?: { firstName?: string | null; lastName?: string | null } | null } | null;
  verifiedAt?: string | null;
  walletTransaction?: {
    amount: string;
    balanceAfter: string;
    id: string;
    status: string;
    type: string;
    wallet: { currency: string };
  } | null;
}

export type AdminGatewayTransactionPurpose = "WALLET_TOP_UP" | "SILVER_PURCHASE" | "PRODUCT_PURCHASE" | "OTHER";
export type AdminGatewayTransactionEffectStatus = "APPLIED" | "MISSING" | "NOT_APPLICABLE" | "PENDING";

export interface AdminGatewayTransaction {
  amount: string;
  authority?: string | null;
  cardPan?: string | null;
  createdAt: string;
  currency: string;
  effectStatus: AdminGatewayTransactionEffectStatus;
  effectsAppliedAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  gateway: string;
  id: string;
  invoice?: { id: string; invoiceNumber: string; status: string; total: string; type: string } | null;
  invoiceAmountMatches?: boolean | null;
  order?: { id: string; orderNumber: string; status: string; total: string } | null;
  paidAt?: string | null;
  paymentNumber: string;
  purpose: AdminGatewayTransactionPurpose;
  referenceId?: string | null;
  silverOrder?: { grams: string; id: string; orderNumber: string; status: string; totalToman: string } | null;
  status: string;
  transactionId?: string | null;
  user?: { email?: string | null; id: string; mobile?: string | null; profile?: { firstName?: string | null; lastName?: string | null } | null } | null;
  verifiedAt?: string | null;
  walletTransaction?: { amount: string; balanceAfter: string; id: string; status: string; type: string; wallet: { currency: string } } | null;
}

export interface AdminGatewayTransactionList {
  items: AdminGatewayTransaction[];
  page: number;
  pageSize: number;
  summary: { failedCount: number; paidAmount: string; paidCount: number; totalCount: number };
  total: number;
  totalPages: number;
}

export interface AdminRefundDetail {
  amount: string;
  createdAt: string;
  currency: string;
  id: string;
  invoice?: { id: string; invoiceNumber: string; status: string; total: string } | null;
  order?: { id: string; orderNumber: string; status: string; total: string } | null;
  payment?: { amount: string; currency: string; gateway: string; id: string; paymentNumber: string; status: string } | null;
  processedAt?: string | null;
  reason?: string | null;
  refundNumber: string;
  status: string;
  updatedAt: string;
  user?: { email?: string | null; id: string; mobile?: string | null; profile?: { firstName?: string | null; lastName?: string | null } | null } | null;
}

export function getAdminResourceList(
  path: string,
  params: Record<string, string | number | undefined>,
  options: { accessToken?: string } = {},
) {
  return adminRequest<unknown>(path, options, params).then(normalizeResourceList);
}

export function getAdminInvoiceDetail(invoiceId: string, options: { accessToken?: string } = {}) {
  return adminRequest<AdminInvoiceDetail>(`/admin/invoices/${invoiceId}`, options);
}

export function searchAdminInvoiceCustomers(search: string, options: { accessToken?: string } = {}) {
  return adminRequest<AdminInvoiceCustomerOption[]>("/admin/invoices/customers", options, { search });
}

export function createCustomAdminInvoice(input: CreateCustomInvoiceInput, options: { accessToken?: string } = {}) {
  return adminPost<AdminInvoiceDetail>("/admin/invoices/custom", input, options);
}

export function createAdminUser(input: CreateAdminUserInput, options: { accessToken?: string } = {}) {
  return adminPost<AdminInvoiceCustomerOption>("/admin/users", input, options);
}

export function saveAdminQuickResource(
  path: string,
  input: Record<string, unknown>,
  options: { accessToken?: string } = {},
) {
  return adminPost<unknown>(path, input, options);
}

export function updateAdminQuickResource(
  path: string,
  input: Record<string, unknown>,
  options: { accessToken?: string } = {},
) {
  return adminApiRequest<unknown>(path, { accessToken: options.accessToken, body: input, method: "PATCH" });
}

export function getAdminOrderDetail(orderId: string, options: { accessToken?: string } = {}) {
  return adminRequest<AdminOrderDetail>(`/admin/orders/${orderId}`, options);
}

export function getAdminPaymentDetail(paymentId: string, options: { accessToken?: string } = {}) {
  return adminRequest<AdminPaymentDetail>(`/admin/payments/${paymentId}`, options);
}

export function getAdminGatewayTransactions(
  params: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    purpose?: AdminGatewayTransactionPurpose;
    search?: string;
    sortOrder?: "asc" | "desc";
    status?: string;
    userId?: string;
  },
  options: { accessToken?: string } = {},
) {
  return adminRequest<{ data: AdminGatewayTransaction[]; meta: Omit<AdminGatewayTransactionList, "items" | "summary">; summary: AdminGatewayTransactionList["summary"] }>("/admin/gateway-transactions", options, params)
    .then((response) => ({ ...response.meta, items: response.data, summary: response.summary }));
}

export function getAdminRefundDetail(refundId: string, options: { accessToken?: string } = {}) {
  return adminRequest<AdminRefundDetail>(`/admin/refunds/${refundId}`, options);
}

export async function downloadAdminInvoicePdf(invoiceId: string, options: { accessToken?: string } = {}) {
  const response = await adminApiBlobRequest(`/admin/invoices/${invoiceId}/pdf`, { accessToken: options.accessToken });
  const disposition = response.headers.get("content-disposition");
  return {
    blob: await response.blob(),
    filename: readFilename(disposition) ?? `invoice-${invoiceId}.pdf`,
  };
}

export async function printAdminInvoicePdf(invoiceId: string, options: { accessToken?: string } = {}) {
  const { blob } = await downloadAdminInvoicePdf(invoiceId, options);
  const url = window.URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.inset = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.src = url;
  document.body.appendChild(frame);
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => {
      frame.remove();
      window.URL.revokeObjectURL(url);
    }, 60_000);
  };
}

function normalizeResourceList(payload: unknown): AdminResourceList {
  if (Array.isArray(payload)) {
    return { items: payload, page: 1, pageSize: payload.length || 20, total: payload.length, totalPages: 1 };
  }

  if (!payload || typeof payload !== "object") {
    return { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
  }

  const record = payload as Record<string, unknown>;
  const meta = record.meta && typeof record.meta === "object" ? (record.meta as Record<string, unknown>) : undefined;
  const items = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.data)
      ? record.data
      : recordToSummaryItems(record);
  const total = readNumber(record.total) ?? readNumber(meta?.total) ?? items.length;
  const pageSize = (readNumber(record.pageSize) ?? readNumber(meta?.pageSize) ?? items.length) || 20;
  return {
    items,
    page: readNumber(record.page) ?? readNumber(meta?.page) ?? 1,
    pageSize,
    total,
    totalPages: readNumber(record.totalPages) ?? readNumber(meta?.totalPages) ?? Math.max(1, Math.ceil(total / pageSize)),
  };
}

function normalizeAdminOverview(payload: unknown): AdminOverview {
  const overview = payload && typeof payload === "object"
    ? payload as Partial<AdminOverview>
    : {};
  const health = (overview.health ?? {}) as Partial<AdminOverview["health"]> & { sockets?: unknown };

  return {
    access: {
      isSuperAdmin: Boolean(overview.access?.isSuperAdmin),
      permissions: Array.isArray(overview.access?.permissions) ? overview.access.permissions.map(String) : [],
      roleNames: Array.isArray(overview.access?.roleNames) ? overview.access.roleNames.map(String) : [],
    },
    alerts: Array.isArray(overview.alerts)
      ? overview.alerts.map((item) => ({ ...item, value: toFiniteNumber(item.value) }))
      : [],
    charts: {
      orders: normalizeChartPoints(overview.charts?.orders),
      revenue: normalizeChartPoints(overview.charts?.revenue),
    },
    health: {
      generatedAt: String(health.generatedAt ?? new Date().toISOString()),
      queues: String(health.queues ?? "unknown"),
      redis: String(health.redis ?? "unknown"),
      search: String(health.search ?? health.sockets ?? "unknown"),
    },
    kpis: Array.isArray(overview.kpis)
      ? overview.kpis.map((item) => ({ ...item, value: toFiniteNumber(item.value) }))
      : [],
    recentActivity: Array.isArray(overview.recentActivity) ? overview.recentActivity : [],
  };
}

function normalizeChartPoints(points: unknown): Array<{ date: string; value: number }> {
  if (!Array.isArray(points)) return [];

  return points.flatMap((point) => {
    if (!point || typeof point !== "object") return [];
    const record = point as Record<string, unknown>;
    return [{ date: String(record.date ?? ""), value: toFiniteNumber(record.value) }];
  });
}

function toFiniteNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function recordToSummaryItems(record: Record<string, unknown>) {
  const values: Array<{ group: string; key: string; value: unknown }> = [];
  for (const [group, value] of Object.entries(record)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      values.push(...Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => ["boolean", "number", "string"].includes(typeof nested))
        .map(([key, nested]) => ({ group, key, value: nested })));
    } else if (["boolean", "number", "string"].includes(typeof value)) {
      values.push({ group: "", key: group, value });
    }
  }
  return values.map(({ group, key, value }) => ({
      id: key,
      group: group || undefined,
      name: key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
      status: "SUMMARY",
      updatedAt: new Date().toISOString(),
      value,
    }));
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function adminRequest<T>(path: string, options: { accessToken?: string } = {}, query?: Record<string, string | number | undefined>) {
  return adminApiRequest<T>(path, { accessToken: options.accessToken, query });
}

async function adminPost<T>(path: string, body: unknown, options: { accessToken?: string } = {}) {
  return adminApiRequest<T>(path, { accessToken: options.accessToken, body, method: "POST" });
}

function readFilename(disposition: string | null) {
  if (!disposition) return undefined;
  const match = disposition.match(/filename="([^"]+)"/);
  return match?.[1];
}
