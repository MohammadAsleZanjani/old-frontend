import { adminApiRequest } from "./admin-api-request";

export interface AuditLogQuery {
  entityType?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}

export interface AuditLogItem {
  action: string;
  actorId?: string | null;
  createdAt: string;
  entityId?: string | null;
  entityType: string;
  id: string;
  ipAddress?: string | null;
  metadata?: unknown;
  userAgent?: string | null;
}

export interface AuditLogPage {
  items: AuditLogItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function getAdminAuditLogs(query: AuditLogQuery = {}) {
  return auditRequest<AuditLogPage>("/admin/audit-logs", query);
}

async function auditRequest<T>(path: string, query?: AuditLogQuery) {
  return adminApiRequest<T>(path, { query });
}
