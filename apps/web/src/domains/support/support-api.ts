const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";

export interface SupportRequestOptions {
  accessToken?: string;
}

export interface TicketAttachmentInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadId?: string;
}

export interface CreateTicketInput {
  attachments?: TicketAttachmentInput[];
  body: string;
  departmentId?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  relatedInvoiceId?: string;
  relatedOrderId?: string;
  subject: string;
}

export interface CreateAdminTicketInput extends CreateTicketInput {
  customerId: string;
}

export interface ReplyTicketInput {
  attachments?: TicketAttachmentInput[];
  body: string;
}

export interface TicketListQuery {
  assignedToId?: string;
  customerId?: string;
  departmentId?: string;
  page?: number;
  pageSize?: number;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: "OPEN" | "PENDING" | "WAITING_ON_CUSTOMER" | "WAITING_ON_STAFF" | "RESOLVED" | "CLOSED";
}

export type TicketPriority = NonNullable<TicketListQuery["priority"]>;
export type TicketStatus = NonNullable<TicketListQuery["status"]>;

export interface SupportUserSummary {
  email?: string | null;
  id: string;
  mobile?: string | null;
  profile?: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  status?: string | null;
}

export interface SupportAttachment {
  fileName: string;
  id: string;
  mimeType: string;
  sizeBytes: string;
  uploadId?: string | null;
}

export interface SupportSignedUrl {
  expiresAt?: string | null;
  url: string;
}

export interface AdminTicketDetail {
  assignedTo?: SupportUserSummary | null;
  attachments: SupportAttachment[];
  closedAt?: string | null;
  createdAt: string;
  customer?: SupportUserSummary | null;
  department?: { email?: string | null; id: string; name: string; slug: string } | null;
  history: Array<{
    actor?: SupportUserSummary | null;
    createdAt: string;
    fromValue?: string | null;
    id: string;
    toValue?: string | null;
    type: string;
  }>;
  id: string;
  internalNotes: Array<{
    author?: SupportUserSummary | null;
    body: string;
    createdAt: string;
    id: string;
  }>;
  lastCustomerReplyAt?: string | null;
  lastReplyAt?: string | null;
  lastStaffReplyAt?: string | null;
  messages: Array<{
    attachments: SupportAttachment[];
    author?: SupportUserSummary | null;
    body: string;
    createdAt: string;
    id: string;
    visibility: string;
  }>;
  priority: TicketPriority;
  relatedInvoice?: { id: string; invoiceNumber: string; status: string; total: string } | null;
  relatedOrder?: { id: string; orderNumber: string; status: string; total: string } | null;
  resolvedAt?: string | null;
  status: TicketStatus;
  subject: string;
  ticketNumber: string;
  updatedAt: string;
}

export interface TicketDepartment {
  _count?: { tickets: number };
  description?: string | null;
  email?: string | null;
  id: string;
  name: string;
  slug: string;
}

export function getMyTickets(query: TicketListQuery = {}, options: SupportRequestOptions = {}) {
  return supportFetch(`/support/tickets${toQuery(query)}`, { accessToken: options.accessToken });
}

export function getMyTicket(id: string, options: SupportRequestOptions = {}) {
  return supportFetch(`/support/tickets/${id}`, { accessToken: options.accessToken });
}

export function createTicket(input: CreateTicketInput, options: SupportRequestOptions = {}) {
  return supportFetch("/support/tickets", { accessToken: options.accessToken, body: input, method: "POST" });
}

export function replyToTicket(id: string, input: ReplyTicketInput, options: SupportRequestOptions = {}) {
  return supportFetch(`/support/tickets/${id}/replies`, { accessToken: options.accessToken, body: input, method: "POST" });
}

export function updateMyTicketStatus(id: string, status: Extract<TicketStatus, "CLOSED" | "OPEN" | "RESOLVED">, options: SupportRequestOptions = {}) {
  return supportFetch<AdminTicketDetail>(`/support/tickets/${id}/status`, { accessToken: options.accessToken, body: { status }, method: "PATCH" });
}

export function getMyTicketAttachmentSignedUrl(ticketId: string, attachmentId: string, options: SupportRequestOptions = {}) {
  return supportFetch<SupportSignedUrl>(`/support/tickets/${ticketId}/attachments/${attachmentId}/signed-url`, { accessToken: options.accessToken });
}

export function getAdminTickets(query: TicketListQuery = {}, options: SupportRequestOptions = {}) {
  return supportFetch(`/admin/support/tickets${toQuery(query)}`, { accessToken: options.accessToken });
}

export function getAdminTicket(id: string, options: SupportRequestOptions = {}) {
  return supportFetch<AdminTicketDetail>(`/admin/support/tickets/${id}`, { accessToken: options.accessToken });
}

export function createAdminTicket(input: CreateAdminTicketInput, options: SupportRequestOptions = {}) {
  return supportFetch<AdminTicketDetail>("/admin/support/tickets", { accessToken: options.accessToken, body: input, method: "POST" });
}

export function staffReplyToTicket(id: string, input: ReplyTicketInput, options: SupportRequestOptions = {}) {
  return supportFetch(`/admin/support/tickets/${id}/replies`, { accessToken: options.accessToken, body: input, method: "POST" });
}

export function getAdminTicketAttachmentSignedUrl(ticketId: string, attachmentId: string, options: SupportRequestOptions = {}) {
  return supportFetch<SupportSignedUrl>(`/admin/support/tickets/${ticketId}/attachments/${attachmentId}/signed-url`, { accessToken: options.accessToken });
}

export function toTicketAttachmentInput(upload: { fileName: string; id: string; mimeType: string; originalName?: string | null; sizeBytes: string | number }): TicketAttachmentInput {
  return {
    fileName: upload.originalName || upload.fileName,
    mimeType: upload.mimeType,
    sizeBytes: Number(upload.sizeBytes),
    uploadId: upload.id,
  };
}

export function addTicketInternalNote(id: string, body: string, options: SupportRequestOptions = {}) {
  return supportFetch(`/admin/support/tickets/${id}/internal-notes`, { accessToken: options.accessToken, body: { body }, method: "POST" });
}

export function updateTicketStatus(id: string, status: TicketStatus, options: SupportRequestOptions = {}) {
  return supportFetch(`/admin/support/tickets/${id}/status`, { accessToken: options.accessToken, body: { status }, method: "PATCH" });
}

export function updateTicketPriority(id: string, priority: TicketPriority, options: SupportRequestOptions = {}) {
  return supportFetch(`/admin/support/tickets/${id}/priority`, { accessToken: options.accessToken, body: { priority }, method: "PATCH" });
}

export function assignTicket(id: string, assignedToId?: string, options: SupportRequestOptions = {}) {
  return supportFetch(`/admin/support/tickets/${id}/assignee`, { accessToken: options.accessToken, body: { assignedToId }, method: "PATCH" });
}

export function getTicketDepartments(query: TicketListQuery = {}, options: SupportRequestOptions = {}) {
  return supportFetch<{ items: TicketDepartment[]; page: number; pageSize: number; total: number; totalPages: number }>(`/admin/support/departments${toQuery(query)}`, { accessToken: options.accessToken });
}

async function supportFetch<T = unknown>(path: string, init: { accessToken?: string; body?: unknown; method?: string } = {}) {
  const token = init.accessToken ?? getStoredAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: init.method ?? "GET",
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(readApiError(payload) ?? `Support request failed: ${response.status}`);
  }
  return payload as T;
}

function toQuery(query: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if ((typeof value === "string" || typeof value === "number") && value !== "") params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
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
