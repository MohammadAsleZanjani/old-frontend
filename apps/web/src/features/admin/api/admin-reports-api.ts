import { adminApiRequest } from "./admin-api-request";

export const reportOperations = [
  "REGISTRATION",
  "KYC",
  "SILVER_BUY",
  "SILVER_SELL",
  "PRODUCT_PURCHASE",
  "WALLET_TOP_UP",
  "TOMAN_WITHDRAWAL",
] as const;

export type ReportOperation = (typeof reportOperations)[number];

export interface AdminReportActivity {
  amountToman?: string;
  description?: string;
  detailsHref: string;
  entityId: string;
  feeToman?: string;
  grams?: string;
  id: string;
  occurredAt: string;
  operation: ReportOperation;
  netToman?: string;
  quantity?: number;
  reference?: string;
  status: string;
  title: string;
  user: {
    email?: string | null;
    fullName: string;
    id?: string | null;
    mobile?: string | null;
  };
}

export interface AdminActivityReportPage {
  items: AdminReportActivity[];
  page: number;
  pageSize: number;
  summary: {
    byOperation: Record<ReportOperation, number>;
    total: number;
  };
  total: number;
  totalPages: number;
}

export interface AdminActivityReportQuery {
  operation?: ReportOperation;
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}

export function getAdminActivityReport(query: AdminActivityReportQuery = {}) {
  return adminApiRequest<AdminActivityReportPage>("/admin/reports/activities", { query });
}
