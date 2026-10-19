import { formatTomanMoney, isTomanCurrency } from "@/shared/lib/toman-money";

export interface AdminResourceRow {
  amount?: string;
  at: string;
  attachments?: number;
  authority?: string;
  balanceDue?: string;
  balanceAfter?: string;
  cardPan?: string;
  completedAt?: string;
  createdAt?: string;
  customer: string;
  customerEmail?: string;
  currency?: string;
  description?: string;
  descriptionTranslations?: Record<string, string>;
  email?: string;
  failedAt?: string;
  failureReason?: string;
  feeAmount?: string;
  gateway?: string;
  grams?: string;
  grossAmount?: string;
  id: string;
  invoiceId?: string;
  invoiceNumber?: string;
  itemsCount?: number;
  label: string;
  meta?: string;
  mobile?: string;
  online?: boolean;
  orderId?: string;
  orderNumber?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentNumber?: string;
  paymentStatus?: string;
  pricePerGram?: string;
  referenceId?: string;
  reference?: string;
  refundsCount?: number;
  requestedAt?: string;
  sortOrder?: number;
  slug?: string;
  status: string;
  total?: string;
  transactionAt?: string;
  transactionId?: string;
  transactionReference?: string;
  type?: string;
  titleTranslations?: Record<string, string>;
  userId?: string;
  verifiedAt?: string;
}

export function buildOverviewRows(label: string, activity: Array<{ at: string; customer: string; label: string; status: string; type: string; userId?: string | null }>): AdminResourceRow[] {
  const keyword = label.toLowerCase();
  const filtered = activity.filter((item) => keyword.includes(item.type) || item.type.includes(keyword.split(" ")[0] ?? ""));
  return (filtered.length ? filtered : activity).slice(0, 8).map((item, index) => ({ ...item, id: `${item.type}-${index}`, userId: item.userId ?? undefined }));
}

export function normalizeAdminResourceRow(record: unknown): AdminResourceRow {
  const item = isRecord(record) ? record : {};
  const user = isRecord(item.user) ? item.user : undefined;
  const customer = isRecord(item.customer) ? item.customer : undefined;
  const author = isRecord(item.author) ? item.author : undefined;
  const invoice = isRecord(item.invoice) ? item.invoice : undefined;
  const order = isRecord(item.order) ? item.order : undefined;
  const payments = Array.isArray(item.payments) ? item.payments.filter(isRecord) : [];
  const payment = isRecord(item.payment) ? item.payment : payments[0];
  const profile = isRecord(user?.profile) ? user.profile : undefined;
  const customerProfile = isRecord(customer?.profile) ? customer.profile : undefined;
  const count = isRecord(item._count) ? item._count : undefined;
  const participants = Array.isArray(item.participants) ? item.participants.filter(isRecord) : [];
  const onlineParticipants = participants.filter((participant) => participant.isOnline === true);
  return {
    amount: readString(item.amount),
    at: readString(item.updatedAt) ?? readString(item.requestedAt) ?? readString(item.lastReplyAt) ?? readString(item.createdAt) ?? readString(item.publishedAt) ?? new Date().toISOString(),
    attachments: readNumber(count?.attachments),
    authority: readString(item.authority) ?? readString(payment?.authority),
    balanceDue: formatMoney(readString(item.balanceDue), readString(item.currency)),
    balanceAfter: readString(item.balanceAfter),
    cardPan: readString(item.cardPan) ?? readString(payment?.cardPan),
    completedAt: readString(item.completedAt),
    createdAt: readString(item.createdAt),
    customer:
      formatPersonName(profile) ??
      formatPersonName(customerProfile) ??
      readString(customer?.email) ??
      readString(item.visitorName) ??
      readString(item.visitorEmail) ??
      readString(user?.email) ??
      (formatMobileDisplay(readString(user?.mobile)) || undefined) ??
      readString(author?.name) ??
      "System",
    customerEmail: readString(user?.email) ?? readString(customer?.email) ?? readString(item.visitorEmail),
    currency: readString(item.currency) ?? readString(isRecord(item.wallet) ? item.wallet.currency : undefined),
    description: readString(item.description),
    descriptionTranslations: readStringMap(item.description),
    email: readString(item.email),
    failedAt: readString(item.failedAt) ?? readString(payment?.failedAt),
    failureReason: readString(item.failureReason) ?? readString(payment?.failureReason),
    feeAmount: formatMoney(readString(item.feeAmount), "TOMAN"),
    gateway: readString(item.gateway) ?? readString(payment?.gateway),
    grams: readString(item.grams),
    grossAmount: formatMoney(readString(item.grossAmount), "TOMAN"),
    id: readString(item.id) ?? readString(item.slug) ?? `${readString(item.createdAt) ?? "record"}-${readString(item.updatedAt) ?? "row"}`,
    invoiceId: readString(invoice?.id) ?? readString(item.invoiceId),
    invoiceNumber: readString(invoice?.invoiceNumber),
    itemsCount: readNumber(count?.items),
    label:
      readString(item.conversationNo) ??
      readString(item.title) ??
      readString(item.name) ??
      readString(item.subject) ??
      readString(item.orderNumber) ??
      readString(item.invoiceNumber) ??
      readString(item.paymentNumber) ??
      readString(item.ticketNumber) ??
      readString(item.requestNumber) ??
      readString(item.certificateNumber) ??
      readString(item.fullName) ??
      readString(item.nationalId) ??
      readString(item.description) ??
      readString(item.source) ??
      formatSettingLabel(item) ??
      readString(item.slug) ??
      resourceFallbackLabel(item, user, customer),
    meta: formatResourceMeta(item, count, onlineParticipants),
    mobile: formatMobileDisplay(readString(user?.mobile) ?? readString(customer?.mobile)) || undefined,
    online: onlineParticipants.length > 0,
    orderId: readString(order?.id) ?? readString(item.orderId),
    orderNumber: readString(order?.orderNumber) ?? readString(item.orderNumber),
    paidAt: readString(item.paidAt) ?? readString(payment?.paidAt),
    paymentMethod: readString(item.paymentMethod) ?? readString(payment?.gateway),
    paymentNumber: readString(item.paymentNumber) ?? readString(payment?.paymentNumber),
    paymentStatus: readString(payment?.status),
    pricePerGram: formatMoney(readString(item.pricePerGram), "TOMAN"),
    referenceId: readString(item.referenceId) ?? readString(payment?.referenceId),
    reference: readString(item.reference),
    refundsCount: readNumber(count?.refunds),
    requestedAt: readString(item.requestedAt),
    sortOrder: readNumber(item.sortOrder),
    slug: readString(item.slug),
    status: readString(item.status) ?? readString(item.paymentStatus) ?? "active",
    total: formatMoney(readString(item.total), readString(item.currency)) ?? formatMoney(readString(item.totalToman), "تومان") ?? formatMoney(readString(item.amount), readString(item.currency)) ?? readString(item.value),
    transactionAt:
      readString(item.transactionAt) ??
      readString(payment?.paidAt) ??
      readString(payment?.verifiedAt) ??
      readString(item.paidAt) ??
      readString(payment?.createdAt) ??
      readString(item.createdAt),
    transactionId: readString(item.transactionId) ?? readString(payment?.transactionId),
    transactionReference: readString(item.transactionReference),
    type: readString(item.type) ?? (readString(item.orderNumber) ? "PHYSICAL_PRODUCT_PURCHASE" : undefined),
    titleTranslations: readStringMap(item.title),
    userId:
      readString(user?.id) ??
      readString(customer?.id) ??
      readString(item.userId) ??
      readString(item.customerId) ??
      (isRecord(item.profile) && (readString(item.email) || readString(item.mobile)) ? readString(item.id) : undefined),
    verifiedAt: readString(item.verifiedAt) ?? readString(payment?.verifiedAt),
  };
}

function formatPersonName(profile?: Record<string, unknown>) {
  if (!profile) return undefined;
  const profileName = [readString(profile.firstName), readString(profile.lastName)].filter(Boolean).join(" ");
  return profileName || readString(profile.displayName) || undefined;
}

function formatMoney(amount?: string, currency?: string) {
  if (!amount) return undefined;
  if (isTomanCurrency(currency)) return formatTomanMoney(amount, currency);
  const label = displayCurrency(currency);
  return [formatDisplayAmount(amount, label), label].filter(Boolean).join(" ");
}

function displayCurrency(currency?: string) {
  const normalized = currency?.trim();
  if (!normalized) return undefined;
  if (["r", "rial", "irr", "ریال"].includes(normalized.toLowerCase())) return "تومان";
  return normalized;
}

function formatDisplayAmount(amount: string, currency?: string) {
  if (!currencyHasNoDecimals(currency)) return amount;
  const numeric = Number(amount);
  return Number.isFinite(numeric) ? String(Math.round(numeric)) : amount.replace(/\.0+$/, "");
}

function currencyHasNoDecimals(currency?: string) {
  const normalized = currency?.trim().toLowerCase() ?? "";
  return normalized.includes("تومان") || normalized.includes("toman") || normalized === "irt";
}

function formatResourceMeta(item: Record<string, unknown>, count?: Record<string, unknown>, onlineParticipants: Record<string, unknown>[] = []) {
  const messages = readNumber(count?.messages);
  const attachments = readNumber(count?.attachments);
  const subject = readString(item.subject);
  const parts = [
    subject,
    readString(item.type),
    readString(item.currency),
    readString(item.grams) ? `${readString(item.grams)} g` : undefined,
    readString(item.pricePerGram) ? `${readString(item.pricePerGram)} تومان / g` : undefined,
    readString(item.availableGrams) ? `${readString(item.availableGrams)} g available` : undefined,
    readString(item.lockedGrams) ? `${readString(item.lockedGrams)} g locked` : undefined,
    readString(item.authenticityStatus),
    readString(item.value),
    typeof messages === "number" ? `${messages} messages` : undefined,
    typeof attachments === "number" ? `${attachments} files` : undefined,
    onlineParticipants.length ? `${onlineParticipants.length} online` : undefined,
  ].filter(Boolean);
  return parts.join(" · ") || undefined;
}

function formatSettingLabel(item: Record<string, unknown>) {
  const group = readString(item.group);
  const key = readString(item.key);
  if (!group && !key) return undefined;
  return [group, key].filter(Boolean).join(" / ");
}

function resourceFallbackLabel(item: Record<string, unknown>, user?: Record<string, unknown>, customer?: Record<string, unknown>) {
  const profile = isRecord(item.profile) ? item.profile : isRecord(user?.profile) ? user.profile : isRecord(customer?.profile) ? customer.profile : undefined;
  return formatPersonName(profile) ?? readString(item.email) ?? formatMobileDisplay(readString(item.mobile)) ?? readString(user?.email) ?? formatMobileDisplay(readString(user?.mobile)) ?? readString(customer?.email) ?? formatMobileDisplay(readString(customer?.mobile)) ?? `رکورد ${readString(item.id)?.slice(-6) ?? "سامانه"}`;
}

export function buildAdminResourceMetrics(rows: AdminResourceRow[], total: number) {
  const active = rows.filter((row) => ["ACTIVE", "PUBLISHED", "COMPLETED", "APPROVED", "PAID"].includes(row.status)).length;
  const pending = rows.filter((row) => row.status.includes("PENDING") || row.status.includes("DRAFT") || row.status.includes("OPEN")).length;
  const attention = rows.filter((row) => ["FAILED", "REJECTED", "SPAM", "OVERDUE", "REFUNDED", "CANCELLED"].some((status) => row.status.includes(status))).length;
  return [
    { label: "Total", meta: "Latest recorded information", value: total },
    { label: "Active", meta: "Active items on this page", value: active },
    { label: "Pending", meta: "Needs review", value: pending },
    { label: "Attention", meta: "Needs attention", value: attention },
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return readString(record.fa) ?? readString(record.en) ?? readString(record.name) ?? readString(record.title);
  }
  return undefined;
}

function readStringMap(value: unknown) {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}
import { formatMobileDisplay } from "@/shared/lib/date-format";
