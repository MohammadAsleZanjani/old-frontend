const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";

export interface AccountingQuery {
  accessToken?: string;
  currency?: string;
  from?: string;
  to?: string;
}

export function getAccountingOverview(query: AccountingQuery = {}) {
  return accountingFetch(`/admin/accounting/overview${toQuery(query)}`, query.accessToken);
}

export function getRevenueReport(query: AccountingQuery = {}) {
  return accountingFetch(`/admin/accounting/revenue${toQuery(query)}`, query.accessToken);
}

export function getCustomerBalances(query: AccountingQuery & { page?: number; pageSize?: number; search?: string } = {}) {
  return accountingFetch(`/admin/accounting/customer-balances${toQuery(query)}`, query.accessToken);
}

export function accountingExportUrl(query: AccountingQuery & { type: "revenue" | "payments" | "invoices" | "refunds" | "expenses" }) {
  return `${API_BASE}/admin/accounting/exports.csv${toQuery(query)}`;
}

async function accountingFetch(path: string, accessToken?: string) {
  const token = accessToken ?? getStoredAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(readApiError(payload) ?? `Accounting request failed: ${response.status}`);
  }
  return payload;
}

function toQuery(input: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (key !== "accessToken" && value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
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
